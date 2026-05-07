const Visitor = require('../models/Visitor');

const getVisitors = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, blacklisted } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (blacklisted === 'true') query.isBlacklisted = true;
    if (blacklisted === 'false') query.isBlacklisted = false;

    const total = await Visitor.countDocuments(query);
    const visitors = await Visitor.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ visitors, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    res.json({ visitor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createVisitor = async (req, res) => {
  try {
    const { name, email, phone, company, idType, idNumber, address } = req.body;

    let visitor = await Visitor.findOne({ email });
    if (visitor) return res.status(200).json({ visitor, existing: true });

    // ✅ Use Cloudinary URL from middleware
    const photoUrl = req.cloudinaryPhotoUrl || undefined;

    visitor = await Visitor.create({
      name, email, phone, company, idType, idNumber, address,
      photo: photoUrl,
    });

    res.status(201).json({ visitor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateVisitor = async (req, res) => {
  try {
    const updateData = { ...req.body };
    // ✅ Use Cloudinary URL from middleware
    if (req.cloudinaryPhotoUrl) updateData.photo = req.cloudinaryPhotoUrl;

    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    res.json({ visitor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndDelete(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    res.json({ message: 'Visitor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const blacklistVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { isBlacklisted: true, blacklistReason: req.body.reason || 'No reason provided' },
      { new: true }
    );
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    res.json({ visitor, message: 'Visitor blacklisted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const unblacklistVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { isBlacklisted: false, blacklistReason: '' },
      { new: true }
    );
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    res.json({ visitor, message: 'Visitor removed from blacklist' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getVisitors, getVisitor, createVisitor,
  updateVisitor, deleteVisitor,
  blacklistVisitor, unblacklistVisitor,
};
