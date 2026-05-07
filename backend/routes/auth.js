const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  login, register, getMe, changePassword,
  forgotPassword, resetPassword, handlePhotoUpload
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Temp disk storage before Cloudinary
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
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
    else cb(new Error('Only image files allowed'));
  },
});

router.post('/login', login);
router.post('/register', upload.single('photo'), register);
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// ✅ Profile update — photo goes to Cloudinary
router.put('/profile', protect, upload.single('photo'), async (req, res) => {
  try {
    const User = require('../models/User');
    const Visitor = require('../models/Visitor');
    const { name, phone, department, company, address } = req.body;
    const updateData = { name, phone, department, company, address };

    // Upload photo to Cloudinary if provided
    if (req.file) {
      const photoUrl = await handlePhotoUpload(req.file, 'visitorpass/profiles');
      if (photoUrl) {
        updateData.photo = photoUrl;
        // Also update visitor profile photo
        await Visitor.findOneAndUpdate(
          { email: req.user.email },
          { photo: photoUrl }
        );
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
