const Appointment = require('../models/Appointment');
const { sendAppointmentInvite, sendApprovalEmail } = require('../utils/sendEmail');
const { v4: uuidv4 } = require('uuid');

// @GET /api/appointments
const getAppointments = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    const query = {};

    // Employees only see their own appointments
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

// @GET /api/appointments/mine  (employee's own appointments)
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

// @GET /api/appointments/:id
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

// @POST /api/appointments  (employee invites a visitor)
const createAppointment = async (req, res) => {
  try {
    const { visitorName, visitorEmail, visitorPhone, purpose, date, time, notes } = req.body;

    const preRegToken = uuidv4();

    const appointment = await Appointment.create({
      visitorName, visitorEmail, visitorPhone,
      purpose, date, time, notes,
      host: req.user._id,
      preRegToken,
    });

    // Send invite email to visitor
    try {
      await sendAppointmentInvite({
        to: visitorEmail,
        visitorName,
        hostName: req.user.name,
        date, time, purpose,
        preRegLink: `${process.env.FRONTEND_URL}/pre-register/${preRegToken}`,
      });
    } catch (emailErr) {
      console.warn('Email send failed (non-critical):', emailErr.message);
    }

    const populated = await appointment.populate('host', 'name email');
    res.status(201).json({ appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PATCH /api/appointments/:id/approve  (admin approves)
const approveAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    ).populate('host', 'name email');

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Notify visitor
    try {
      await sendApprovalEmail({
        to: appointment.visitorEmail,
        visitorName: appointment.visitorName,
        hostName: appointment.host.name,
        date: appointment.date,
        time: appointment.time,
      });
    } catch (e) {
      console.warn('Approval email failed:', e.message);
    }

    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PATCH /api/appointments/:id/reject
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

// @PATCH /api/appointments/:id/cancel
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
