const express = require('express');
const router = express.Router();
const { Tenant, Bill, Payment } = require('../../models');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get tenant dashboard data
router.get('/dashboard', authenticateToken, authorizeRole(['tenant']), async (req, res) => {
  try {
    const tenantId = req.user.id;

    // Get tenant details with populated room info
    const tenant = await Tenant.findById(tenantId).populate({
      path: 'room',
      select: 'roomNumber type rent securityDeposit utilities floor building'
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Get bills for this tenant
    const bills = await Bill.find({ tenant: tenantId })
      .sort({ generatedAt: -1 })
      .limit(50);

    // Get payment history
    const payments = await Payment.find({ tenant: tenantId })
      .populate('bill', 'billNumber month year')
      .sort({ paidAt: -1 })
      .limit(20);

    // Calculate penalty for overdue bills
    const currentDate = new Date();
    const updatedBills = bills.map(bill => {
      if (bill.status !== 'paid' && bill.dueDate < currentDate) {
        const daysOverdue = Math.ceil((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24));
        const penaltyPerDay = bill.totalAmount * 0.01; // 1% per day
        const penaltyAmount = Math.min(daysOverdue * penaltyPerDay, bill.totalAmount * 0.25); // Max 25% penalty

        bill.penalty = {
          amount: Math.round(penaltyAmount),
          days: daysOverdue
        };
        
        if (bill.status === 'pending') {
          bill.status = 'overdue';
        }
      } else {
        bill.penalty = {
          amount: 0,
          days: 0
        };
      }
      return bill;
    });

    res.json({
      success: true,
      tenant: tenant,
      bills: updatedBills,
      payments: payments,
      summary: {
        totalBills: bills.length,
        pendingBills: updatedBills.filter(b => b.status !== 'paid').length,
        totalDue: updatedBills
          .filter(b => b.status !== 'paid')
          .reduce((sum, b) => sum + b.totalAmount + b.penalty.amount, 0),
        lastPayment: payments.length > 0 ? payments[0].paidAt : null
      }
    });

  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get bill details
router.get('/bills/:billId', authenticateToken, authorizeRole(['tenant']), async (req, res) => {
  try {
    const { billId } = req.params;
    const tenantId = req.user.id;

    const bill = await Bill.findOne({
      _id: billId,
      tenant: tenantId
    }).populate('tenant', 'name email phone');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Calculate penalty if overdue
    const currentDate = new Date();
    if (bill.status !== 'paid' && bill.dueDate < currentDate) {
      const daysOverdue = Math.ceil((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24));
      const penaltyPerDay = bill.totalAmount * 0.01;
      const penaltyAmount = Math.min(daysOverdue * penaltyPerDay, bill.totalAmount * 0.25);

      bill.penalty = {
        amount: Math.round(penaltyAmount),
        days: daysOverdue
      };
    }

    res.json({
      success: true,
      bill: bill
    });

  } catch (error) {
    console.error('Bill fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill details'
    });
  }
});

// Generate PDF invoice for a bill
router.get('/bills/:billId/pdf', authenticateToken, authorizeRole(['tenant']), async (req, res) => {
  try {
    const { billId } = req.params;
    const tenantId = req.user.id;

    // Fetch bill with proper population
    const bill = await Bill.findOne({
      _id: billId,
      tenant: tenantId
    }).populate({
      path: 'tenant',
      select: 'name email phone room',
      populate: {
        path: 'room',
        select: 'roomNumber type floor'
      }
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Import PDF service
    const PDFService = require('../services/pdfService');
    
    // Generate PDF using service
    const doc = await PDFService.generateBillInvoice(bill, bill.tenant, bill.tenant.room);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${bill.billNumber}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);
    
    // End the document
    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF invoice'
    });
  }
});


// Get notifications for tenant
router.get('/notifications', authenticateToken, authorizeRole(['tenant']), async (req, res) => {
  try {
    const tenantId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // This would typically come from a Notification model
    // For now, returning mock notifications
    const notifications = [
      {
        id: '1',
        title: 'New Bill Generated',
        message: `Your bill for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} has been generated.`,
        date: new Date(),
        read: false,
        type: 'bill'
      },
      {
        id: '2',
        title: 'Payment Reminder',
        message: 'Your bill is due in 3 days. Please make the payment to avoid late fees.',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        read: false,
        type: 'reminder'
      },
      {
        id: '3',
        title: 'Maintenance Notice',
        message: 'Scheduled maintenance for elevator on Sunday from 10 AM to 2 PM.',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        read: true,
        type: 'notice'
      }
    ];

    res.json({
      success: true,
      notifications: notifications,
      unreadCount: notifications.filter(n => !n.read).length,
      pagination: {
        currentPage: parseInt(page),
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    });

  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', authenticateToken, authorizeRole(['tenant']), async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    // This would typically update the notification in database
    // For now, just returning success
    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification'
    });
  }
});

// Report an issue
router.post('/issues', authenticateToken, authorizeRole(['tenant']), async (req, res) => {
  try {
    const tenantId = req.user.id;
    const { title, description, priority, category } = req.body;

    // This would typically save to an Issues/Complaints model
    const issue = {
      id: Date.now().toString(),
      tenant: tenantId,
      title,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      status: 'open',
      createdAt: new Date()
    };

    res.json({
      success: true,
      message: 'Issue reported successfully',
      issue: issue
    });

  } catch (error) {
    console.error('Issue reporting error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report issue'
    });
  }
});

module.exports = router;