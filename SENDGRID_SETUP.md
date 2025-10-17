# SendGrid Setup for Reliable Email Delivery

## Why SendGrid?
- ✅ Works reliably on cloud platforms like Render
- ✅ Free tier: 100 emails/day (perfect for password resets)
- ✅ No SMTP blocking issues
- ✅ Better delivery rates than Gmail on cloud

## Quick Setup (5 minutes):

### Step 1: Create SendGrid Account
1. Go to: https://sendgrid.com/
2. Click "Start for Free"
3. Sign up with your email
4. Verify your email address

### Step 2: Get API Key
1. Login to SendGrid dashboard
2. Go to Settings → API Keys
3. Click "Create API Key"
4. Choose "Restricted Access"
5. Enable "Mail Send" permission
6. Click "Create & View"
7. **Copy the API key** (starts with `SG.`)

### Step 3: Verify Sender Identity
1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Fill in your details:
   - From Name: `Bhuyan Complex Management`
   - From Email: `complexbhuyan@gmail.com` (or any email you own)
   - Reply To: `complexbhuyan@gmail.com`
   - Company: `Bhuyan Complex`
   - Address: Your building address
4. Click "Create"
5. Check your email and click verify link

### Step 4: Update Render Environment Variables
In your Render dashboard, add these environment variables:

```
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.your_api_key_here
EMAIL_USER=complexbhuyan@gmail.com
```

### Step 5: Test
- Deploy your app on Render
- Try password reset
- Should work immediately!

## Alternative: If you prefer Gmail
If you want to stick with Gmail, try creating an **Outlook account** instead:
1. Create account at outlook.com
2. Set these variables on Render:
   ```
   EMAIL_SERVICE=outlook  
   EMAIL_USER=youremail@outlook.com
   EMAIL_PASS=your_password
   ```

## Current Status
Your system is working perfectly - it's just that Gmail SMTP doesn't work on Render's infrastructure due to network restrictions. SendGrid will solve this immediately.