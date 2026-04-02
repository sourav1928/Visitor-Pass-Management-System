const express = require('express');
const router = express.Router();
const { login, register, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);

// Update own profile
router.put('/profile', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const { name, phone, department, company, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, department, company, address },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
