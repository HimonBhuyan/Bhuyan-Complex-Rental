const { Bill, Tenant, Notification } = require('../../models');
const emailService = require('./emailService');

class PenaltyService {
  constructor(broadcastFunction = null) {
    this.broadcastToClients = broadcastFunction;
    this.PENALTY_RATE = 50; // ₹50 per day
    this.PENALTY_APPLICATION_DAY = 10; // not used for daily logic now
  }

  async applyMonthlyPenalties() {
    try {
      const currentDate = new Date();
      const unpaidBills = await Bill.find({
        status: { $in: ['pending', 'partially_paid', 'overdue'] },
        dueDate: { $lt: currentDate }
      })
        .populate('tenant', 'name username email')
        .populate('room', 'roomNumber');

      let penaltyApplied = 0;
      let totalPenaltyAmount = 0;

      for (const bill of unpaidBills) {
        const penaltyResult = await this.applyPenaltyToBill(bill, currentDate);
        if (penaltyResult.applied) {
          penaltyApplied++;
          totalPenaltyAmount += penaltyResult.amount;
        }
      }

      if (this.broadcastToClients && penaltyApplied > 0) {
        this.broadcastToClients({
          type: 'PENALTIES_APPLIED',
          count: penaltyApplied,
          totalAmount: totalPenaltyAmount,
        });
      }

      return {
        success: true,
        penaltiesApplied: penaltyApplied,
        totalPenaltyAmount,
        processedBills: unpaidBills.length,
      };
    } catch (error) {
      console.error('❌ [PenaltyService] Error applying penalties:', error);
      throw error;
    }
  }

  async applyPenaltyToBill(bill, currentDate = new Date()) {
    try {
      // skip paid bills
      if (bill.status === 'paid') return { applied: false, amount: 0, reason: 'Already paid' };

      const dueDate = new Date(bill.dueDate);
      if (currentDate <= dueDate) return { applied: false, amount: 0, reason: 'Not overdue yet' };

      // Calculate days overdue
      const diffInMs = currentDate - dueDate;
      const daysOverdue = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      // Calculate penalty: ₹50 per day
      const penaltyAmount = daysOverdue * this.PENALTY_RATE;

      // CRITICAL FIX: Calculate base amount (without penalty) from bill items
      // Always calculate from items first as the source of truth
      let originalAmount = 0;
      let calculatedFromItems = false;
      
      if (bill.items) {
        // Sum all items
        originalAmount += bill.items.rent?.amount || 0;
        originalAmount += bill.items.electricity?.amount || 0;
        originalAmount += bill.items.waterBill?.amount || 0;
        originalAmount += bill.items.commonAreaCharges?.amount || 0;
        
        // Additional charges
        if (bill.items.additionalCharges && Array.isArray(bill.items.additionalCharges)) {
          originalAmount += bill.items.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
        }
        
        // Utilities (nested object)
        if (bill.items.utilities && typeof bill.items.utilities === 'object') {
          Object.values(bill.items.utilities).forEach(utility => {
            if (utility && typeof utility === 'object' && utility.amount) {
              originalAmount += utility.amount || 0;
            }
          });
        }
        
        calculatedFromItems = originalAmount > 0;
      }
      
      // Fallback: If items don't add up or are missing, extract from totalAmount
      // This handles legacy bills where items might not be structured correctly
      if (originalAmount <= 0) {
        const existingPenalty = bill.penalty?.amount || 0;
        originalAmount = bill.totalAmount - existingPenalty;
        console.log(`⚠️ [PenaltyService] Using extracted base amount for bill ${bill.billNumber}: ₹${originalAmount} (totalAmount: ₹${bill.totalAmount}, existingPenalty: ₹${existingPenalty})`);
      }
      
      // Ensure originalAmount is positive
      if (originalAmount <= 0) {
        console.error(`❌ [PenaltyService] Invalid base amount for bill ${bill.billNumber}: ₹${originalAmount}. Using totalAmount as fallback.`);
        originalAmount = bill.totalAmount - (bill.penalty?.amount || 0);
      }

      // Update penalty information
      bill.penalty = bill.penalty || {};
      bill.penalty.amount = penaltyAmount;
      bill.penalty.days = daysOverdue;
      bill.penalty.rate = this.PENALTY_RATE;
      bill.penalty.appliedDate = currentDate;

      // Update totals: original amount + penalty
      bill.totalAmount = originalAmount + penaltyAmount;
      bill.remainingAmount = Math.max(0, bill.totalAmount - bill.paidAmount);

      if (bill.status === 'pending' || bill.status === 'partially_paid') {
        bill.status = 'overdue';
      }

      await bill.save();

      // Send notification (don't let this break the penalty application)
      try {
        await this.sendPenaltyNotification(bill, penaltyAmount);
      } catch (notifError) {
        console.warn(`⚠️ [PenaltyService] Failed to send notification for bill ${bill.billNumber}:`, notifError.message);
        // Continue - penalty was applied successfully
      }

      console.log(`✅ [PenaltyService] Applied ₹${penaltyAmount} penalty (${daysOverdue} days) to bill ${bill.billNumber}`);
      console.log(`   Base Amount: ₹${originalAmount} ${calculatedFromItems ? '(from items)' : '(extracted from total)'}, Penalty: ₹${penaltyAmount}, Total: ₹${bill.totalAmount}`);

      return { applied: true, amount: penaltyAmount };
    } catch (error) {
      console.error(`❌ [PenaltyService] Error applying penalty to bill ${bill.billNumber}:`, error);
      throw error;
    }
  }

  async sendPenaltyNotification(bill, penaltyAmount) {
    try {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const notification = new Notification({
        title: 'Late Payment Penalty Applied',
        message: `A late payment penalty of ₹${penaltyAmount} (₹50/day) has been added to your ${monthNames[bill.month - 1]} ${bill.year} bill. Total outstanding: ₹${bill.remainingAmount}.`,
        type: 'personal',
        category: 'warning',
        priority: 'high',
        recipients: [{ tenant: bill.tenant._id }]
      });

      await notification.save();

      if (this.broadcastToClients) {
        this.broadcastToClients({
          type: 'NEW_NOTIFICATION',
          notification: await Notification.findById(notification._id)
            .populate('recipients.tenant', 'name username'),
        });
      }

      if (bill.tenant.email) {
        await emailService.sendLateFeeNotification(
          bill.tenant.email,
          bill.tenant.name,
          {
            billNumber: bill.billNumber,
            month: bill.month,
            year: bill.year,
            dueDate: bill.dueDate,
            lateFee: penaltyAmount,
            totalOutstanding: bill.remainingAmount
          }
        );
      }
    } catch (error) {
      console.error('❌ [PenaltyService] Error sending penalty notification:', error);
    }
  }

  calculateCurrentPenalty(bill, currentDate = new Date()) {
    if (!bill || bill.status === 'paid') {
      return { amount: 0, days: 0, shouldApply: false };
    }

    const dueDate = new Date(bill.dueDate);
    if (currentDate <= dueDate) return { amount: 0, days: 0, shouldApply: false };

    const diffInMs = currentDate - dueDate;
    const daysOverdue = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const amount = daysOverdue * this.PENALTY_RATE;

    return { amount, days: daysOverdue, shouldApply: true };
  }

  // Add missing methods that are called in the routes
  async getPenaltyHistory(billId) {
    try {
      const bill = await Bill.findById(billId)
        .populate('tenant', 'name username')
        .populate('room', 'roomNumber');

      if (!bill) {
        throw new Error('Bill not found');
      }

      return {
        bill: {
          id: bill._id,
          billNumber: bill.billNumber,
          month: bill.month,
          year: bill.year,
          status: bill.status
        },
        penalty: {
          amount: bill.penalty?.amount || 0,
          days: bill.penalty?.days || 0,
          appliedDate: bill.penalty?.appliedDate || null
        }
      };
    } catch (error) {
      console.error('❌ [PenaltyService] Error getting penalty history:', error);
      throw error;
    }
  }

  async adjustPenalty(billId, adjustment) {
    try {
      const bill = await Bill.findById(billId);
      
      if (!bill) {
        throw new Error('Bill not found');
      }

      const currentPenalty = bill.penalty?.amount || 0;
      const newPenalty = Math.max(0, currentPenalty + adjustment);
      
      // Calculate base amount (without penalty) - same logic as applyPenaltyToBill
      const baseAmount = bill.totalAmount - currentPenalty;
      
      // Update penalty
      bill.penalty = bill.penalty || {};
      bill.penalty.amount = newPenalty;
      
      // Recalculate total: base amount + new penalty
      bill.totalAmount = baseAmount + newPenalty;
      bill.remainingAmount = Math.max(0, bill.totalAmount - bill.paidAmount);
      
      await bill.save();

      console.log(`✅ [PenaltyService] Adjusted penalty for bill ${bill.billNumber}: ${currentPenalty} → ${newPenalty}`);

      return {
        previousPenalty: currentPenalty,
        newPenalty,
        adjustment,
        totalAmount: bill.totalAmount
      };
    } catch (error) {
      console.error('❌ [PenaltyService] Error adjusting penalty:', error);
      throw error;
    }
  }

  /**
   * Recalculate penalties for all existing bills to fix any incorrect calculations
   * This method should be run once to fix old bills with wrong penalty amounts
   */
  async recalculateAllPenalties(currentDate = new Date()) {
    try {
      console.log('🔄 [PenaltyService] Starting recalculation of penalties for all bills...');
      
      const unpaidBills = await Bill.find({
        status: { $in: ['pending', 'partially_paid', 'overdue'] }
      })
        .populate('tenant', 'name username email')
        .populate('room', 'roomNumber');

      let recalculated = 0;
      let totalPenaltyCorrection = 0;

      for (const bill of unpaidBills) {
        const dueDate = new Date(bill.dueDate);
        
        // Only recalculate if bill is overdue
        if (currentDate > dueDate) {
          const oldPenalty = bill.penalty?.amount || 0;
          
          // Calculate what the penalty should be
          const diffInMs = currentDate - dueDate;
          const daysOverdue = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          const correctPenalty = daysOverdue * this.PENALTY_RATE;
          
          // Only update if penalty is different
          if (Math.abs(oldPenalty - correctPenalty) > 1) { // Allow 1 rupee tolerance for rounding
            // Calculate base amount from bill items
            let baseAmount = 0;
            if (bill.items) {
              baseAmount += bill.items.rent?.amount || 0;
              baseAmount += bill.items.electricity?.amount || 0;
              baseAmount += bill.items.waterBill?.amount || 0;
              baseAmount += bill.items.commonAreaCharges?.amount || 0;
              if (bill.items.additionalCharges && Array.isArray(bill.items.additionalCharges)) {
                baseAmount += bill.items.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
              }
              if (bill.items.utilities) {
                Object.values(bill.items.utilities).forEach(utility => {
                  if (utility && typeof utility === 'object' && utility.amount) {
                    baseAmount += utility.amount || 0;
                  }
                });
              }
            }
            
            // If we can't calculate from items, extract from totalAmount
            if (baseAmount <= 0) {
              baseAmount = bill.totalAmount - oldPenalty;
            }

            // Update penalty
            bill.penalty = bill.penalty || {};
            bill.penalty.amount = correctPenalty;
            bill.penalty.days = daysOverdue;
            bill.penalty.rate = this.PENALTY_RATE;
            bill.penalty.appliedDate = currentDate;

            // Update totals
            bill.totalAmount = baseAmount + correctPenalty;
            bill.remainingAmount = Math.max(0, bill.totalAmount - bill.paidAmount);

            if (bill.status === 'pending') {
              bill.status = 'overdue';
            }

            await bill.save();
            
            const correction = correctPenalty - oldPenalty;
            totalPenaltyCorrection += correction;
            recalculated++;
            
            console.log(`✅ [PenaltyService] Recalculated bill ${bill.billNumber}: ${daysOverdue} days overdue`);
            console.log(`   Old penalty: ₹${oldPenalty}, New penalty: ₹${correctPenalty}, Correction: ₹${correction}`);
            console.log(`   Base: ₹${baseAmount}, Total: ₹${bill.totalAmount}`);
          }
        }
      }

      console.log(`✅ [PenaltyService] Recalculation complete: ${recalculated} bills updated`);
      console.log(`   Total penalty correction: ₹${totalPenaltyCorrection}`);

      return {
        success: true,
        recalculated,
        totalPenaltyCorrection,
        processedBills: unpaidBills.length
      };
    } catch (error) {
      console.error('❌ [PenaltyService] Error recalculating penalties:', error);
      throw error;
    }
  }
}

module.exports = PenaltyService;