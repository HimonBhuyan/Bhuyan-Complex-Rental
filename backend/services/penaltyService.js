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

      bill.penalty.amount = penaltyAmount;
      bill.penalty.days = daysOverdue;
      bill.penalty.appliedDate = currentDate;

      // Update totals
      bill.totalAmount = bill.originalAmount + penaltyAmount;
      bill.remainingAmount = Math.max(0, bill.totalAmount - bill.paidAmount);

      if (bill.status === 'pending') {
        bill.status = 'overdue';
      }

      await bill.save();

      await this.sendPenaltyNotification(bill, penaltyAmount);

      console.log(`✅ [PenaltyService] Applied ₹${penaltyAmount} penalty (${daysOverdue} days) to bill ${bill.billNumber}`);

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
}

module.exports = PenaltyService;
