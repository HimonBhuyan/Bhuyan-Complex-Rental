# 🚀 QUICK RESEND SETUP (2 minutes)

Since Brevo is having authentication issues, let's use **Resend** which is much simpler:

## Step 1: Get Resend Account (30 seconds)
1. Go to: https://resend.com/
2. Click "Get Started for Free"
3. Sign up with any email (even Gmail works)
4. No email verification required!

## Step 2: Get API Key (30 seconds)
1. After login, go to **"API Keys"** tab
2. Click **"Create API Key"**
3. Name it: `rental-system`
4. Copy the API key (starts with `re_`)

## Step 3: Add to Local .env (30 seconds)
Add this line to your `.env` file:
```
RESEND_API_KEY=re_your_api_key_here
```

## Step 4: Copy to Render (30 seconds)
Add environment variable in Render:
- **Key:** `RESEND_API_KEY`
- **Value:** `re_your_api_key_here`

## Why Resend is Better:
- ✅ No sender email verification required
- ✅ 3,000 emails/month FREE (vs Brevo's 300/day)
- ✅ Works immediately after signup
- ✅ Modern, developer-friendly
- ✅ Works perfectly on cloud platforms

## Result:
Your logs will show:
```
🚀 Using Resend for real email delivery
✅ Email delivered to tenant@gmail.com using Resend
```

**Tenants will receive emails instantly!**

Want me to help you set this up instead of troubleshooting Brevo?