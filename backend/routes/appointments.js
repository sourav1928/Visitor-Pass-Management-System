const express = require('express');
const router = express.Router();
const {
  getAppointments, myAppointments, getAppointment,
  createAppointment, approveAppointment,
  rejectAppointment, cancelAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const Appointment = require('../models/Appointment');
const Visitor = require('../models/Visitor');

router.use(protect);
router.get('/', authorize('admin', 'security', 'employee'), getAppointments);
router.get('/mine', myAppointments);
router.get('/:id', getAppointment);
router.post('/', authorize('admin', 'employee'), createAppointment);
router.patch('/:id/approve', authorize('admin'), approveAppointment);
router.patch('/:id/reject', authorize('admin'), rejectAppointment);
router.patch('/:id/cancel', cancelAppointment);

module.exports = router;
