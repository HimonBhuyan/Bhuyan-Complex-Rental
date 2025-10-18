# 🚀 QUICK EMAIL SETUP (5 minutes)

## Current Problem
Your logs probably show:
```
⚠️  No production email service configured!
📧 Using Ethereal test account (emails won't reach real inboxes)
```

## ✅ INSTANT SOLUTION - SMTP2GO (FREE)

### Step 1: Get Free SMTP2GO Account
1. Go to: https://www.smtp2go.com/pricing
2. Click **"Start Free"** (1000 emails/month)
3. Sign up with your email
4. Verify your email address

### Step 2: Get API Credentials (2 minutes)
1. Login to SMTP2GO dashboard
2. Go to **"Settings"** → **"SMTP Users"**
3. Click **"Create New SMTP User"**
4. Username: `bhuyan-rental`
5. **COPY THE API KEY** (looks like: `api-xxx...`)

### Step 3: Add to Render (1 minute)
1. Go to your **Render dashboard**
2. Click your **web service**
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add:
   - **Key:** `SMTP2GO_API_KEY`
   - **Value:** `paste_your_api_key_here`
6. Click **"Save Changes"**

### Step 4: Test (30 seconds)
1. Wait for auto-deployment (2-3 minutes)
2. Try forgot password again
3. **Tenant will receive real email!**

## 🎯 Alternative: Brevo (300/day free)
If SMTP2GO doesn't work:
1. Sign up at: https://www.brevo.com/
2. Get API key from Settings
3. Add environment variables:
   - `BREVO_API_KEY=your_key`
   - `BREVO_EMAIL=your_verified_sender_email`

## ✅ Success Indicators
After setup, your logs will show:
```
🚀 Using SMTP2GO for real email delivery
✅ Email delivered to tenant@gmail.com using SMTP2GO
📧 Tenant should receive the verification code in their inbox
```

**The tenant will receive emails in their Gmail/Outlook inbox immediately!**