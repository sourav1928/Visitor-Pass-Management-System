# Visitor Pass Management System

A full-stack MERN application for digitizing visitor management in organizations.

---

## Features

- JWT-based authentication with 4 roles (Admin, Security, Employee, Visitor)
- Visitor registration with photo upload
- Appointment / pre-registration system with email invites
- QR code pass generation
- PDF badge download
- Check-in / check-out with scan logs
- Dashboard with analytics
- Email notifications via Nodemailer

---

## Project Structure

```
visitor-pass-system/
├── backend/      ← Express + MongoDB API
└── frontend/     ← React + Vite UI
```

---

## Backend Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```
MONGO_URI=mongodb://localhost:27017/visitorpass
JWT_SECRET=your_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
```

> For Gmail: enable 2FA → generate App Password at myaccount.google.com/apppasswords

### 3. Create uploads folder
```bash
mkdir uploads
```

### 4. Seed demo data
```bash
npm run seed
```

### 5. Start the server
```bash
npm run dev      # development (nodemon)
npm start        # production
```

Server runs at: `http://localhost:5000`

---

## Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
`.env` content:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Start the dev server
```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Demo Accounts (after seeding)

| Role     | Email                  | Password |
|----------|------------------------|----------|
| Admin    | admin@demo.com         | demo123  |
| Security | security@demo.com      | demo123  |
| Employee | employee@demo.com      | demo123  |
| Visitor  | visitor@demo.com       | demo123  |

---

## API Endpoints

### Auth
| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| POST   | /api/auth/login      | Login               |
| POST   | /api/auth/register   | Register            |
| GET    | /api/auth/me         | Get current user    |

### Visitors
| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| GET    | /api/visitors        | List all visitors   |
| POST   | /api/visitors        | Create visitor      |
| GET    | /api/visitors/:id    | Get visitor         |
| PUT    | /api/visitors/:id    | Update visitor      |
| DELETE | /api/visitors/:id    | Delete visitor      |

### Appointments
| Method | Endpoint                        | Description        |
|--------|---------------------------------|--------------------|
| GET    | /api/appointments               | List appointments  |
| POST   | /api/appointments               | Create / invite    |
| PATCH  | /api/appointments/:id/approve   | Approve            |
| PATCH  | /api/appointments/:id/reject    | Reject             |

### Passes
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | /api/passes           | List passes         |
| POST   | /api/passes/issue     | Issue new pass      |
| GET    | /api/passes/qr/:code  | Lookup by QR code   |
| GET    | /api/passes/:id/pdf   | Download PDF badge  |

### Check Logs
| Method | Endpoint                  | Description    |
|--------|---------------------------|----------------|
| GET    | /api/checklogs            | Get all logs   |
| POST   | /api/checklogs/checkin    | Check in       |
| POST   | /api/checklogs/checkout   | Check out      |

### Dashboard
| Method | Endpoint                       | Description        |
|--------|--------------------------------|--------------------|
| GET    | /api/dashboard/stats           | Summary stats      |
| GET    | /api/dashboard/recent-visitors | Recent passes      |
| GET    | /api/dashboard/weekly          | Chart data         |

---

## MongoDB Collections

- **users** — accounts for all roles
- **visitors** — visitor profiles
- **appointments** — invites and pre-registrations
- **passes** — issued QR passes
- **checklogs** — check-in/out audit trail

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, React Router v6     |
| Backend   | Node.js, Express.js                 |
| Database  | MongoDB, Mongoose                   |
| Auth      | JWT, bcryptjs                       |
| QR Code   | qrcode (backend), qrcode.react (FE) |
| PDF       | pdfkit                              |
| Email     | Nodemailer                          |
| Charts    | Recharts                            |
