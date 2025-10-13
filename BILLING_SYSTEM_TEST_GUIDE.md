# 🧪 Complete Billing System Testing Guide

## 🎯 Overview
This guide will walk you through testing the complete end-to-end billing workflow:
**Admin Bill Generation → Tenant Bill Viewing → Payment Processing → Screenshot Upload → Admin Verification**

## 🚀 Prerequisites
1. **MongoDB** service running
2. **Backend server** running on port 3001
3. **Frontend server** running on port 5174
4. **Default admin account**: username `owner`, password `owner123`

## 📋 Test Workflow

### Step 1: Start the System

```bash
# Terminal 1: Start MongoDB (if not running as service)
mongod

# Terminal 2: Start backend server
cd F:\RentalSystem\rental-management-system
npm run server

# Terminal 3: Start frontend
npm run dev
```

**Expected Output:**
- Backend: "🚀 Rental Management Server Started!" with API endpoints listed
- Frontend: "VITE v5.0.0 ready" on port 5174
- MongoDB connection confirmed

### Step 2: Admin Login and Room/Tenant Setup

1. **Navigate to**: http://localhost:5174/login
2. **Login as Admin**: 
   - Username: `owner`
   - Password: `owner123`
3. **Add a Room** (if not exists):
   - Click "Add Rooms" in admin dashboard
   - Fill room details (Room Number: 101, Type: 1BHK, Rent: 15000)
4. **Assign Tenant** (if not exists):
   - In Add Rooms modal, switch to "Assign Tenant" tab
   - Fill tenant details:
     - Name: "John Doe"
     - Email: "john@example.com"
     - Phone: "9876543210"
     - Select Room 101
   - **Note the generated credentials** displayed after assignment

### Step 3: Admin Bill Generation Testing

1. **Navigate to Admin Dashboard**
2. **Click "Manage Bills"** card
3. **In the Modal - "Generate Bills" Tab**:
   
   **Test Case 1: Basic Bill Generation**
   - Select "John Doe" from tenant list
   - Verify auto-filled rent amount (₹15,000)
   - Set Month: Current month
   - Set Year: 2025
   
   **Electricity Section:**
   - Meter Start Reading: 1000
   - Meter End Reading: 1150
   - Charges per Unit: ₹8.5
   - **Verify Auto-calculation**: Units = 150, Amount = ₹1,275
   
   **Other Charges:**
   - Water Bill: ₹500
   - Common Area Charges: ₹300
   
   **Verify Total**: ₹15,000 + ₹1,275 + ₹500 + ₹300 = ₹17,075
   
   - Click "Generate Bill"
   - **Expected**: Success message, tenant notification sent

   **Test Case 2: Duplicate Bill Prevention**
   - Try generating same bill again
   - **Expected**: Error message "Bill already exists"

### Step 4: Tenant Bill Viewing

1. **Open New Browser Tab/Incognito**
2. **Navigate to**: http://localhost:5174/login
3. **Login as Tenant** using generated credentials from Step 2
4. **Verify Tenant Dashboard**:
   
   **Dashboard Stats:**
   - Current Balance: Security deposit amount
   - Pending Bills: 1
   - Room Details: 101 (1BHK)
   - Notifications: Unread count > 0
   
   **Current Bills Section:**
   - **Verify Bill Card** shows:
     - Month/Year (e.g., "January 2025")
     - Status: "PENDING"
     - Breakdown:
       - Rent: ₹15,000
       - Electricity (150 units): ₹1,275
       - Water: ₹500
       - Common Area: ₹300
     - Total: ₹17,075
   
   **Test Bill Details Modal:**
   - Click "View" button on bill
   - Verify detailed breakdown
   - Verify due date (10th of month)
   - Close modal

### Step 5: Late Fee Testing (Optional)

1. **In Admin Panel**, generate a bill with past due date:
   - Create bill for previous month
   - Wait or manually set system date past due date
   - **Verify**: Late fees automatically calculated and displayed
   - **Verify**: Status changes to "OVERDUE"

### Step 6: Razorpay Payment Processing

1. **In Tenant Dashboard**, click "Pay Now" on a bill
2. **Razorpay Modal Opens**:
   - Verify amount matches bill total
   - Use test payment credentials:
     - Card: 4111 1111 1111 1111
     - Expiry: Any future date
     - CVV: 123
     - Name: Any name
3. **Complete Payment**
4. **Expected**: Payment success message

### Step 7: Screenshot Upload

1. **After successful payment**, payment success modal appears
2. **Upload Screenshot**:
   - Click "Choose Screenshot"
   - Select any image file (PNG/JPG)
   - **Verify**: Image preview appears
   - **Verify**: "Screenshot uploaded successfully!" message
3. **Click "Done"**

### Step 8: Admin Payment Verification

1. **Switch back to Admin Dashboard**
2. **Click "Manage Bills"**
3. **Navigate to "Payment Verification" tab**
4. **Verify Payment Item**:
   - Shows tenant name and bill month
   - Shows payment amount and method
   - Shows payment date and status
   - **Screenshot section** displays uploaded image
5. **Test Verification**:
   - Click "Verify" button
   - **Expected**: Status changes to "Verified"
   - **Expected**: Bill status updates to "Paid"

### Step 9: Previous Bills Testing

1. **In Tenant Dashboard**
2. **Check "Previous Bills" section**:
   - **Verify**: Paid bill appears in previous bills
   - **Verify**: Shows complete breakdown
   - **Verify**: Shows payment status
   - **Verify**: Shows remaining amount (should be 0)

### Step 10: Admin Bill Management

1. **In Admin "Manage Bills" tab**
2. **Filter Testing**:
   - Test month/year filters
   - Test status filters (All, Pending, Paid, Overdue)
   - **Verify**: Bills filtered correctly
3. **Bill List Verification**:
   - Shows all bills with tenant details
   - Shows payment status
   - Shows amounts and due dates

## ✅ Success Criteria

### Backend API Integration
- ✅ All API endpoints responding correctly
- ✅ MongoDB data persistence working
- ✅ Authentication and authorization working
- ✅ WebSocket notifications working
- ✅ Late fee calculation working

### Admin Functionality
- ✅ Tenant list loads from database
- ✅ Bill generation with detailed breakdown
- ✅ Electricity calculation (units × rate)
- ✅ Duplicate bill prevention
- ✅ Payment screenshot verification
- ✅ Bill filtering and management

### Tenant Functionality
- ✅ Dashboard shows real-time bill data
- ✅ Detailed bill breakdown display
- ✅ Razorpay payment integration
- ✅ Screenshot upload functionality
- ✅ Previous bills with complete history
- ✅ Late fee display when applicable

### Payment Workflow
- ✅ Razorpay order creation
- ✅ Payment verification
- ✅ Screenshot upload and storage
- ✅ Admin verification workflow
- ✅ Bill status updates

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to load tenants"
**Solution**: Check if backend server is running and MongoDB is connected

### Issue 2: Razorpay modal not opening
**Solution**: Verify RazorpayScript is loaded in App.jsx

### Issue 3: Screenshot upload fails
**Solution**: Check file size (<10MB) and format (PNG/JPG)

### Issue 4: Late fees not calculating
**Solution**: Verify system date is past due date and cron job is running

### Issue 5: Bills not showing in tenant dashboard
**Solution**: Check JWT token and tenant authentication

## 🎉 Test Results

After completing all steps, you should have:

1. ✅ **Admin Panel**: Complete bill management system
   - Tenant selection with details
   - Detailed bill generation form
   - Electricity meter reading calculations
   - Payment verification interface
   
2. ✅ **Tenant Dashboard**: Modern billing interface
   - Real-time bill data from database
   - Detailed breakdown (rent, electricity, water, common area)
   - Integrated Razorpay payment system
   - Screenshot upload functionality
   - Complete bill history
   
3. ✅ **Payment System**: Full workflow
   - Razorpay integration working
   - Screenshot storage and verification
   - Admin approval workflow
   - Bill status updates

4. ✅ **Late Fee System**: Automated calculations
   - Daily penalty calculation
   - Dynamic updates in tenant dashboard
   - Overdue status management

## 🔄 Continuous Testing

For ongoing testing, you can:
1. Generate bills for different months
2. Test various electricity usage scenarios
3. Test partial payments
4. Test bulk bill generation
5. Test notification system

---

**🎯 This completes the comprehensive billing and payment management system implementation!**

The system now provides:
- **Professional admin bill generation** with detailed electricity billing
- **Modern tenant payment interface** with real-time data
- **Complete Razorpay integration** with screenshot verification
- **Automated late fee calculations**
- **Full audit trail** for all payments and bills
- **Real-time notifications** for all billing events