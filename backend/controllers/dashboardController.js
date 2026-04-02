const Visitor = require('../models/Visitor');
const Pass = require('../models/Pass');
const Appointment = require('../models/Appointment');
const CheckLog = require('../models/CheckLog');

// @GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Auto expire stale passes before counting
    await Pass.updateMany(
      { status: 'active', validUntil: { $lt: new Date() } },
      { status: 'expired' }
    );

    const [
      totalVisitors,
      todayVisitors,
      activePasses,
      checkedIn,
      pendingApprovals,
      todayCheckIns,
      todayCheckOuts,
    ] = await Promise.all([
      Visitor.countDocuments(),
      Pass.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Pass.countDocuments({ status: 'active' }),
      Pass.countDocuments({ status: 'checked-in' }),
      Appointment.countDocuments({ status: 'pending' }),
      CheckLog.countDocuments({ action: 'check-in', timestamp: { $gte: today } }),
      CheckLog.countDocuments({ action: 'check-out', timestamp: { $gte: today } }),
    ]);

    res.json({
      totalVisitors,
      todayVisitors,
      activePasses,
      checkedIn,
      pendingApprovals,
      todayCheckIns,
      todayCheckOuts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/dashboard/recent-visitors
const getRecentVisitors = async (req, res) => {
  try {
    const passes = await Pass.find()
      .populate('visitor', 'name email company photo')
      .populate('host', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ passes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/dashboard/check-logs
const getRecentLogs = async (req, res) => {
  try {
    const logs = await CheckLog.find()
      .populate('visitor', 'name email')
      .populate('pass', 'passCode purpose')
      .populate('performedBy', 'name')
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/dashboard/weekly
const getWeeklyData = async (req, res) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const count = await Pass.countDocuments({
        createdAt: { $gte: start, $lte: end },
      });

      days.push({
        day: start.toLocaleDateString('en-US', { weekday: 'short' }),
        visitors: count,
        date: start.toISOString().slice(0, 10),
      });
    }
    res.json({ data: days });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/dashboard/purpose-stats
const getPurposeStats = async (req, res) => {
  try {
    const stats = await Pass.aggregate([
      { $group: { _id: '$purpose', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const data = stats.map(s => ({ name: s._id, value: s.count }));
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStats, getRecentVisitors, getRecentLogs, getWeeklyData, getPurposeStats };
