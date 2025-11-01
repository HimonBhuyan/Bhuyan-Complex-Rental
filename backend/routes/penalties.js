const express = require('express');
const router = express.Router();
const PenaltyService = require('../services/penaltyService');
const { Bill } = require('../../models');

// Initialize penalty service (will be set with broadcast function in server.js)
let penaltyService = new PenaltyService();

// Set broadcast function for the penalty service
function setPenaltyServiceBroadcast(broadcastFunction) {
  penaltyService = new PenaltyService(broadcastFunction);
}

// Apply penalties manually (Admin only)
router.post('/apply-monthly', async (req, res) => {
  try {
    console.log('🎯 [PenaltyAPI] Manual penalty application requested');
    
    const result = await penaltyService.applyMonthlyPenalties();
    
    res.json({
      success: true,
      message: `Applied penalties to ${result.penaltiesApplied} bills`,
      ...result
    });
  } catch (error) {
    console.error('❌ [PenaltyAPI] Error applying penalties:', error);
    res.status(500).json({ 
      error: 'Failed to apply penalties',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Apply penalty to specific bill (Admin only)
router.post('/apply/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    
    console.log(`🎯 [PenaltyAPI] Applying penalty to bill ${billId}`);
    
    const bill = await Bill.findById(billId)
      .populate('tenant', 'name username email')
      .populate('room', 'roomNumber');
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    const result = await penaltyService.applyPenaltyToBill(bill);
    
    res.json({
      success: true,
      message: result.applied ? 'Penalty applied successfully' : 'Penalty not applied',
      result,
      bill: {
        id: bill._id,
        billNumber: bill.billNumber,
        tenantName: bill.tenant.name,
        totalAmount: bill.totalAmount,
        penaltyAmount: bill.penalty.amount
      }
    });
  } catch (error) {
    console.error('❌ [PenaltyAPI] Error applying penalty to bill:', error);
    res.status(500).json({ 
      error: 'Failed to apply penalty to bill',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Calculate penalty for a bill without applying (Admin/Tenant)
router.get('/calculate/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    
    const bill = await Bill.findById(billId)
      .populate('tenant', 'name username')
      .populate('room', 'roomNumber');
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    const penaltyInfo = penaltyService.calculateCurrentPenalty(bill);
    
    res.json({
      success: true,
      bill: {
        id: bill._id,
        billNumber: bill.billNumber,
        month: bill.month,
        year: bill.year,
        status: bill.status,
        dueDate: bill.dueDate,
        originalAmount: bill.totalAmount - (bill.penalty.amount || 0),
        currentPenalty: bill.penalty.amount || 0,
        totalAmount: bill.totalAmount
      },
      penalty: penaltyInfo
    });
  } catch (error) {
    console.error('❌ [PenaltyAPI] Error calculating penalty:', error);
    res.status(500).json({ 
      error: 'Failed to calculate penalty',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get penalty history for a bill (Admin/Tenant)
router.get('/history/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    
    const history = await penaltyService.getPenaltyHistory(billId);
    
    res.json({
      success: true,
      ...history
    });
  } catch (error) {
    console.error('❌ [PenaltyAPI] Error getting penalty history:', error);
    res.status(500).json({ 
      error: 'Failed to get penalty history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Adjust penalty for a bill (Admin only)
router.put('/adjust/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    const { adjustment, reason } = req.body;
    
    if (typeof adjustment !== 'number') {
      return res.status(400).json({ error: 'Adjustment amount must be a number' });
    }
    
    console.log(`🔧 [PenaltyAPI] Adjusting penalty for bill ${billId} by ₹${adjustment}`);
    
    const result = await penaltyService.adjustPenalty(billId, adjustment);
    
    // Get updated bill info
    const updatedBill = await Bill.findById(billId)
      .populate('tenant', 'name username')
      .populate('room', 'roomNumber');
    
    res.json({
      success: true,
      message: `Penalty adjusted by ₹${adjustment}`,
      adjustment: result,
      bill: {
        id: updatedBill._id,
        billNumber: updatedBill.billNumber,
        tenantName: updatedBill.tenant.name,
        totalAmount: updatedBill.totalAmount,
        penaltyAmount: updatedBill.penalty.amount || 0
      },
      reason: reason || 'Admin adjustment'
    });
  } catch (error) {
    console.error('❌ [PenaltyAPI] Error adjusting penalty:', error);
    res.status(500).json({ 
      error: 'Failed to adjust penalty',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Remove penalty from a bill (Admin only)
router.delete('/remove/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    const { reason } = req.body;
    
    console.log(`🗑️ [PenaltyAPI] Removing penalty from bill ${billId}`);
    
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    const originalPenalty = bill.penalty.amount || 0;
    const adjustment = -originalPenalty;
    
    const result = await penaltyService.adjustPenalty(billId, adjustment);
    
    res.json({
      success: true,
      message: `Penalty of ₹${originalPenalty} removed`,
      removedAmount: originalPenalty,
      reason: reason || 'Admin removal'
    });
  } catch (error) {
    console.error('❌ [PenaltyAPI] Error removing penalty:', error);
    res.status(500).json({ 
      error: 'Failed to remove penalty',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get penalty statistics (Admin only)
router.get('/statistics', async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    // Get all bills with penalties
    const billsWithPenalties = await Bill.find({
      'penalty.amount': { $gt: 0 }
    }).populate('tenant', 'name username');
    
    // Get bills from specific month if requested
    const monthlyBills = await Bill.find({
      month: targetMonth,
      year: targetYear,
      status: { $in: ['pending', 'overdue', 'partially_paid'] }
    });
    
    // Calculate statistics
    const totalPenaltyAmount = billsWithPenalties.reduce((sum, bill) => 
      sum + (bill.penalty.amount || 0), 0
    );
    
    const billsWithPenaltyCount = billsWithPenalties.length;
    const overdueBillsCount = monthlyBills.filter(bill => 
      new Date(bill.dueDate) < currentDate
    ).length;
    
    res.json({
      success: true,
      statistics: {
        totalPenaltyAmount,
        billsWithPenaltyCount,
        overdueBillsCount,
        averagePenaltyPerBill: billsWithPenaltyCount > 0 ? 
          Math.round(totalPenaltyAmount / billsWithPenaltyCount) : 0,
        month: targetMonth,
        year: targetYear
      },
      billsWithPenalties: billsWithPenalties.map(bill => ({
        id: bill._id,
        billNumber: bill.billNumber,
        tenantName: bill.tenant?.name || 'Unknown',
        month: bill.month,
        year: bill.year,
        penaltyAmount: bill.penalty.amount || 0,
        totalAmount: bill.totalAmount,
        status: bill.status
      }))
    });
  } catch (error) {
    console.error('❌ [PenaltyAPI] Error getting penalty statistics:', error);
    res.status(500).json({ 
      error: 'Failed to get penalty statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get penalty settings (Admin only)
router.get('/settings', async (req, res) => {
  try {
    res.json({
      success: true,
      settings: {
        penaltyRate: penaltyService.PENALTY_RATE,
        applicationDay: penaltyService.PENALTY_APPLICATION_DAY,
        penaltyType: 'Daily Rate (₹50/day)',
        currency: '₹',
        autoApplication: true
      }
    });
  } catch (error) {
    console.error('❌ [PenaltyAPI] Error getting penalty settings:', error);
    res.status(500).json({ 
      error: 'Failed to get penalty settings',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Recalculate penalties for all existing bills (Admin only)
// This fixes incorrect penalty calculations in old bills
router.post('/recalculate-all', async (req, res) => {
  try {
    console.log('🔄 [PenaltyAPI] Recalculation request received');
    
    const result = await penaltyService.recalculateAllPenalties();
    
    res.json({
      success: true,
      message: `Recalculated penalties for ${result.recalculated} bills`,
      ...result
    });
  } catch (error) {
    console.error('❌ [PenaltyAPI] Error recalculating penalties:', error);
    res.status(500).json({ 
      error: 'Failed to recalculate penalties',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Test endpoint: Force recalculate a specific bill (for debugging)
router.post('/test-recalculate/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    
    console.log(`🧪 [PenaltyAPI] Testing recalculation for bill ${billId}`);
    
    const bill = await Bill.findById(billId)
      .populate('tenant', 'name username email')
      .populate('room', 'roomNumber');
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    const before = {
      penalty: bill.penalty?.amount || 0,
      days: bill.penalty?.days || 0,
      totalAmount: bill.totalAmount
    };
    
    const currentDate = new Date();
    const daysOverdue = Math.floor((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24));
    const expectedPenalty = daysOverdue * 50;
    
    console.log(`📊 Before: Penalty ₹${before.penalty} (${before.days} days), Total ₹${before.totalAmount}`);
    console.log(`📊 Expected: Penalty ₹${expectedPenalty} (${daysOverdue} days)`);
    
    await penaltyService.applyPenaltyToBill(bill, currentDate);
    
    // Reload bill
    const updatedBill = await Bill.findById(billId);
    
    const after = {
      penalty: updatedBill.penalty?.amount || 0,
      days: updatedBill.penalty?.days || 0,
      totalAmount: updatedBill.totalAmount
    };
    
    console.log(`📊 After: Penalty ₹${after.penalty} (${after.days} days), Total ₹${after.totalAmount}`);
    
    res.json({
      success: true,
      bill: {
        billNumber: updatedBill.billNumber,
        dueDate: updatedBill.dueDate,
        daysOverdue,
        before,
        after,
        expectedPenalty
      }
    });
  } catch (error) {
    console.error('❌ [PenaltyAPI] Error in test recalculation:', error);
    res.status(500).json({ 
      error: 'Failed to test recalculation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = { router, setPenaltyServiceBroadcast };