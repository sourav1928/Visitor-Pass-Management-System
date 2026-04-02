const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');

// @GET /api/checklogs
const getLogs = async (req, res) => {
  try {
    const { date, action, visitorId, page = 1, limit = 30 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (visitorId) query.visitor = visitorId;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.timestamp = { $gte: start, $lte: end };
    }

    const total = await CheckLog.countDocuments(query);
    const logs = await CheckLog.find(query)
      .populate('visitor', 'name email company')
      .populate('pass', 'passCode purpose')
      .populate('performedBy', 'name role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/checklogs/checkin
const checkIn = async (req, res) => {
  try {
    const { passId, notes, location } = req.body;
    if (!passId) return res.status(400).json({ message: 'passId is required' });

    const pass = await Pass.findById(passId).populate('visitor');
    if (!pass) return res.status(404).json({ message: 'Pass not found' });

    // Validations
    if (pass.status === 'checked-in') {
      return res.status(400).json({ message: 'Visitor is already checked in' });
    }
    if (pass.status === 'checked-out') {
      return res.status(400).json({ message: 'Pass has already been used for check-out' });
    }
    if (pass.status === 'revoked') {
      return res.status(400).json({ message: 'This pass has been revoked' });
    }
    if (pass.status === 'expired' || new Date() > new Date(pass.validUntil)) {
      pass.status = 'expired';
      await pass.save();
      return res.status(400).json({ message: 'This pass has expired' });
    }

    // Create log
    const log = await CheckLog.create({
      pass: passId,
      visitor: pass.visitor._id,
      action: 'check-in',
      performedBy: req.user._id,
      notes,
      location: location || 'Main Gate',
    });

    // Update pass
    pass.status = 'checked-in';
    pass.checkedInAt = new Date();
    await pass.save();

    const populated = await log.populate([
      { path: 'visitor', select: 'name email' },
      { path: 'performedBy', select: 'name' },
      { path: 'pass', select: 'passCode purpose' },
    ]);

    res.status(201).json({ log: populated, pass });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/checklogs/checkout
const checkOut = async (req, res) => {
  try {
    const { passId, notes, location } = req.body;
    if (!passId) return res.status(400).json({ message: 'passId is required' });

    const pass = await Pass.findById(passId).populate('visitor');
    if (!pass) return res.status(404).json({ message: 'Pass not found' });

    if (pass.status !== 'checked-in') {
      return res.status(400).json({ message: 'Visitor is not currently checked in' });
    }

    const log = await CheckLog.create({
      pass: passId,
      visitor: pass.visitor._id,
      action: 'check-out',
      performedBy: req.user._id,
      notes,
      location: location || 'Main Gate',
    });

    pass.status = 'checked-out';
    pass.checkedOutAt = new Date();
    await pass.save();

    const populated = await log.populate([
      { path: 'visitor', select: 'name email' },
      { path: 'performedBy', select: 'name' },
      { path: 'pass', select: 'passCode purpose' },
    ]);

    res.status(201).json({ log: populated, pass });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/checklogs/today — quick summary for dashboard
const getTodayStats = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const [checkIns, checkOuts] = await Promise.all([
      CheckLog.countDocuments({ action: 'check-in', timestamp: { $gte: start, $lte: end } }),
      CheckLog.countDocuments({ action: 'check-out', timestamp: { $gte: start, $lte: end } }),
    ]);

    res.json({ checkIns, checkOuts, date: start });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getLogs, checkIn, checkOut, getTodayStats };
