const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const { sendAppointmentInvite } = require('../utils/sendEmail');
const { sendInviteSMS } = require('../utils/sendSMS');
const { v4: uuidv4 } = require('uuid');

const getAppointments = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    const query = {};
    if (req.user.role === 'employee') query.host = req.user._id;
    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }
    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate('host', 'name email department')
      .populate('visitor', 'name email company')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ appointments, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const myAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ host: req.user._id })
      .populate('visitor', 'name email company')
      .sort({ date: -1 });
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('host', 'name email department')
      .populate('visitor', 'name email company photo');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Employee invites visitor → sends registration link
// Pass is generated AFTER visitor completes registration
const createAppointment = async (req, res) => {
  try {
    const { visitorName, visitorEmail, visitorPhone, purpose, date, time, notes } = req.body;
    const preRegToken = uuidv4();

    const appointment = await Appointment.create({
      visitorName, visitorEmail, visitorPhone,
      purpose, date, time, notes,
      host: req.user._id,
      preRegToken,
      status: 'pending',
      preRegCompleted: false,
    });

    const preRegLink = `${process.env.FRONTEND_URL}/pre-register/${preRegToken}`;

    // Send invite email with registration link
    try {
      await sendAppointmentInvite({
        to: visitorEmail,
        visitorName,
        hostName: req.user.name,
        date, time, purpose,
        preRegLink,
      });
      console.log(`✅ Invite email sent to: ${visitorEmail}`);
    } catch (emailErr) {
      console.warn('Invite email failed (non-critical):', emailErr.message);
    }

    // Send invite SMS
    try {
      await sendInviteSMS({
        phone: visitorPhone,
        visitorName,
        hostName: req.user.name,
        date, time,
        preRegLink,
      });
    } catch (smsErr) {
      console.warn('Invite SMS failed (non-critical):', smsErr.message);
    }

    const populated = await appointment.populate('host', 'name email');
    res.status(201).json({ appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const approveAppointment = async (req, res) => {
  res.json({ message: 'Pass is auto-generated when visitor completes registration' });
};

const rejectAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: req.body.reason },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAppointments, myAppointments, getAppointment,
  createAppointment, approveAppointment, rejectAppointment, cancelAppointment,
};
