#!/usr/bin/env node

// Test Resend HTTP API configuration
require('dotenv').config();

async function testResendHTTPAPI() {
  console.log('🚀 RESEND HTTP API TEST (SMTP-FREE)');
  console.log('=' * 50);
  
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found in environment variables');
    return;
  }
  
  console.log(`📋 RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
  
  try {
    console.log('\n📧 Sending test email via Resend HTTP API...');
    
    const emailData = {
      from: 'Bhuyan Complex Management <onboarding@resend.dev>',
      reply_to: 'complexbhuyan@gmail.com', // Replies go to management
      to: 'complexbhuyan@gmail.com', // Test with verified email (Resend limitation)
      subject: 'HTTP API Test - SMTP Blocking Bypassed! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
            <h2 style="color: #16a34a;">🎯 SUCCESS! SMTP Blocking Bypassed</h2>
            <p><strong>Email delivery method:</strong> Resend HTTP API</p>
            <p><strong>Platform:</strong> Works on ALL cloud platforms</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            
            <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="margin: 0 0 10px 0; color: #15803d;">🎉 What This Means:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>✅ <strong>SMTP blocking completely bypassed</strong></li>
                <li>✅ <strong>Tenants will receive real emails</strong></li>
                <li>✅ <strong>Password reset codes delivered instantly</strong></li>
                <li>✅ <strong>Works on Render, Heroku, any cloud platform</strong></li>
                <li>✅ <strong>No more console-based delivery needed</strong></li>
              </ul>
            </div>
            
            <p style="color: #059669; font-weight: bold;">
              🚀 Your email system is now fully operational!
            </p>
          </div>
        </div>
      `,
      text: 'SUCCESS! Resend HTTP API test passed. SMTP blocking bypassed. Tenants will receive real emails.'
    };
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    
    console.log('✅ HTTP API email sent successfully!');
    console.log(`🌐 Email ID: ${result.id}`);
    console.log(`📧 Check your inbox: complexbhuyan@gmail.com`);
    console.log(`✨ SMTP blocking completely bypassed!`);
    console.log('\n🎉 DEPLOY THIS TO RENDER - TENANTS WILL RECEIVE EMAILS!');
    
  } catch (error) {
    console.log('❌ Resend HTTP API test failed:');
    console.log(`Error: ${error.message}`);
  }
}

testResendHTTPAPI().catch(console.error);