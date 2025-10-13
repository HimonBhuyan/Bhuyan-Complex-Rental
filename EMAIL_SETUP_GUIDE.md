# Email Setup Guide for Forgot Password

## How Email Works in the System

The system needs **ONE** email account (your Gmail) to send verification codes to **ALL** users' emails.

- **Your Gmail** = Sender account (configured in .env)
- **User's Email** = Recipient (entered in forgot password form)

For example:
- You configure `himonbhuyan@gmail.com` as the SENDER in .env
- When any user enters their email (john@example.com, jane@test.com, etc.), your Gmail will send them the verification code

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication on Your Gmail
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification"

### 2. Generate App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and generate password
3. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### 3. Update .env File
Replace these values in your `.env` file:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=himonbhuyan@gmail.com
EMAIL_PASS=abcd-efgh-ijkl-mnop
```

### 4. Test the System
1. Restart your server: `npm run server`
2. Go to forgot password
3. Enter ANY user's email (from your database)
4. The verification code will be sent to that user's email FROM your Gmail

## Alternative: Use a Dedicated Email Service

For production, consider using:
- **Gmail** (250 emails/day limit)
- **SendGrid** (100 emails/day free)
- **Mailgun** (100 emails/day free)

## Troubleshooting

### "Less Secure Apps" Error
- Gmail doesn't use "less secure apps" anymore
- You MUST use App Password (not your regular password)

### Still Not Working?
1. Check server console for error messages
2. Verify 2FA is enabled on Gmail
3. Make sure you're using App Password, not regular password
4. Check Gmail's "Sent" folder to see if emails are being sent

## Security Notes
- Never share your App Password
- The App Password only works for this specific application
- You can revoke App Passwords anytime from Google settings