const Visitor = require('../models/Visitor');

// @GET /api/visitors
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

// @GET /api/visitors/:id
const getVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    res.json({ visitor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/visitors
const createVisitor = async (req, res) => {
  try {
    const { name, email, phone, company, idType, idNumber, address } = req.body;

    let visitor = await Visitor.findOne({ email });
    if (visitor) {
      // Return existing visitor instead of error — useful for security issuing pass
      return res.status(200).json({ visitor, existing: true });
    }

    visitor = await Visitor.create({
      name, email, phone, company, idType, idNumber, address,
      photo: req.file ? `/uploads/${req.file.filename}` : undefined,
    });

    res.status(201).json({ visitor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PUT /api/visitors/:id
const updateVisitor = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.photo = `/uploads/${req.file.filename}`;

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

// @DELETE /api/visitors/:id
const deleteVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndDelete(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    res.json({ message: 'Visitor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PATCH /api/visitors/:id/blacklist
const blacklistVisitor = async (req, res) => {
  try {
    const { reason } = req.body;
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { isBlacklisted: true, blacklistReason: reason || 'No reason provided' },
      { new: true }
    );
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    res.json({ visitor, message: 'Visitor blacklisted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PATCH /api/visitors/:id/unblacklist
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
