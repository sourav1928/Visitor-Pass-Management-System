const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const { sendPasswordResetEmail } = require('../utils/sendEmail');
const { uploadToCloudinary } = require('../utils/cloudinary');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Helper: upload photo to Cloudinary and delete temp file
const handlePhotoUpload = async (file, folder = 'visitorpass/photos') => {
  if (!file) return null;
  try {
    const url = await uploadToCloudinary(file.path, folder);
    // Delete temp file after upload
    try { fs.unlinkSync(file.path); } catch (e) {}
    return url;
  } catch (err) {
    console.warn('Cloudinary upload failed:', err.message);
    try { fs.unlinkSync(file.path); } catch (e) {}
    return null;
  }
};

// @POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isActive)
      return res.status(401).json({ message: 'Your account has been deactivated' });

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, phone: user.phone,
        department: user.department, photo: user.photo,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, phone, company, address, idType, idNumber } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'An account with this email already exists' });

    // ✅ Upload photo to Cloudinary
    const photoUrl = await handlePhotoUpload(req.file);

    const user = await User.create({
      name, email, password, role: 'visitor',
      phone, company, address,
      photo: photoUrl,
    });

    // Create visitor profile
    const visitorExists = await Visitor.findOne({ email });
    if (!visitorExists) {
      await Visitor.create({
        name, email, phone, company, address,
        idType, idNumber,
        photo: photoUrl,
        userAccount: user._id,
      });
    }

    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, phone: user.phone, photo: user.photo,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// @PUT /api/auth/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If this email exists, a reset link has been sent' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail({ to: email, name: user.name, resetLink });
    } catch (emailErr) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Failed to send reset email. Try again later.' });
    }

    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const resetTokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Reset link is invalid or has expired' });

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { login, register, getMe, changePassword, forgotPassword, resetPassword, handlePhotoUpload };
