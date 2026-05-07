require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const connectDB = require('./config/db');

const app = express();

// ── Connect Database ───────────────────────────────────
connectDB();

// ── Ensure uploads folder exists (temp storage) ────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── CORS ───────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ── Multer — temp disk storage before Cloudinary ───────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `temp-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// Helper to delete temp file after Cloudinary upload
const deleteTempFile = (filePath) => {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) {}
};

// ── PUBLIC: Pre-registration route ─────────────────────
app.post('/api/appointments/pre-register/:token', upload.single('photo'), async (req, res) => {
  const tempFilePath = req.file?.path;
  try {
    const Appointment = require('./models/Appointment');
    const Visitor = require('./models/Visitor');
    const User = require('./models/User');
    const Pass = require('./models/Pass');
    const generateQR = require('./utils/generateQR');
    const { uploadToCloudinary } = require('./utils/cloudinary');
    const { sendApprovalEmail } = require('./utils/sendEmail');
    const { sendApprovalSMS } = require('./utils/sendSMS');

    // Find appointment
    const appointment = await Appointment.findOne({ preRegToken: req.params.token })
      .populate('host', 'name email department');

    if (!appointment) return res.status(404).json({ message: 'Invalid or expired registration link' });
    if (appointment.preRegCompleted) return res.status(400).json({ message: 'Pre-registration already completed. Check your email for your pass.' });

    const { name, email, phone, company, address, idType, idNumber, password } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // ── Upload photo to Cloudinary ─────────────────────
    let photoUrl = null;
    if (tempFilePath) {
      try {
        photoUrl = await uploadToCloudinary(tempFilePath, 'visitorpass/photos');
        console.log(`☁️  Photo uploaded to Cloudinary: ${photoUrl}`);
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed (non-critical):', cloudErr.message);
      } finally {
        deleteTempFile(tempFilePath);
      }
    }

    // ── Find or create Visitor profile ────────────────
    let visitor = await Visitor.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!visitor) {
      visitor = await Visitor.create({
        name, email, phone, company, address,
        idType, idNumber,
        photo: photoUrl,
      });
    } else {
      visitor.name = name;
      if (phone) visitor.phone = phone;
      if (company) visitor.company = company;
      if (address) visitor.address = address;
      if (idType) visitor.idType = idType;
      if (idNumber) visitor.idNumber = idNumber;
      if (photoUrl) visitor.photo = photoUrl;
      await visitor.save();
    }

    // ── Create User account ────────────────────────────
    let tempPassword = null;
    let isNewUser = false;
    let userAccount = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (!userAccount) {
      isNewUser = true;
      tempPassword = password;
      userAccount = await User.create({
        name, email,
        password,
        phone, company, address,
        role: 'visitor',
        photo: photoUrl,
      });
      await Visitor.findByIdAndUpdate(visitor._id, { userAccount: userAccount._id });
    }

    // ── Mark appointment complete ──────────────────────
    appointment.visitor = visitor._id;
    appointment.preRegCompleted = true;
    appointment.status = 'approved';
    await appointment.save();

    // ── Generate Pass ──────────────────────────────────
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = (appointment.time || '09:00').split(':').map(Number);
    const validFrom = new Date(appointmentDate);
    validFrom.setHours(hours, minutes, 0, 0);
    const validUntil = new Date(validFrom.getTime() + 8 * 60 * 60 * 1000);

    const pass = await Pass.create({
      visitor: visitor._id,
      host: appointment.host._id,
      appointment: appointment._id,
      purpose: appointment.purpose,
      validFrom,
      validUntil,
      issuedBy: appointment.host._id,
    });

    const qrBase64 = await generateQR(`VPMS:${pass.passCode}`);
    pass.qrCode = qrBase64;
    await pass.save();

    appointment.pass = pass._id;
    await appointment.save();

    await Visitor.findByIdAndUpdate(visitor._id, {
      $inc: { totalVisits: 1 },
      lastVisit: new Date(),
    });

    // ── Send pass email ────────────────────────────────
    try {
      await sendApprovalEmail({
        to: email,
        visitorName: name,
        hostName: appointment.host?.name || 'Host',
        date: appointment.date,
        time: appointment.time,
        tempPassword: isNewUser ? tempPassword : null,
        passCode: pass.passCode,
        qrCode: pass.qrCode,
        validFrom,
        validUntil,
        purpose: appointment.purpose,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
      });
    } catch (emailErr) {
      console.warn('Pass email failed:', emailErr.message);
    }

    // ── Send SMS ───────────────────────────────────────
    try {
      await sendApprovalSMS({
        phone,
        visitorName: name,
        hostName: appointment.host?.name || 'Host',
        date: appointment.date,
        time: appointment.time,
        passCode: pass.passCode,
      });
    } catch (smsErr) {
      console.warn('SMS failed:', smsErr.message);
    }

    res.json({
      message: 'Registration complete! Check your email for your visitor pass.',
      passCode: pass.passCode,
    });

  } catch (err) {
    deleteTempFile(tempFilePath);
    console.error('Pre-register error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── API Routes ─────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/passes', require('./routes/passes'));
app.use('/api/checklogs', require('./routes/checklogs'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ── Health Check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), env: process.env.NODE_ENV });
});

// ── 404 ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ───────────────────────────────
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
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// ── Start Server ───────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`   Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ configured' : '⚠️  not configured'}`);
});

module.exports = app;
