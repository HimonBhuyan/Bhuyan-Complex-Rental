const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Store verification codes in memory (in production, use Redis or database)
const verificationCodes = new Map();

// Configure nodemailer transporter
const createTransporter = () => {
  // For development, you can use Gmail with App Password
  // For production, use proper SMTP service like SendGrid, Mailgun, etc.
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5
    });
  } else if (process.env.EMAIL_SERVICE === 'ethereal') {
    // Ethereal Email - for testing (creates temporary test account)
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.EMAIL_PASS || 'ethereal.pass'
      }
    });
  } else {
    // Generic SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate reset token for additional security
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Fast email delivery with immediate fallback
const sendVerificationCode = async (email, userType = 'user') => {
  const code = generateVerificationCode();
  const resetToken = generateResetToken();
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000);

  // Store verification code with expiry
  verificationCodes.set(email, {
    code,
    resetToken,
    expiryTime,
    attempts: 0,
    maxAttempts: 3
  });

  // Fast path: Always provide console fallback immediately
  const logCode = () => {
    console.log('\n' + '='.repeat(60));
    console.log('🔑 PASSWORD RESET CODE');
    console.log('='.repeat(60));
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Code: ${code}`);
    console.log(`⏰ Expires: ${expiryTime.toLocaleString()}`);
    console.log(`👤 Type: ${userType}`);
    console.log('='.repeat(60) + '\n');
  };

  // Always log the code for admin access
  logCode();

  // Quick email validation
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
      !process.env.EMAIL_USER.includes('@') || 
      process.env.EMAIL_PASS.length < 8) {
    return {
      success: true,
      message: 'Reset code generated. Admin can provide the code to user.',
      resetToken,
      devMode: true,
      code
    };
  }

  // Try to send email in background (don't wait for it)
  setImmediate(async () => {
    try {
      const transporter = createTransporter();

      // Simple email content for background sending
      const mailOptions = {
        from: {
          name: 'Bhuyan Complex Management',
          address: process.env.EMAIL_USER
        },
        to: email,
        subject: `Password Reset Code: ${code} - Bhuyan Complex`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px;">
              <h1>🏢 Password Reset</h1>
              <p>Bhuyan Complex Management</p>
            </div>
            <div style="padding: 20px; background: #f9f9f9; margin: 20px 0; text-align: center;">
              <h2>Your verification code is:</h2>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px; font-family: monospace;">
                ${code}
              </div>
              <p style="color: #666; margin-top: 20px;">This code expires in 15 minutes</p>
            </div>
            <p>Hello ${userType === 'owner' ? 'Building Owner' : 'Tenant'},</p>
            <p>Enter this code in the password reset form to proceed.</p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">Generated: ${new Date().toLocaleString()}</p>
          </div>
        `,
        text: `Password Reset Code: ${code}\n\nHello ${userType === 'owner' ? 'Building Owner' : 'Tenant'},\n\nYour verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nBhuyan Complex Management`
      };

      // Try to send email (with 5 second timeout)
      console.log(`📧 Trying to send email to ${email}...`);
      const emailPromise = transporter.sendMail(mailOptions);
      
      // Race between email sending and timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout')), 5000)
      );
      
      await Promise.race([emailPromise, timeoutPromise]);
      console.log(`✅ Email sent successfully to ${email}`);
      
    } catch (emailError) {
      console.log(`⚠️ Email failed for ${email}: ${emailError.message}`);
    }
  });

  // Return immediately with success (don't wait for email)
  return {
    success: true,
    message: 'Reset code generated. Check your email or contact admin for the code.',
    resetToken,
    emailAttempted: true
  };
};

// Verify the code
const verifyCode = (email, inputCode, resetToken) => {
  const stored = verificationCodes.get(email);
  
  if (!stored) {
    return {
      success: false,
      error: 'No verification code found. Please request a new one.'
    };
  }

  // Check if token matches (additional security)
  if (stored.resetToken !== resetToken) {
    return {
      success: false,
      error: 'Invalid reset session. Please request a new verification code.'
    };
  }

  // Check expiry
  if (new Date() > stored.expiryTime) {
    verificationCodes.delete(email);
    return {
      success: false,
      error: 'Verification code has expired. Please request a new one.'
    };
  }

  // Check attempt limit
  if (stored.attempts >= stored.maxAttempts) {
    verificationCodes.delete(email);
    return {
      success: false,
      error: 'Too many failed attempts. Please request a new verification code.'
    };
  }

  // Check if code matches
  if (stored.code !== inputCode) {
    stored.attempts += 1;
    verificationCodes.set(email, stored);
    
    const remainingAttempts = stored.maxAttempts - stored.attempts;
    return {
      success: false,
      error: `Invalid verification code. ${remainingAttempts} attempts remaining.`
    };
  }

  // Code is valid - mark as used
  stored.verified = true;
  stored.verifiedAt = new Date();
  verificationCodes.set(email, stored);

  console.log(`✅ Verification code verified for ${email}`);
  return {
    success: true,
    message: 'Verification code verified successfully'
  };
};

// Check if code is verified and still valid
const isCodeVerified = (email, resetToken) => {
  const stored = verificationCodes.get(email);
  
  if (!stored) {
    return false;
  }

  // Check if token matches
  if (stored.resetToken !== resetToken) {
    return false;
  }

  // Check if verified and not expired (allow 30 minutes for password reset after verification)
  const verificationExpiry = new Date(stored.expiryTime.getTime() + 15 * 60 * 1000); // Extra 15 minutes
  return stored.verified && new Date() < verificationExpiry;
};

// Clean up expired codes (call this periodically)
const cleanupExpiredCodes = () => {
  const now = new Date();
  let cleaned = 0;
  
  for (const [email, data] of verificationCodes.entries()) {
    // Remove codes that are older than 30 minutes
    const maxAge = new Date(data.expiryTime.getTime() + 15 * 60 * 1000);
    if (now > maxAge) {
      verificationCodes.delete(email);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired verification codes`);
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    
    // Add timeout to the verification
    const verifyPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Email configuration test timeout'));
      }, 30000);
      
      transporter.verify()
        .then(() => {
          clearTimeout(timeoutId);
          resolve(true);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
    
    await verifyPromise;
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

// Send late payment penalty email
const sendLateFeeNotification = async (tenantEmail, tenantName, billDetails) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('\n' + '='.repeat(60));
      console.log('📧 EMAIL NOT CONFIGURED - DEVELOPMENT MODE');
      console.log('='.repeat(60));
      console.log(`💰 Late Fee Notification for ${tenantEmail}`);
      console.log(`Tenant: ${tenantName}`);
      console.log(`Bill: ${billDetails.billNumber}`);
      console.log(`Late Fee: ₹${billDetails.lateFee}`);
      console.log(`Total Outstanding: ₹${billDetails.totalOutstanding}`);
      console.log('='.repeat(60) + '\n');
      
      return {
        success: true,
        message: 'Email notification skipped (dev mode)',
        devMode: true
      };
    }

    const transporter = createTransporter();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

    const mailOptions = {
      from: {
        name: 'Bhuyan Complex Management',
        address: process.env.EMAIL_USER
      },
      to: tenantEmail,
      subject: `⚠️ Late Payment Penalty Applied - ${billDetails.billNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Late Payment Penalty</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
              color: white;
              border-radius: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .warning-box {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .bill-details {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #dee2e6;
            }
            .amount-row.total {
              font-weight: bold;
              font-size: 18px;
              color: #e74c3c;
              border-bottom: 3px solid #e74c3c;
              margin-top: 10px;
            }
            .info {
              background: #e3f2fd;
              padding: 15px;
              border-left: 4px solid #2196f3;
              margin: 20px 0;
              border-radius: 4px;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: #28a745;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              text-align: center;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Late Payment Penalty Applied</h1>
              <p>Bhuyan Complex Management System</p>
            </div>
            
            <p>Dear ${tenantName},</p>
            
            <div class="warning-box">
              <h3>⏰ Payment Overdue Notice</h3>
              <p>A late payment penalty has been applied to your bill because payment was not received by the due date.</p>
            </div>
            
            <div class="bill-details">
              <h3>Bill Details</h3>
              <div class="amount-row">
                <span>Bill Number:</span>
                <span><strong>${billDetails.billNumber}</strong></span>
              </div>
              <div class="amount-row">
                <span>Billing Period:</span>
                <span>${monthNames[billDetails.month - 1]} ${billDetails.year}</span>
              </div>
              <div class="amount-row">
                <span>Due Date:</span>
                <span>${new Date(billDetails.dueDate).toLocaleDateString()}</span>
              </div>
              <div class="amount-row">
                <span>Original Amount:</span>
                <span>₹${billDetails.originalAmount.toLocaleString()}</span>
              </div>
              <div class="amount-row">
                <span><strong>Late Payment Penalty:</strong></span>
                <span style="color: #e74c3c;"><strong>₹${billDetails.lateFee.toLocaleString()}</strong></span>
              </div>
              <div class="amount-row total">
                <span>Total Outstanding:</span>
                <span>₹${billDetails.totalOutstanding.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="info">
              <h3>📋 What You Need to Do:</h3>
              <ul>
                <li><strong>Pay immediately</strong> to avoid additional penalties</li>
                <li>Late fees of ₹50 are added monthly for unpaid bills</li>
                <li>Contact management if you have any payment difficulties</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="#" class="button">Pay Now</a>
            </div>
            
            <div class="warning-box">
              <p><strong>Note:</strong> Continued non-payment may result in additional penalties and potential legal action. Please contact us if you're experiencing financial difficulties.</p>
            </div>
            
            <div class="footer">
              <p><strong>Bhuyan Complex Management System</strong></p>
              <p>For assistance, please contact building management</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Late Payment Penalty Applied - Bhuyan Complex Management

        Dear ${tenantName},

        A late payment penalty has been applied to your bill because payment was not received by the due date.

        Bill Details:
        - Bill Number: ${billDetails.billNumber}
        - Billing Period: ${monthNames[billDetails.month - 1]} ${billDetails.year}
        - Due Date: ${new Date(billDetails.dueDate).toLocaleDateString()}
        - Original Amount: ₹${billDetails.originalAmount.toLocaleString()}
        - Late Payment Penalty: ₹${billDetails.lateFee.toLocaleString()}
        - Total Outstanding: ₹${billDetails.totalOutstanding.toLocaleString()}

        What You Need to Do:
        - Pay immediately to avoid additional penalties
        - Late fees of ₹50 are added monthly for unpaid bills
        - Contact management if you have any payment difficulties

        Note: Continued non-payment may result in additional penalties and potential legal action.

        Best regards,
        Bhuyan Complex Management System
      `
    };

    console.log(`📧 Sending late fee notification to ${tenantEmail}...`);
    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Late fee notification sent to ${tenantEmail}`);
    return {
      success: true,
      message: 'Late fee notification sent successfully'
    };

  } catch (error) {
    console.error('❌ Error sending late fee notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send payment reminder email (before due date)
const sendPaymentReminder = async (tenantEmail, tenantName, billDetails, daysUntilDue) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('\n' + '='.repeat(60));
      console.log('📧 EMAIL NOT CONFIGURED - DEVELOPMENT MODE');
      console.log('='.repeat(60));
      console.log(`🔔 Payment Reminder for ${tenantEmail}`);
      console.log(`Tenant: ${tenantName}`);
      console.log(`Bill: ${billDetails.billNumber}`);
      console.log(`Amount: ₹${billDetails.amount}`);
      console.log(`Days Until Due: ${daysUntilDue}`);
      console.log('='.repeat(60) + '\n');
      
      return {
        success: true,
        message: 'Email reminder skipped (dev mode)',
        devMode: true
      };
    }

    const transporter = createTransporter();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

    const mailOptions = {
      from: {
        name: 'Bhuyan Complex Management',
        address: process.env.EMAIL_USER
      },
      to: tenantEmail,
      subject: `🔔 Payment Reminder - Bill Due in ${daysUntilDue} Day${daysUntilDue > 1 ? 's' : ''}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Reminder</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border-radius: 10px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .reminder-box {
              background: #fff8e1;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
              text-align: center;
            }
            .reminder-box h2 {
              color: #f57c00;
              margin: 0 0 10px 0;
            }
            .bill-details {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #dee2e6;
            }
            .amount-row.total {
              font-weight: bold;
              font-size: 20px;
              color: #667eea;
              border-bottom: 3px solid #667eea;
              margin-top: 10px;
            }
            .info {
              background: #e3f2fd;
              padding: 15px;
              border-left: 4px solid #2196f3;
              margin: 20px 0;
              border-radius: 4px;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: #28a745;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              text-align: center;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Payment Reminder</h1>
              <p>Bhuyan Complex Management System</p>
            </div>
            
            <p>Dear ${tenantName},</p>
            
            <div class="reminder-box">
              <h2>⏰ Your payment is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}!</h2>
              <p>This is a friendly reminder to avoid late payment penalties.</p>
            </div>
            
            <div class="bill-details">
              <h3>Bill Details</h3>
              <div class="amount-row">
                <span>Bill Number:</span>
                <span><strong>${billDetails.billNumber}</strong></span>
              </div>
              <div class="amount-row">
                <span>Billing Period:</span>
                <span>${monthNames[billDetails.month - 1]} ${billDetails.year}</span>
              </div>
              <div class="amount-row">
                <span>Due Date:</span>
                <span><strong>${new Date(billDetails.dueDate).toLocaleDateString()}</strong></span>
              </div>
              <div class="amount-row total">
                <span>Amount Due:</span>
                <span>₹${billDetails.amount.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="info">
              <h3>💡 Important Information:</h3>
              <ul>
                <li>Late payment penalty: ₹50 per month</li>
                <li>Penalties are applied on the 10th of each month for unpaid bills</li>
                <li>Pay before the due date to avoid additional charges</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="#" class="button">Pay Now</a>
            </div>
            
            <p>Thank you for being a valued tenant. If you have already made the payment, please disregard this reminder.</p>
            
            <div class="footer">
              <p><strong>Bhuyan Complex Management System</strong></p>
              <p>For assistance, please contact building management</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Payment Reminder - Bhuyan Complex Management

        Dear ${tenantName},

        Your payment is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}! This is a friendly reminder to avoid late payment penalties.

        Bill Details:
        - Bill Number: ${billDetails.billNumber}
        - Billing Period: ${monthNames[billDetails.month - 1]} ${billDetails.year}
        - Due Date: ${new Date(billDetails.dueDate).toLocaleDateString()}
        - Amount Due: ₹${billDetails.amount.toLocaleString()}

        Important Information:
        - Late payment penalty: ₹50 per month
        - Penalties are applied on the 10th of each month for unpaid bills
        - Pay before the due date to avoid additional charges

        Thank you for being a valued tenant.

        Best regards,
        Bhuyan Complex Management System
      `
    };

    console.log(`📧 Sending payment reminder to ${tenantEmail}...`);
    await transporter.sendMail(mailOptions);
    
    console.log(`✅ Payment reminder sent to ${tenantEmail}`);
    return {
      success: true,
      message: 'Payment reminder sent successfully'
    };

  } catch (error) {
    console.error('❌ Error sending payment reminder:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupExpiredCodes, 10 * 60 * 1000);

module.exports = {
  sendVerificationCode,
  verifyCode,
  isCodeVerified,
  cleanupExpiredCodes,
  testEmailConfiguration,
  sendLateFeeNotification,
  sendPaymentReminder
};
