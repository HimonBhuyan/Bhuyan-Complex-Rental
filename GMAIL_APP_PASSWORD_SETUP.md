# 🔑 Gmail App Password Setup Guide

## ❌ Current Issue
Your .env file has:
```env
EMAIL_USER=complexbhuyan@gmail.com
EMAIL_PASS="bhuyancomplex2023#"  # ← This is your regular password (won't work!)
```

**Gmail blocks regular passwords for security reasons. You need an App Password.**

## ✅ Solution: Generate Gmail App Password

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" 
3. Click "Get Started" and follow the setup process
4. You'll need your phone number for verification

### Step 2: Generate App Password  
1. After 2FA is enabled, go to: https://myaccount.google.com/apppasswords
2. You might need to sign in again
3. Select "Mail" from the dropdown
4. Click "Generate"
5. Google will show you a 16-character password like: `abcd efgh ijkl mnop`
6. **Copy this password immediately** (you can't see it again!)

### Step 3: Update Your .env File
Replace your current .env email section with:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=complexbhuyan@gmail.com
EMAIL_PASS=abcd-efgh-ijkl-mnop  # ← Replace with your actual 16-char app password
```

**Important**: 
- Remove the quotes around the password
- Use the 16-character app password, not your regular Gmail password
- The app password looks like: `abcdefghijklmnop` (all lowercase, no spaces)

### Step 4: Test
1. Save the .env file
2. Restart your server: `npm run server`
3. Test forgot password - should now send real emails!

## 🔐 Security Notes
- App passwords are specific to applications
- You can revoke them anytime from Google settings
- More secure than using your regular password
- Required by Gmail for all third-party apps

## 🚨 Alternative: Use Ethereal Email (For Testing)
If you don't want to set up Gmail App Password right now, I can configure a test email service that works without any setup.