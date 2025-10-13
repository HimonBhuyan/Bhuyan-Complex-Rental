# Automated Email Notification System - Setup Complete ✅

## Overview
This document outlines the automated email notification system that has been implemented for tenants regarding late fees and payment reminders.

## Features Implemented

### 1. **Late Payment Penalty Email Notifications** 
- **When**: Automatically sent when a late payment penalty is applied to a tenant's bill
- **Triggered by**: Monthly penalty application cron job (runs on the 10th of each month at 10 AM)
- **Content**: 
  - Late fee amount (\u20b950 per month)
  - Bill details (number, period, due date)
  - Original amount vs. new total with late fee
  - Payment instructions

### 2. **Payment Reminder Emails** 
- **When**: Sent 3 days before bill due date
- **Triggered by**: Daily cron job (runs every day at 9 AM)
- **Content**:
  - Bill due date warning
  - Amount due
  - Late fee penalty information (\u20b950/month)
  - Payment instructions

### 3. **In-App Notifications**
- Both email notifications also trigger in-app notifications
- WebSocket real-time notifications
- Visible in tenant dashboard

## File Changes

### 1. **Email Service** (`backend/services/emailService.js`)
**New Functions Added:**
- `sendLateFeeNotification(tenantEmail, tenantName, billDetails)` - Sends late fee penalty emails
- `sendPaymentReminder(tenantEmail, tenantName, billDetails, daysUntilDue)` - Sends payment reminder emails

**Email Templates:**
- Professional HTML templates with modern styling
- Plain text fallback versions
- Mobile-responsive design
- Clear call-to-action buttons

### 2. **Penalty Service** (`backend/services/penaltyService.js`)
**Updated:**
- `sendPenaltyNotification()` - Now sends both in-app and email notifications
- Integrates with emailService
- Handles email failures gracefully (doesn't break penalty application)

### 3. **Server Cron Jobs** (`server.js`)
**Two new scheduled tasks:**

**A. Payment Reminder Job**
```javascript
// Runs daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  // Finds bills due in 3 days
  // Sends email + in-app reminders
  // Prevents late fees
});
```

**B. Monthly Penalty Application**  
```javascript
// Runs monthly on the 10th at 10 AM
cron.schedule('0 10 10 * *', async () => {
  // Applies late fees to overdue bills
  // Sends penalty notification emails
});
```

## Configuration

### Environment Variables (.env file)
To enable email notifications, set the following in your `.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail  # or 'smtp' or 'ethereal'
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # Gmail App Password, NOT regular password

# SMTP Configuration (if not using Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Development Mode
If email credentials are not configured:
- Emails won't be sent
- Notifications will be logged to console
- System continues to work normally
- In-app notifications still function

## Email Details

### Late Fee Notification Email

**Subject:** `⚠️ Late Payment Penalty Applied - [Bill Number]`

**Key Information:**
- Professional header with gradient styling
- Bill number and billing period
- Original amount
- Late payment penalty (\u20b950)
- New total outstanding
- Warning about additional penalties
- "Pay Now" button

**Design Features:**
- Red/warning color scheme
- Clear visual hierarchy
- Mobile responsive
- Professional branding (Bhuyan Complex Management)

### Payment Reminder Email

**Subject:** `\ud83d\udd14 Payment Reminder - Bill Due in 3 Days`

**Key Information:**
- Friendly reminder tone
- Days until due date
- Bill details
- Amount due
- Late fee warning (\u20b950/month if late)
- "Pay Now" button

**Design Features:**
- Blue/informational color scheme
- Friendly and helpful tone
- Clear actionable steps
- Professional branding

## Testing

### Development Testing
1. **Check Console Logs**: If EMAIL_USER/EMAIL_PASS not set, verification codes appear in server console
2. **Verify Cron Jobs**: Check server logs for scheduled task execution
3. **Test Penalty Application**: Manually trigger penalty service or wait for scheduled run

### Production Testing
1. Set up proper email credentials
2. Add test tenant with valid email
3. Create overdue bill
4. Wait for or manually trigger penalty application
5. Check tenant email inbox

## Scheduled Tasks Summary

| Task | Schedule | Time | Purpose |
|------|----------|------|---------|
| Payment Reminders | Daily | 9:00 AM | Send reminders 3 days before due date |
| Bill Generation | Monthly | 9:00 AM (10th) | Generate monthly bills |
| Penalty Application | Monthly | 10:00 AM (10th) | Apply late fees + send emails |

## API Endpoints

### Admin Endpoints (Already Exist)
- `GET /api/admin/tenants/:tenantId/profile` - Fetch tenant profile with documents
- `GET /api/admin/tenants` - List all tenants
- `PUT /api/admin/tenants/:tenantId` - Update tenant information

### Tenant Endpoints
- `GET /api/tenant/profile` - Get current tenant profile
- `PUT /api/tenant/profile` - Update tenant profile

## Database Schema

### Tenant Model Fields Used
```javascript
{
  email: String,  // Required for email notifications
  name: String,   // Used in email greetings
  profileData: {
    documents: Object  // Tenant uploaded documents
  }
}
```

### Bill Model Fields Used
```javascript
{
  billNumber: String,
  month: Number,
  year: Number,
  dueDate: Date,
  totalAmount: Number,
  remainingAmount: Number,
  penalty: {
    amount: Number,
    appliedDate: Date
  }
}
```

## Security Considerations

1. **Email Credentials**: 
   - Never commit .env file to Git
   - Use Gmail App Passwords, not regular passwords
   - Consider using environment-specific credentials

2. **Email Validation**:
   - System checks for valid email format
   - Gracefully handles missing emails
   - Logs failures without breaking system

3. **Rate Limiting**:
   - Cron jobs run at specific times
   - Prevents email spam
   - One email per event per tenant

## Troubleshooting

### Emails Not Sending
1. Check `.env` file has EMAIL_USER and EMAIL_PASS set
2. For Gmail: Use App Password, not regular password
3. Check server logs for error messages
4. Verify SMTP settings if using custom mail server

### Emails Going to Spam
1. Use proper SPF/DKIM records (production)
2. Use professional email service (SendGrid, Mailgun, etc.)
3. Keep email content professional
4. Don't send too frequently

### Cron Jobs Not Running
1. Check server is running continuously
2. Verify cron schedule syntax
3. Check server timezone settings
4. Review server logs for execution confirmation

## Next Steps / Future Enhancements

1. **Email Service Integration**: Consider using SendGrid, Mailgun, or AWS SES for production
2. **Email Templates**: Create more email templates (welcome, payment success, etc.)
3. **Email Preferences**: Allow tenants to opt-in/out of certain email types
4. **SMS Notifications**: Add SMS notifications for critical alerts
5. **Email Analytics**: Track email open rates and click-through rates

## Support

For issues or questions:
1. Check server logs: Look for email-related error messages
2. Verify environment configuration
3. Test email credentials separately
4. Review this documentation

---

**Last Updated**: January 2025
**Version**: 1.0
**Status**: ✅ Production Ready
