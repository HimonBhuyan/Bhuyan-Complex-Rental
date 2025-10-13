const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { Bill, Payment, Tenant } = require('../../models');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret'
});

// Create Razorpay order
router.post('/create-order', authenticateToken, authorizeRole(['tenant']), async (req, res) => {
  try {
    const { billId, amount } = req.body;
    const tenantId = req.user.id;

    // Verify bill belongs to tenant
    const bill = await Bill.findOne({
      _id: billId,
      tenant: tenantId,
      status: { $ne: 'paid' }
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found or already paid'
      });
    }

    // Calculate total amount including penalty
    const currentDate = new Date();
    let penaltyAmount = 0;
    
    if (bill.dueDate < currentDate) {
      const daysOverdue = Math.ceil((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24));
      const penaltyPerDay = bill.totalAmount * 0.01;
      penaltyAmount = Math.min(daysOverdue * penaltyPerDay, bill.totalAmount * 0.25);
      penaltyAmount = Math.round(penaltyAmount);
    }

    const totalAmount = bill.totalAmount + penaltyAmount;

    // Enforce configurable online payment limit to avoid gateway caps
    const MAX_ONLINE_PAYMENT_INR = Number(process.env.MAX_ONLINE_PAYMENT_INR || '100000'); // default ₹1,00,000
    if (totalAmount > MAX_ONLINE_PAYMENT_INR) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds online payment limit of ₹${MAX_ONLINE_PAYMENT_INR.toLocaleString()}. Please choose Bank Transfer or Cash, or ask admin to split the bill.`,
        details: 'ONLINE_LIMIT_EXCEEDED',
        limit: MAX_ONLINE_PAYMENT_INR,
        amount: totalAmount
      });
    }

    // Do not rely on client-sent amount; compute securely on server
    // If a client amount is provided and differs significantly, log a warning but proceed
    if (typeof amount === 'number' && !Number.isNaN(amount)) {
      const delta = Math.abs(amount - totalAmount);
      if (delta > 5000) {
        console.warn(`Client amount differs from server by ₹${delta}. billId=${billId}, tenantId=${tenantId}`);
      }
    }

    // Create Razorpay order
    // Razorpay requires receipt length <= 40 characters
    const receiptBase = `b_${bill.billNumber || String(billId).slice(-6)}_${Date.now().toString().slice(-6)}`;
    const receipt = receiptBase.substring(0, 40);

    const options = {
      amount: totalAmount * 100, // Amount in paisa
      currency: 'INR',
      receipt: receipt,
      notes: {
        billId: billId,
        tenantId: tenantId,
        billNumber: bill.billNumber
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      bill: {
        billNumber: bill.billNumber,
        totalAmount: totalAmount,
        penaltyAmount: penaltyAmount
      }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      details: error?.error?.description || error?.message || 'Unknown error'
    });
  }
});

// Verify Razorpay payment
router.post('/verify', authenticateToken, authorizeRole(['tenant']), async (req, res) => {
  try {
    const {
      billId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      screenshot
    } = req.body;

    const tenantId = req.user.id;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'your_key_secret';
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get bill and verify
    const bill = await Bill.findOne({
      _id: billId,
      tenant: tenantId,
      status: { $ne: 'paid' }
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found or already paid'
      });
    }

    // Calculate penalty amount
    const currentDate = new Date();
    let penaltyAmount = 0;
    
    if (bill.dueDate < currentDate) {
      const daysOverdue = Math.ceil((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24));
      const penaltyPerDay = bill.totalAmount * 0.01;
      penaltyAmount = Math.min(daysOverdue * penaltyPerDay, bill.totalAmount * 0.25);
      penaltyAmount = Math.round(penaltyAmount);
    }

    const totalAmount = bill.totalAmount + penaltyAmount;

    // Create payment record
    const payment = new Payment({
      bill: billId,
      tenant: tenantId,
      amount: totalAmount,
      paymentMethod: 'razorpay',
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      status: 'completed',
      paidAt: new Date()
    });

    // Handle screenshot upload if provided
    if (screenshot) {
      const screenshotFilename = `payment_${payment._id}_${Date.now()}.jpg`;
      payment.paymentScreenshot = {
        filename: screenshotFilename,
        originalName: 'payment_screenshot.jpg',
        uploadDate: new Date(),
        verified: false
      };
      
      // In a real implementation, you would save the base64 screenshot to file system
      // For now, we'll store it in the filename field
      payment.paymentScreenshot.filename = screenshot;
    }

    await payment.save();

    // Update bill status
    await Bill.findByIdAndUpdate(billId, {
      status: 'paid',
      paidDate: new Date(),
      paidAmount: totalAmount,
      remainingAmount: 0,
      transactionId: razorpay_payment_id
    });

    // Broadcast payment update for real-time dashboard updates
    // Note: This requires access to the broadcastToClients function from server.js
    // In a real application, you might use a shared event emitter or Redis pub/sub

    res.json({
      success: true,
      message: 'Payment verified and recorded successfully',
      payment: {
        id: payment._id,
        amount: totalAmount,
        paidAt: payment.paidAt,
        paymentMethod: 'razorpay',
        screenshotUploaded: !!screenshot
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
});

// Record manual payment (cash, bank transfer, etc.)
router.post('/record', authenticateToken, authorizeRole(['tenant', 'admin']), async (req, res) => {
  try {
    const { billId, amount, paymentMethod, notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // For tenants, verify they own the bill
    let bill;
    if (userRole === 'tenant') {
      bill = await Bill.findOne({
        _id: billId,
        tenant: userId,
        status: { $ne: 'paid' }
      });
    } else {
      // For admins, find any bill
      bill = await Bill.findOne({
        _id: billId,
        status: { $ne: 'paid' }
      });
    }

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found or already paid'
      });
    }

    // Calculate penalty amount
    const currentDate = new Date();
    let penaltyAmount = 0;
    
    if (bill.dueDate < currentDate) {
      const daysOverdue = Math.ceil((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24));
      const penaltyPerDay = bill.totalAmount * 0.01;
      penaltyAmount = Math.min(daysOverdue * penaltyPerDay, bill.totalAmount * 0.25);
      penaltyAmount = Math.round(penaltyAmount);
    }

    const totalAmount = bill.totalAmount + penaltyAmount;

    // For manual payments, allow some flexibility in amount
    if (userRole === 'tenant' && Math.abs(amount - totalAmount) > 50) {
      return res.status(400).json({
        success: false,
        message: `Amount should be ₹${totalAmount} (including penalty if applicable)`
      });
    }

    // Create payment record
    const payment = new Payment({
      bill: billId,
      tenant: bill.tenant,
      amount: amount,
      penaltyAmount: penaltyAmount,
      paymentMethod: paymentMethod,
      status: userRole === 'admin' ? 'completed' : 'pending_verification',
      paidAt: new Date(),
      recordedBy: userId,
      notes: notes,
      transactionDetails: {
        method: paymentMethod,
        recordedBy: userRole
      }
    });

    await payment.save();

    // Update bill status
    const billUpdate = {
      paymentId: payment._id,
      penalty: {
        amount: penaltyAmount,
        days: penaltyAmount > 0 ? Math.ceil((currentDate - bill.dueDate) / (1000 * 60 * 60 * 24)) : 0
      }
    };

    if (userRole === 'admin') {
      billUpdate.status = 'paid';
      billUpdate.paidDate = new Date();
    } else {
      billUpdate.status = 'payment_pending_verification';
    }

    await Bill.findByIdAndUpdate(billId, billUpdate);

    res.json({
      success: true,
      message: userRole === 'admin' 
        ? 'Payment recorded successfully'
        : 'Payment recorded and pending verification',
      payment: {
        id: payment._id,
        amount: amount,
        penaltyAmount: penaltyAmount,
        paidAt: payment.paidAt,
        paymentMethod: paymentMethod,
        status: payment.status
      }
    });

  } catch (error) {
    console.error('Payment recording error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment'
    });
  }
});

// Get payment history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 20, status, method } = req.query;

    let query = {};
    
    // If tenant, only show their payments
    if (userRole === 'tenant') {
      query.tenant = userId;
    }

    // Apply filters
    if (status) {
      query.status = status;
    }
    if (method) {
      query.paymentMethod = method;
    }

    const payments = await Payment.find(query)
      .populate('bill', 'billNumber month year totalAmount')
      .populate('tenant', 'name email room')
      .sort({ paidAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalPayments = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments: payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPayments / limit),
        totalItems: totalPayments,
        hasNext: page * limit < totalPayments,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

// Admin: Verify manual payment
router.put('/verify/:paymentId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, notes } = req.body; // 'approved' or 'rejected'

    const payment = await Payment.findById(paymentId).populate('bill');

    if (payment.status !== 'pending_verification') {
      return res.status(400).json({
        success: false,
        message: 'Payment is not pending verification'
      });
    }

    // Update payment status
    payment.status = status === 'approved' ? 'completed' : 'rejected';
    payment.verifiedBy = req.user.id;
    payment.verifiedAt = new Date();
    if (notes) {
      payment.verificationNotes = notes;
    }

    await payment.save();

    // Update bill status if approved
    if (status === 'approved') {
      await Bill.findByIdAndUpdate(payment.bill._id, {
        status: 'paid',
        paidDate: new Date()
      });
    } else {
      // If rejected, revert bill to previous status
      await Bill.findByIdAndUpdate(payment.bill._id, {
        status: payment.bill.dueDate < new Date() ? 'overdue' : 'pending',
        paymentId: null
      });
    }

    res.json({
      success: true,
      message: `Payment ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      payment: payment
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
});

// Upload payment screenshot
router.post('/upload-screenshot', authenticateToken, authorizeRole(['tenant']), async (req, res) => {
  try {
    const { paymentId, screenshot } = req.body;
    const tenantId = req.user.id;

    if (!screenshot) {
      return res.status(400).json({
        success: false,
        message: 'Screenshot is required'
      });
    }

    // Find payment and verify ownership
    const payment = await Payment.findOne({
      _id: paymentId,
      tenant: tenantId
    }).populate('bill');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Store screenshot
    const screenshotFilename = `payment_${paymentId}_${Date.now()}.jpg`;
    payment.paymentScreenshot = {
      filename: screenshot, // In real implementation, save file and store path
      originalName: 'payment_screenshot.jpg',
      uploadDate: new Date(),
      verified: false
    };

    await payment.save();

    // Update bill with screenshot info
    await Bill.findByIdAndUpdate(payment.bill._id, {
      'paymentScreenshot.filename': screenshot,
      'paymentScreenshot.uploadDate': new Date(),
      'paymentScreenshot.verified': false
    });

    res.json({
      success: true,
      message: 'Payment screenshot uploaded successfully',
      payment: {
        id: payment._id,
        screenshotUploaded: true,
        uploadDate: payment.paymentScreenshot.uploadDate
      }
    });

  } catch (error) {
    console.error('Screenshot upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload screenshot'
    });
  }
});

// Get payment statistics
router.get('/statistics', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    // Date range for the month
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Total payments in the month
    const monthlyPayments = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          avgPayment: { $avg: '$amount' }
        }
      }
    ]);

    // Payment methods breakdown
    const paymentMethods = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Pending verifications
    const pendingVerifications = await Payment.countDocuments({
      status: 'pending_verification'
    });

    // Late payment penalties collected
    const penaltyCollected = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: startDate, $lte: endDate },
          status: 'completed',
          penaltyAmount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalPenalty: { $sum: '$penaltyAmount' },
          penaltyPayments: { $sum: 1 }
        }
      }
    ]);

    const statistics = {
      monthly: monthlyPayments[0] || { totalAmount: 0, totalPayments: 0, avgPayment: 0 },
      paymentMethods: paymentMethods,
      pendingVerifications: pendingVerifications,
      penalties: penaltyCollected[0] || { totalPenalty: 0, penaltyPayments: 0 },
      period: {
        month: targetMonth,
        year: targetYear,
        startDate: startDate,
        endDate: endDate
      }
    };

    res.json({
      success: true,
      statistics: statistics
    });

  } catch (error) {
    console.error('Payment statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics'
    });
  }
});

module.exports = router;