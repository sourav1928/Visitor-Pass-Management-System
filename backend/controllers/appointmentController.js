const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const crypto = require('crypto');
const { sendAppointmentInvite, sendApprovalEmail } = require('../utils/sendEmail');
const { sendInviteSMS, sendApprovalSMS } = require('../utils/sendSMS');
const generateQR = require('../utils/generateQR');
const { v4: uuidv4 } = require('uuid');

// @GET /api/appointments
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

// @GET /api/appointments/mine
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

// @POST /api/appointments
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

    const preRegLink = `${process.env.FRONTEND_URL}/pre-register/${preRegToken}`;

    try {
      await sendAppointmentInvite({
        to: visitorEmail,
        visitorName,
        hostName: req.user.name,
        date, time, purpose,
        preRegLink,
      });
    } catch (emailErr) {
      console.warn('Email invite failed (non-critical):', emailErr.message);
    }

    try {
      await sendInviteSMS({
        phone: visitorPhone,
        visitorName,
        hostName: req.user.name,
        date, time,
        preRegLink,
      });
    } catch (smsErr) {
      console.warn('SMS invite failed (non-critical):', smsErr.message);
    }

    const populated = await appointment.populate('host', 'name email');
    res.status(201).json({ appointment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PATCH /api/appointments/:id/approve
const approveAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    ).populate('host', 'name email');

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // ── Auto-create Visitor profile if not linked ─────────
    let visitorId = appointment.visitor;
    if (!visitorId) {
      let visitor = await Visitor.findOne({ email: appointment.visitorEmail });
      if (!visitor) {
        visitor = await Visitor.create({
          name: appointment.visitorName,
          email: appointment.visitorEmail,
          phone: appointment.visitorPhone || '',
        });
      }
      visitorId = visitor._id;
      appointment.visitor = visitorId;
    }

    // ── Auto-create User login account ────────────────────
    // tempPassword = plain text password to send in email
    // isNewUser = whether we just created the account
    let tempPassword = null;
    let isNewUser = false;

    const existingUser = await User.findOne({ email: appointment.visitorEmail });
    if (!existingUser) {
      // New visitor — generate password and create account
      tempPassword = crypto.randomBytes(4).toString('hex'); // e.g. "a3f1b9c2"
      isNewUser = true;

      const newUser = await User.create({
        name: appointment.visitorName,
        email: appointment.visitorEmail,
        password: tempPassword, // pre-save hook will hash this
        phone: appointment.visitorPhone || '',
        role: 'visitor',
      });

      await Visitor.findByIdAndUpdate(visitorId, { userAccount: newUser._id });
      console.log(`✅ New visitor account created: ${appointment.visitorEmail} / ${tempPassword}`);
    } else {
      console.log(`ℹ️  Visitor already has account: ${appointment.visitorEmail}`);
    }

    // ── Auto-generate Pass ────────────────────────────────
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = (appointment.time || '09:00').split(':').map(Number);
    const validFrom = new Date(appointmentDate);
    validFrom.setHours(hours, minutes, 0, 0);
    const durationMs = (appointment.duration || 480) * 60 * 1000;
    const validUntil = new Date(validFrom.getTime() + durationMs);

    const pass = await Pass.create({
      visitor: visitorId,
      host: appointment.host._id,
      appointment: appointment._id,
      purpose: appointment.purpose,
      validFrom,
      validUntil,
      issuedBy: req.user._id,
    });

    const qrBase64 = await generateQR(`VPMS:${pass.passCode}`);
    pass.qrCode = qrBase64;
    await pass.save();

    appointment.pass = pass._id;
    await appointment.save();

    await Visitor.findByIdAndUpdate(visitorId, {
      $inc: { totalVisits: 1 },
      lastVisit: new Date(),
    });

    // ── Send approval EMAIL with credentials + pass code ──
    try {
      await sendApprovalEmail({
        to: appointment.visitorEmail,
        visitorName: appointment.visitorName,
        hostName: appointment.host.name,
        date: appointment.date,
        time: appointment.time,
        // ✅ Only send password if new account was created
        tempPassword: isNewUser ? tempPassword : null,
        passCode: pass.passCode,
      });
    } catch (e) {
      console.warn('Approval email failed:', e.message);
    }

    // ── Send approval SMS ─────────────────────────────────
    try {
      await sendApprovalSMS({
        phone: appointment.visitorPhone,
        visitorName: appointment.visitorName,
        hostName: appointment.host.name,
        date: appointment.date,
        time: appointment.time,
        passCode: pass.passCode,
      });
    } catch (e) {
      console.warn('Approval SMS failed:', e.message);
    }

    res.json({ appointment, pass });
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