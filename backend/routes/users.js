const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(protect);
router.use(authorize('admin', 'security'));

// GET all users — never return visitors (they belong in /visitors)
router.get('/', async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};

    // Only staff roles — exclude visitor always
    if (role && role !== 'visitor') {
      query.role = role;
    } else {
      query.role = { $in: ['admin', 'security', 'employee'] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create staff user (admin creates security/employee accounts)
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, phone, department } = req.body;

    // Prevent creating visitor accounts from here
    if (role === 'visitor') {
      return res.status(400).json({ message: 'Use the register page to create visitor accounts' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    const user = await User.create({ name, email, password, role, phone, department });
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update user
router.put('/:id', authorize('admin'), async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE user
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;