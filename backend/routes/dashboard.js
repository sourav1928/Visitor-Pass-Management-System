const express = require('express');
const router = express.Router();
const {
  getStats, getRecentVisitors,
  getRecentLogs, getWeeklyData, getPurposeStats,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(protect);
router.use(authorize('admin', 'security'));

router.get('/stats', getStats);
router.get('/recent-visitors', getRecentVisitors);
router.get('/check-logs', getRecentLogs);
router.get('/weekly', getWeeklyData);
router.get('/purpose-stats', getPurposeStats);

module.exports = router;
