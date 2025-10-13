const { Bill, Tenant, Notification } = require('../../models');
const emailService = require('./emailService');

class PenaltyService {
  constructor(broadcastFunction = null) {
    this.broadcastToClients = broadcastFunction;
    this.PENALTY_RATE = 50; // ₹50 per month
    this.PENALTY_APPLICATION_DAY = 10; // 10th of every month
  }

  /**
   * Apply monthly penalties to all unpaid bills
   * This should run on the 10th of every month
   */
  async applyMonthlyPenalties() {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      console.log(`📅 [PenaltyService] Starting monthly penalty application for ${currentMonth}/${currentYear}`);
      
      // Find all unpaid or partially paid bills that are past due
      const unpaidBills = await Bill.find({
        status: { $in: ['pending', 'partially_paid', 'overdue'] },
        dueDate: { $lt: currentDate }
      })
      .populate('tenant', 'name username email')
      .populate('room', 'roomNumber');
      
      console.log(`📊 [PenaltyService] Found ${unpaidBills.length} unpaid bills to process`);
      
      let penaltyApplied = 0;
      let penaltyAmount = 0;
      
      for (const bill of unpaidBills) {
        const penaltyResult = await this.applyPenaltyToBill(bill, currentDate);
        if (penaltyResult.applied) {
          penaltyApplied++;
          penaltyAmount += penaltyResult.amount;
        }
      }
      
      console.log(`✅ [PenaltyService] Applied penalties to ${penaltyApplied} bills, total penalty: ₹${penaltyAmount}`);
      
      // Broadcast penalty update if available
      if (this.broadcastToClients && penaltyApplied > 0) {
        this.broadcastToClients({
          type: 'PENALTIES_APPLIED',
          count: penaltyApplied,
          totalAmount: penaltyAmount,
          month: currentMonth,
          year: currentYear
        });
      }
      
      return {
        success: true,
        penaltiesApplied: penaltyApplied,
        totalPenaltyAmount: penaltyAmount,
        processedBills: unpaidBills.length
      };
      
    } catch (error) {
      console.error('❌ [PenaltyService] Error applying monthly penalties:', error);
      throw error;
    }
  }

  /**
   * Apply penalty to a specific bill
   * @param {Object} bill - The bill document
   * @param {Date} currentDate - Current date for calculation
   */
  async applyPenaltyToBill(bill, currentDate = new Date()) {
    try {
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      // Check if penalty has already been applied this month
      if (bill.penalty.appliedDate) {
        const penaltyMonth = bill.penalty.appliedDate.getMonth() + 1;
        const penaltyYear = bill.penalty.appliedDate.getFullYear();
        
        if (penaltyMonth === currentMonth && penaltyYear === currentYear) {
          console.log(`⏭️ [PenaltyService] Penalty already applied this month for bill ${bill.billNumber}`);
          return { applied: false, amount: 0, reason: 'Already applied this month' };
        }
      }
      
      // Calculate months overdue
      const billDate = new Date(bill.year, bill.month - 1, 1);
      const monthsOverdue = Math.max(1, (currentYear - bill.year) * 12 + currentMonth - bill.month);
      
      // Apply penalty
      const penaltyAmount = this.PENALTY_RATE;
      
      bill.penalty.amount = (bill.penalty.amount || 0) + penaltyAmount;
      bill.penalty.days = monthsOverdue * 30; // Approximate days for display
      bill.penalty.appliedDate = currentDate;
      
      // Update total and remaining amounts
      bill.totalAmount += penaltyAmount;
      bill.remainingAmount = Math.max(0, bill.totalAmount - bill.paidAmount);
      
      // Update status to overdue if not already
      if (bill.status === 'pending') {
        bill.status = 'overdue';
      }
      
      await bill.save();
      
      console.log(`✅ [PenaltyService] Applied ₹${penaltyAmount} penalty to bill ${bill.billNumber} for tenant ${bill.tenant.name}`);
      
      // Send notification to tenant
      await this.sendPenaltyNotification(bill, penaltyAmount);
      
      return { applied: true, amount: penaltyAmount };
      
    } catch (error) {
      console.error(`❌ [PenaltyService] Error applying penalty to bill ${bill.billNumber}:`, error);
      throw error;
    }
  }

  /**
   * Send penalty notification to tenant (both in-app and email)
   */
  async sendPenaltyNotification(bill, penaltyAmount) {
    try {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      // Send in-app notification
      const notification = new Notification({
        title: 'Late Payment Penalty Applied',
        message: `A late payment penalty of ₹${penaltyAmount} has been added to your ${monthNames[bill.month - 1]} ${bill.year} bill. Total outstanding amount: ₹${bill.remainingAmount}. Please pay as soon as possible to avoid additional penalties.`,
        type: 'personal',
        category: 'warning',
        priority: 'high',
        recipients: [{
          tenant: bill.tenant._id
        }]
      });
      
      await notification.save();
      
      // Broadcast notification if available
      if (this.broadcastToClients) {
        this.broadcastToClients({
          type: 'NEW_NOTIFICATION',
          notification: await Notification.findById(notification._id)
            .populate('recipients.tenant', 'name username')
        });
      }
      
      console.log(`📧 [PenaltyService] In-app penalty notification sent to ${bill.tenant.name}`);
      
      // Send email notification
      if (bill.tenant.email) {
        const emailResult = await emailService.sendLateFeeNotification(
          bill.tenant.email,
          bill.tenant.name,
          {
            billNumber: bill.billNumber,
            month: bill.month,
            year: bill.year,
            dueDate: bill.dueDate,
            originalAmount: bill.totalAmount - penaltyAmount,
            lateFee: penaltyAmount,
            totalOutstanding: bill.remainingAmount
          }
        );
        
        if (emailResult.success) {
          console.log(`✅ [PenaltyService] Email notification sent to ${bill.tenant.email}`);
        } else if (!emailResult.devMode) {
          console.log(`⚠️ [PenaltyService] Failed to send email to ${bill.tenant.email}: ${emailResult.error}`);
        }
      } else {
        console.log(`⚠️ [PenaltyService] No email address for tenant ${bill.tenant.name}`);
      }
      
    } catch (error) {
      console.error(`❌ [PenaltyService] Error sending penalty notification:`, error);
      // Don't throw - penalty was applied successfully, notification failure shouldn't break the process
    }
  }

  /**
   * Calculate current penalty for a bill without applying it
   */
  calculateCurrentPenalty(bill, currentDate = new Date()) {
    if (!bill || bill.status === 'paid') {
      return { amount: 0, months: 0, shouldApply: false };
    }
    
    const dueDate = new Date(bill.dueDate);
    if (currentDate <= dueDate) {
      return { amount: 0, months: 0, shouldApply: false };
    }
    
    // Check if penalty was already applied this month
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    let shouldApply = true;
    if (bill.penalty.appliedDate) {
      const penaltyMonth = bill.penalty.appliedDate.getMonth() + 1;
      const penaltyYear = bill.penalty.appliedDate.getFullYear();
      shouldApply = !(penaltyMonth === currentMonth && penaltyYear === currentYear);
    }
    
    // Calculate months overdue
    const billDate = new Date(bill.year, bill.month - 1, 1);
    const monthsOverdue = Math.max(1, (currentYear - bill.year) * 12 + currentMonth - bill.month);
    
    return {
      amount: this.PENALTY_RATE,
      months: monthsOverdue,
      shouldApply: shouldApply,
      totalPenalty: bill.penalty.amount || 0
    };
  }

  /**
   * Get penalty history for a bill
   */
  async getPenaltyHistory(billId) {
    try {
      const bill = await Bill.findById(billId)
        .populate('tenant', 'name username')
        .populate('room', 'roomNumber');
      
      if (!bill) {
        throw new Error('Bill not found');
      }
      
      const history = [];
      
      if (bill.penalty.amount > 0) {
        history.push({
          date: bill.penalty.appliedDate || bill.dueDate,
          amount: bill.penalty.amount,
          reason: 'Monthly late payment penalty',
          months: Math.ceil(bill.penalty.days / 30) || 1
        });
      }
      
      return {
        bill: {
          id: bill._id,
          billNumber: bill.billNumber,
          month: bill.month,
          year: bill.year,
          tenant: bill.tenant,
          room: bill.room,
          originalAmount: bill.totalAmount - (bill.penalty.amount || 0),
          penaltyAmount: bill.penalty.amount || 0,
          totalAmount: bill.totalAmount
        },
        penaltyHistory: history
      };
      
    } catch (error) {
      console.error('❌ [PenaltyService] Error getting penalty history:', error);
      throw error;
    }
  }

  /**
   * Remove or adjust penalty from a bill (admin function)
   */
  async adjustPenalty(billId, adjustment) {
    try {
      const bill = await Bill.findById(billId);
      if (!bill) {
        throw new Error('Bill not found');
      }
      
      const originalPenalty = bill.penalty.amount || 0;
      const newPenalty = Math.max(0, originalPenalty + adjustment);
      const penaltyDifference = newPenalty - originalPenalty;
      
      bill.penalty.amount = newPenalty;
      bill.totalAmount += penaltyDifference;
      bill.remainingAmount = Math.max(0, bill.totalAmount - bill.paidAmount);
      
      // Reset penalty application date if penalty is removed
      if (newPenalty === 0) {
        bill.penalty.appliedDate = null;
        bill.penalty.days = 0;
      }
      
      await bill.save();
      
      console.log(`🔧 [PenaltyService] Penalty adjusted by ₹${adjustment} for bill ${bill.billNumber}`);
      
      return {
        success: true,
        originalPenalty,
        newPenalty,
        adjustment: penaltyDifference
      };
      
    } catch (error) {
      console.error('❌ [PenaltyService] Error adjusting penalty:', error);
      throw error;
    }
  }
}

module.exports = PenaltyService;