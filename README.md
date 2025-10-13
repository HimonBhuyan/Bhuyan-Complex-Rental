# Rental Management System

A comprehensive React-based rental management system for building owners and tenants. This system allows tenants to view their bills, make payments, and receive notifications, while owners can manage tenants, create bills, and send notifications.

## 🚀 Live Demo

You can access the live application at: [Your Deployed URL]

## 📋 Features

### For Tenants
- **Dashboard Overview**: View pending bills, current month charges, and unread notifications
- **Bill Management**: View detailed bills, payment history, and make payments
- **Profile Management**: View and manage personal information
- **Notifications**: Receive personal notifications and building-wide announcements
- **Payment Processing**: Simulated payment system with real-time feedback

### For Owners
- **Admin Dashboard**: Overview of all tenants, revenue, and outstanding bills
- **Tenant Management**: View and manage tenant information and payment status
- **Bill Creation**: Create monthly bills with customizable categories (Rent, Electricity, Water, Maintenance, Parking)
- **Notification System**: Send building-wide announcements or personal messages
- **Revenue Tracking**: Monitor collected and pending payments

## 🔐 Demo Credentials

### Tenant Accounts
- **Username**: `john.doe` | **Password**: `tenant123` | **Room**: 101
- **Username**: `jane.smith` | **Password**: `tenant123` | **Room**: 202

### Owner Account
- **Username**: `owner` | **Password**: `owner123`

## ✨ Latest Updates - Version 2.0

### 🎨 **Complete UI Redesign**
- **Fullscreen Layout**: UI now takes full browser window for maximum visibility
- **Enhanced Card Design**: All action cards are now visible with improved styling and hover effects
- **Shimmer Effects**: Beautiful hover animations on all interactive elements
- **Professional Styling**: Modern card-based layout matching the original mockups perfectly

### 🖱️ **Interactive Profile System**
- **Clickable Profile Photos**: Profile sections now show the user's name
- **Profile Dropdown Menu**: Click on profile to access:
  - Change Profile Photo
  - View Profile Details
  - Edit Profile Information
- **Smooth Animations**: Dropdown appears with fade-in animation
- **Click Outside to Close**: Intuitive UX behavior

### 📱 **Mobile-First Responsive Design**
- **Perfect Mobile Experience**: Optimized for all screen sizes
- **Touch-Friendly Interface**: Proper touch targets and gestures
- **Adaptive Layout**: Cards resize beautifully on different devices
- **Mobile Navigation**: Sidebar adapts for mobile screens

### 💫 **Enhanced User Experience**
- **Functional Action Cards**: All cards now trigger appropriate modals
- **Rich Modal System**: Feature-complete modals for all actions
- **Real-time Feedback**: Toast notifications for all user actions
- **Loading States**: Proper loading indicators throughout the app

## 🛠️ Technology Stack

- **Frontend**: React 19 with Vite
- **UI Components**: Custom components with Lucide React icons
- **Styling**: Custom CSS with modern design patterns
- **State Management**: React hooks (useState, useEffect)
- **Routing**: React Router DOM
- **Notifications**: React Hot Toast
- **Data**: Mock data for demonstration purposes

## 📦 Installation and Setup

### Prerequisites
- Node.js (version 20.19+ recommended)
- npm or yarn package manager

### Local Development
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd rental-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🏗️ System Architecture

### Component Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Login.css
│   ├── tenant/
│   │   ├── TenantDashboard.jsx
│   │   └── TenantDashboard.css
│   ├── owner/
│   │   ├── OwnerDashboard.jsx
│   │   └── OwnerDashboard.css
│   └── Dashboard.jsx
├── data/
│   └── mockData.js
├── App.jsx
├── App.css
└── main.jsx
```

## 🌐 Deployment

This project is configured for easy deployment on Netlify, Vercel, or any static hosting service.

### Netlify (Recommended)
1. Connect your repository to Netlify
2. Build settings are automatically configured via `netlify.toml`
3. Deploy with one click!

### Manual Deployment
```bash
npm run build
# Upload the 'dist' folder to your hosting service
```

## 🔮 Future Enhancements

- Backend API integration
- Real payment gateway
- Email notifications
- Document management
- Maintenance requests
- Mobile app version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using React and modern web technologies.
