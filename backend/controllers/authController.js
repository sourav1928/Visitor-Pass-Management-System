const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Visitor = require('../models/Visitor');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
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
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        photo: user.photo,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/auth/register — public visitor self-registration
const register = async (req, res) => {
  try {
    const { name, email, password, phone, company, address, idType, idNumber } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    // Check user already exists
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'An account with this email already exists' });

    // Always visitor on public register
    const user = await User.create({
      name, email, password,
      role: 'visitor',
      phone, company, address,
    });

    // ✅ Also create Visitor profile so they appear in /admin/visitors
    const visitorExists = await Visitor.findOne({ email });
    if (!visitorExists) {
      await Visitor.create({
        name, email, phone,
        company, address,
        idType, idNumber,
        userAccount: user._id,
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
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

module.exports = { login, register, getMe, changePassword };