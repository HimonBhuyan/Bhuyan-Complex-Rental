#!/usr/bin/env node

// Test Brevo email configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testBrevoConfig() {
  console.log('🔍 BREVO EMAIL CONFIGURATION TEST');
  console.log('=' * 50);
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`BREVO_API_KEY: ${process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`BREVO_EMAIL: ${process.env.BREVO_EMAIL || '❌ Missing'}`);
  
  if (!process.env.BREVO_API_KEY) {
    console.log('❌ BREVO_API_KEY not found in environment variables');
    return;
  }
  
  if (!process.env.BREVO_EMAIL) {
    console.log('❌ BREVO_EMAIL not found in environment variables');
    return;
  }
  
  console.log('\n🚀 Creating Brevo transporter...');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_EMAIL,
      pass: process.env.BREVO_API_KEY
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
        address: process.env.BREVO_EMAIL
      },
      to: process.env.BREVO_EMAIL, // Send to self for testing
      subject: 'Brevo Test Email - Success!',
      text: 'This is a test email from your Brevo configuration. If you receive this, your setup is working correctly!',
      html: `
        <h2>✅ Brevo Configuration Test</h2>
        <p>Congratulations! Your Brevo email service is working correctly.</p>
        <p><strong>Sender:</strong> ${process.env.BREVO_EMAIL}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${result.messageId}`);
    console.log(`📧 Check your inbox: ${process.env.BREVO_EMAIL}`);
    
  } catch (error) {
    console.log('❌ Brevo test failed:');
    console.log(`Error: ${error.message}`);
    console.log('\n🔧 Possible issues:');
    console.log('1. Brevo API key is incorrect');
    console.log('2. Sender email is not verified in Brevo');
    console.log('3. Brevo account is not activated');
    console.log('4. Network/firewall blocking SMTP connections');
  }
}

testBrevoConfig().catch(console.error);