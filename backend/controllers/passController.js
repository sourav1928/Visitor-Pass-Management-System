const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const crypto = require('crypto');
const generateQR = require('../utils/generateQR');
const generatePDF = require('../utils/generatePDF');
const { sendApprovalEmail } = require('../utils/sendEmail');
const { sendApprovalSMS } = require('../utils/sendSMS');

// @GET /api/passes
const getPasses = async (req, res) => {
  try {
    const { status, visitorId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (visitorId) query.visitor = visitorId;

    if (req.user.role === 'visitor') {
      const visitor = await Visitor.findOne({
        email: { $regex: new RegExp(`^${req.user.email}$`, 'i') }
      });
      if (!visitor) return res.json({ passes: [], total: 0, page: 1, pages: 0 });
      query.visitor = visitor._id;
    }

    const nowUtc = new Date();
    await Pass.updateMany(
      { status: 'active', validUntil: { $lt: nowUtc } },
      { status: 'expired' }
    );

    const total = await Pass.countDocuments(query);
    const passes = await Pass.find(query)
      .populate('visitor', 'name email company photo')
      .populate('host', 'name department')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ passes, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/passes/qr/:qrCode
const getPassByQR = async (req, res) => {
  try {
    const passCode = req.params.qrCode.replace(/VPMS:/i, '').trim().toUpperCase();
    const pass = await Pass.findOne({ passCode })
      .populate('visitor', 'name email phone company photo isBlacklisted')
      .populate('host', 'name email department')
      .populate('appointment');

    if (!pass) return res.status(404).json({ message: 'Pass not found. Invalid QR code.' });

    const nowUtc = new Date();
    const validUntilUtc = new Date(pass.validUntil);

    console.log(`🔍 Pass check: now=${nowUtc.toISOString()}, valid until=${validUntilUtc.toISOString()}, is expired=${nowUtc > validUntilUtc}`);

    if (nowUtc > validUntilUtc && pass.status === 'active') {
      pass.status = 'expired';
      await pass.save();
      return res.status(403).json({ message: 'This pass has expired', pass });
    }

    if (pass.visitor?.isBlacklisted) {
      return res.status(403).json({ message: 'Visitor is blacklisted', pass });
    }

    res.json({ pass });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/passes/:id
const getPass = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id)
      .populate('visitor', 'name email phone company photo')
      .populate('host', 'name email department')
      .populate('issuedBy', 'name');
    if (!pass) return res.status(404).json({ message: 'Pass not found' });

    const nowUtc = new Date();
    const validUntilUtc = new Date(pass.validUntil);
    if (nowUtc > validUntilUtc && pass.status === 'active') {
      pass.status = 'expired';
      await pass.save();
    }

    res.json({ pass });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/passes/issue
const issuePass = async (req, res) => {
  try {
    const { visitorId, hostId, appointmentId, purpose, validFrom, validUntil, floor, room } = req.body;

    if (!visitorId || !hostId || !purpose)
      return res.status(400).json({ message: 'visitorId, hostId, and purpose are required' });

    const visitor = await Visitor.findById(visitorId);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    if (visitor.isBlacklisted)
      return res.status(403).json({ message: 'Visitor is blacklisted' });

    // FIX: Ensure times are in future
    let passValidFrom = new Date();
    let passValidUntil = new Date(Date.now() + 8 * 60 * 60 * 1000);

    if (validFrom) {
      passValidFrom = new Date(validFrom);
      if (passValidFrom < new Date()) passValidFrom = new Date();
    }

    if (validUntil) {
      passValidUntil = new Date(validUntil);
      if (passValidUntil < new Date()) passValidUntil = new Date(Date.now() + 8 * 60 * 60 * 1000);
    } else {
      passValidUntil = new Date(passValidFrom.getTime() + 8 * 60 * 60 * 1000);
    }

    console.log(`📝 Issuing pass: from=${passValidFrom.toISOString()}, until=${passValidUntil.toISOString()}`);

    const pass = await Pass.create({
      visitor: visitorId,
      host: hostId,
      appointment: appointmentId || undefined,
      purpose,
      validFrom: passValidFrom,
      validUntil: passValidUntil,
      issuedBy: req.user._id,
      floor, room,
    });

    const qrBase64 = await generateQR(`VPMS:${pass.passCode}`);
    pass.qrCode = qrBase64;
    await pass.save();

    await Visitor.findByIdAndUpdate(visitorId, {
      $inc: { totalVisits: 1 },
      lastVisit: new Date(),
    });

    let tempPassword = null;
    let isNewUser = false;
    const existingUser = await User.findOne({
      email: { $regex: new RegExp(`^${visitor.email}$`, 'i') }
    });

    if (!existingUser) {
      tempPassword = crypto.randomBytes(4).toString('hex');
      isNewUser = true;
      const newUser = await User.create({
        name: visitor.name,
        email: visitor.email,
        password: tempPassword,
        phone: visitor.phone || '',
        role: 'visitor',
        photo: visitor.photo || null,
      });
      await Visitor.findByIdAndUpdate(visitorId, { userAccount: newUser._id });
    }

    const host = await User.findById(hostId).select('name');

    try {
      await sendApprovalEmail({
        to: visitor.email,
        visitorName: visitor.name,
        hostName: host?.name || 'Host',
        date: pass.validFrom,
        time: new Date(pass.validFrom).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        tempPassword: isNewUser ? tempPassword : null,
        passCode: pass.passCode,
        qrCode: pass.qrCode,
        validFrom: pass.validFrom,
        validUntil: pass.validUntil,
        purpose, floor, room,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
      });
      console.log(`✅ Pass emailed to: ${visitor.email}`);
    } catch (emailErr) {
      console.warn('Pass email failed (non-critical):', emailErr.message);
    }

    try {
      await sendApprovalSMS({
        phone: visitor.phone,
        visitorName: visitor.name,
        hostName: host?.name || 'Host',
        date: pass.validFrom,
        time: new Date(pass.validFrom).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        passCode: pass.passCode,
      });
    } catch (smsErr) {
      console.warn('Pass SMS failed (non-critical):', smsErr.message);
    }

    const populated = await pass.populate([
      { path: 'visitor', select: 'name email company photo' },
      { path: 'host', select: 'name department' },
      { path: 'issuedBy', select: 'name' },
    ]);

    res.status(201).json({ pass: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PATCH /api/passes/:id/revoke
const revokePass = async (req, res) => {
  try {
    const pass = await Pass.findByIdAndUpdate(
      req.params.id,
      {
        status: 'revoked',
        revokedBy: req.user._id,
        revokedAt: new Date(),
        revokeReason: req.body.reason || 'Revoked by admin',
      },
      { new: true }
    );
    if (!pass) return res.status(404).json({ message: 'Pass not found' });
    res.json({ pass, message: 'Pass revoked successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/passes/:id/pdf
const downloadPassPDF = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id)
      .populate('visitor', 'name email company photo')
      .populate('host', 'name department');
    if (!pass) return res.status(404).json({ message: 'Pass not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=pass-${pass.passCode}.pdf`);
    const pdfStream = await generatePDF(pass);
    pdfStream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPasses, getPassByQR, getPass, issuePass, revokePass, downloadPassPDF };