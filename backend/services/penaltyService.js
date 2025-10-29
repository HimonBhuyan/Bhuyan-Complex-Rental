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

      // Calculate penalty
      const penaltyAmount = daysOverdue * this.PENALTY_RATE;

      // CRITICAL FIX: Calculate original amount by removing existing penalty
      const originalAmount = bill.totalAmount - (bill.penalty?.amount || 0);

      // Update penalty information
      bill.penalty.amount = penaltyAmount;
      bill.penalty.days = daysOverdue;
      bill.penalty.appliedDate = currentDate;

      // Update totals with the correct original amount
      bill.totalAmount = originalAmount + penaltyAmount;
      bill.remainingAmount = Math.max(0, bill.totalAmount - bill.paidAmount);

      if (bill.status === 'pending') {
        bill.status = 'overdue';
      }

      await bill.save();

      await this.sendPenaltyNotification(bill, penaltyAmount);

      console.log(`✅ [PenaltyService] Applied ₹${penaltyAmount} penalty (${daysOverdue} days) to bill ${bill.billNumber}`);
      console.log(`   Original: ₹${originalAmount}, Penalty: ₹${penaltyAmount}, Total: ₹${bill.totalAmount}`);

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
      
      // Calculate original amount (without any penalty)
      const originalAmount = bill.totalAmount - currentPenalty;
      
      // Update penalty
      bill.penalty.amount = newPenalty;
      
      // Recalculate total
      bill.totalAmount = originalAmount + newPenalty;
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
}

module.exports = PenaltyService;