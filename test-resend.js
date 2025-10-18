#!/usr/bin/env node

// Test Resend email configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testResendConfig() {
  console.log('🚀 RESEND EMAIL CONFIGURATION TEST');
  console.log('=' * 50);
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
  
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found in environment variables');
    return;
  }
  
  console.log('\n🚀 Creating Resend transporter...');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 587,
    secure: false,
    auth: {
      user: 'resend',
      pass: process.env.RESEND_API_KEY
    },
    timeout: 15000,
    debug: true,
    logger: console
  });
  
  try {
    console.log('🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    console.log('\n📧 Sending test email...');
    const testEmail = {
      from: {
        name: 'Bhuyan Complex Management',
        address: 'onboarding@resend.dev' // Resend's verified onboarding email
      },
      to: 'complexbhuyan@gmail.com', // Test with your verified email (Resend requirement)
      subject: 'Resend Test Email - Success! 🎉',
      text: 'This is a test email from your Resend configuration. If you receive this, your setup is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981;">✅ Resend Configuration Test SUCCESS!</h2>
            <p>Congratulations! Your Resend email service is working perfectly.</p>
            <p><strong>From:</strong> Bhuyan Complex Management</p>
            <p><strong>Service:</strong> Resend</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>🎯 What this means:</strong></p>
              <ul>
                <li>✅ Tenants will receive real emails</li>
                <li>✅ Password reset codes will be delivered</li>
                <li>✅ No domain authentication issues</li>
                <li>✅ Better deliverability than Brevo</li>
              </ul>
            </div>
          </div>
        </div>
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${result.messageId}`);
    console.log(`📧 Check the inbox: crusherstress97@gmail.com`);
    console.log('\n🎉 RESEND IS WORKING! Deploy this to Render and tenants will receive emails!');
    
  } catch (error) {
    console.log('❌ Resend test failed:');
    console.log(`Error: ${error.message}`);
    console.log('\n🔧 Possible issues:');
    console.log('1. Resend API key is incorrect');
    console.log('2. Network/firewall blocking SMTP connections');
    console.log('3. Resend account needs activation');
  }
}

testResendConfig().catch(console.error);