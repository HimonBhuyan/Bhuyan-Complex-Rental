# Forgot Password Feature Documentation

## Overview
The forgot password functionality has been implemented with a secure 3-step process:
1. **Email Input** - User enters their email address
2. **Verification Code** - User receives and enters a 6-digit code
3. **Password Reset** - User sets a new password

## Features Implemented

### Frontend Components
- **`ForgotPasswordModal.jsx`** - Multi-step modal with progress indicator
- **`ForgotPasswordModal.css`** - Modern, responsive styling
- **Updated `Login.jsx`** - Added "Forgot Password" link without breaking existing functionality

### Backend Services  
- **`emailService.js`** - Email service with code generation and validation
- **New API Endpoints** in `server.js`:
  - `POST /api/auth/forgot-password` - Send verification code
  - `POST /api/auth/verify-reset-code` - Verify code
  - `POST /api/auth/reset-password` - Reset password

### Security Features
- ✅ **Verification codes expire after 15 minutes**
- ✅ **Maximum 3 attempts per code**
- ✅ **Additional reset token for session security**
- ✅ **Password hashing using bcrypt**
- ✅ **Input validation on both frontend and backend**
- ✅ **Clean up expired codes automatically**

### User Experience
- ✅ **Step-by-step progress indicator**
- ✅ **Clear error messages and validation**
- ✅ **Resend code functionality**
- ✅ **Responsive design for all devices**
- ✅ **Professional email templates**
- ✅ **Loading states and animations**

## Setup Instructions

### 1. Install Dependencies
```bash
npm install nodemailer
```

### 2. Configure Email Settings
Copy `.env.example` to `.env` and configure:

**For Gmail (Development):**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
```

**Gmail App Password Setup:**
1. Enable 2-factor authentication on Google account
2. Go to Google Account → Security → App passwords
3. Generate password for "Mail"
4. Use the 16-character password (not your regular password)

**For Production (Recommended):**
Use services like SendGrid, Mailgun, or AWS SES:
```env
EMAIL_SERVICE=custom
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### 3. Test the Feature
1. Start the server: `npm run server`
2. Start the frontend: `npm run dev`
3. Go to login page and click "Forgot your password?"
4. Follow the 3-step process

## Flow Validation

### Email Validation
- ✅ Valid email format required
- ✅ Email must exist in database (Owner or Tenant)
- ✅ Role-based user lookup

### Code Verification
- ✅ 6-digit numeric code required
- ✅ Code expiry validation (15 minutes)
- ✅ Attempt limit validation (3 attempts max)
- ✅ Reset token validation

### Password Reset
- ✅ Minimum 6 characters required
- ✅ Password confirmation matching
- ✅ Secure password hashing
- ✅ Database update with pre-save hook

## Error Handling
- ✅ **Network errors** - Graceful fallback messages
- ✅ **Invalid emails** - User-friendly error messages  
- ✅ **Expired codes** - Clear instructions to request new code
- ✅ **Failed attempts** - Remaining attempts counter
- ✅ **Email configuration issues** - Server-side warnings

## File Structure
```
src/components/auth/
├── ForgotPasswordModal.jsx     # Main modal component
├── ForgotPasswordModal.css     # Modal styling
└── Login.jsx                   # Updated with forgot password link

backend/services/
└── emailService.js             # Email handling service

server.js                       # Updated with new API endpoints
.env.example                    # Updated with email configuration
```

## API Endpoints

### POST /api/auth/forgot-password
**Request:**
```json
{
  "email": "user@example.com",
  "role": "tenant" // or "owner"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "resetToken": "secure-token-here"
}
```

### POST /api/auth/verify-reset-code  
**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "resetToken": "secure-token-here"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Verification code verified successfully"
}
```

### POST /api/auth/reset-password
**Request:**
```json
{
  "email": "user@example.com", 
  "code": "123456",
  "newPassword": "newSecurePassword",
  "resetToken": "secure-token-here"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "userType": "tenant"
}
```

## Production Considerations

### Email Service
- Use professional email services (SendGrid, Mailgun, AWS SES)
- Set up proper SPF/DKIM records
- Monitor email delivery rates

### Security Enhancements
- Consider rate limiting for requests
- Add CAPTCHA for additional security
- Log password reset activities
- Consider SMS as alternative verification method

### Scalability
- Move verification codes to Redis for better performance
- Implement proper session management
- Add metrics and monitoring

## Troubleshooting

### Email Not Sending
1. Check email configuration in `.env`
2. Verify Gmail App Password setup
3. Check server logs for error messages
4. Test email configuration on server startup

### Modal Not Appearing  
1. Check for JavaScript errors in console
2. Verify modal state management
3. Check CSS conflicts

### Code Verification Failing
1. Check code expiry (15 minutes)
2. Verify attempt limits (3 max)
3. Ensure correct email and token pairing

## Testing Checklist
- [ ] Email input validation
- [ ] Role selection works
- [ ] Verification code email sent
- [ ] Code verification with valid code
- [ ] Code verification with invalid code
- [ ] Code expiry handling
- [ ] Attempt limit enforcement
- [ ] Password validation
- [ ] Password confirmation matching
- [ ] Successful password reset
- [ ] Login with new password
- [ ] Responsive design on mobile
- [ ] Error handling for all scenarios

The forgot password functionality is now fully implemented and ready for use!