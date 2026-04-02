# Visitor Pass Management System

A full-stack MERN application for digitizing visitor management in organizations.

Built with: **MongoDB · Express · React · Node.js**

---

## Features

| Feature | Status |
|---|---|
| JWT Authentication (4 roles) | ✅ |
| Visitor Registration + Photo | ✅ |
| Appointment / Pre-Registration | ✅ |
| QR Code Pass Generation | ✅ |
| PDF Badge Download | ✅ |
| Camera QR Scanner (Check-in/out) | ✅ |
| Email Notifications | ✅ |
| Admin Dashboard + Analytics | ✅ |
| CSV Export / Reports | ✅ |
| Seed Script (Demo Data) | ✅ |

---

## Project Structure

```
visitor-pass-system/
├── backend/          ← Express + MongoDB API (port 5000)
└── frontend/         ← React + Vite UI (port 5173)
```

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone and setup backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET
mkdir uploads
npm run seed    # creates demo accounts
npm run dev     # starts on http://localhost:5000
```

### 2. Setup frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev     # starts on http://localhost:5173
```

### 3. Open browser
```
http://localhost:5173
```

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.com | demo123 |
| Security | security@demo.com | demo123 |
| Employee | employee@demo.com | demo123 |
| Visitor | visitor@demo.com | demo123 |

---

## User Roles

| Role | Can Do |
|---|---|
| **Admin** | Full access — manage users, visitors, passes, reports |
| **Security** | Scan QR codes, issue walk-in passes, check-in/out |
| **Employee** | Invite visitors, manage own appointments |
| **Visitor** | Self-register, view QR pass, pre-register via invite link |

---

## API Endpoints

### Auth
```
POST   /api/auth/login          Login
POST   /api/auth/register       Public visitor registration
GET    /api/auth/me             Get current user
PUT    /api/auth/profile        Update profile
PUT    /api/auth/password       Change password
```

### Visitors
```
GET    /api/visitors            List all visitors
POST   /api/visitors            Create visitor
GET    /api/visitors/:id        Get visitor
PUT    /api/visitors/:id        Update visitor
DELETE /api/visitors/:id        Delete visitor (admin)
PATCH  /api/visitors/:id/blacklist    Blacklist visitor
PATCH  /api/visitors/:id/unblacklist  Remove from blacklist
```

### Appointments
```
GET    /api/appointments         List appointments
POST   /api/appointments         Create / invite visitor
GET    /api/appointments/mine    Employee's own appointments
PATCH  /api/appointments/:id/approve   Approve (admin)
PATCH  /api/appointments/:id/reject    Reject (admin)
PATCH  /api/appointments/:id/cancel    Cancel
POST   /api/appointments/pre-register/:token   Public pre-reg
```

### Passes
```
GET    /api/passes               List all passes
POST   /api/passes/issue         Issue a new pass
GET    /api/passes/qr/:code      Lookup by QR code (scanner)
GET    /api/passes/:id/pdf       Download PDF badge
PATCH  /api/passes/:id/revoke   Revoke a pass (admin)
```

### Check Logs
```
GET    /api/checklogs            All logs (filterable)
GET    /api/checklogs/today      Today's stats
POST   /api/checklogs/checkin    Check visitor in
POST   /api/checklogs/checkout   Check visitor out
```

### Dashboard
```
GET    /api/dashboard/stats          Summary statistics
GET    /api/dashboard/recent-visitors  Recent passes
GET    /api/dashboard/weekly         Chart data (7 days)
GET    /api/dashboard/purpose-stats  Visit purposes
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Custom CSS Variables (dark theme) |
| Charts | Recharts |
| QR Code | qrcode.react (display), html5-qrcode (scan) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| PDF | PDFKit |
| Email | Nodemailer |

---

## Screenshots

> Add screenshots here for submission

---

## Bonus Features Implemented
- Visitor blacklisting
- Pass revocation
- Auto-expiry of passes
- Pre-registration via email invite link
- CSV export for reports
- Real camera QR scanner
