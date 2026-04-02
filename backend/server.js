require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const app = express();

// ── Connect Database ──────────────────────────────────
connectDB();

// ── Ensure uploads folder exists ─────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Middleware ────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Static files ──────────────────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ── Public pre-registration route (no auth) ───────────
app.post('/api/appointments/pre-register/:token', async (req, res) => {
  try {
    const Appointment = require('./models/Appointment');
    const Visitor = require('./models/Visitor');

    const appointment = await Appointment.findOne({ preRegToken: req.params.token });
    if (!appointment) {
      return res.status(404).json({ message: 'Invalid or expired registration link' });
    }
    if (appointment.preRegCompleted) {
      return res.status(400).json({ message: 'Pre-registration already completed' });
    }

    const { name, email, phone, company, idType, idNumber, address } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Find or create visitor
    let visitor = await Visitor.findOne({ email });
    if (!visitor) {
      visitor = await Visitor.create({ name, email, phone, company, idType, idNumber, address });
    }

    appointment.visitor = visitor._id;
    appointment.preRegCompleted = true;
    await appointment.save();

    res.json({ message: 'Pre-registration complete! Your pass will be issued upon approval.', visitor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── API Routes ────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/passes', require('./routes/passes'));
app.use('/api/checklogs', require('./routes/checklogs'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ── Health Check ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
});

// ── 404 Handler ───────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start Server ──────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
