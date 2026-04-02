const express = require('express');
const router = express.Router();
const { getLogs, checkIn, checkOut, getTodayStats } = require('../controllers/checkLogController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(protect);
router.use(authorize('admin', 'security'));

router.get('/', getLogs);
router.get('/today', getTodayStats);
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);

module.exports = router;
