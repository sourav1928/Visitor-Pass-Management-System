const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const generateQR = require('../utils/generateQR');
const generatePDF = require('../utils/generatePDF');

// @GET /api/passes
const getPasses = async (req, res) => {
  try {
    const { status, visitorId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (visitorId) query.visitor = visitorId;

    // ✅ Visitors only see their own passes
    if (req.user.role === 'visitor') {
      const visitor = await Visitor.findOne({ email: req.user.email });
      if (!visitor) return res.json({ passes: [], total: 0, page: 1, pages: 0 });
      query.visitor = visitor._id;
    }

    // Auto-expire passes
    await Pass.updateMany(
      { status: 'active', validUntil: { $lt: new Date() } },
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

// @GET /api/passes/qr/:qrCode — security scans this
const getPassByQR = async (req, res) => {
  try {
    const passCode = req.params.qrCode.replace('VPMS:', '').trim();

    const pass = await Pass.findOne({ passCode })
      .populate('visitor', 'name email phone company photo isBlacklisted')
      .populate('host', 'name email department')
      .populate('appointment');

    if (!pass) return res.status(404).json({ message: 'Pass not found. Invalid QR code.' });

    // Auto-expire
    if (new Date() > new Date(pass.validUntil) && pass.status === 'active') {
      pass.status = 'expired';
      await pass.save();
    }

    // Block blacklisted visitors
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
    res.json({ pass });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @POST /api/passes/issue
const issuePass = async (req, res) => {
  try {
    const { visitorId, hostId, appointmentId, purpose, validFrom, validUntil, floor, room } = req.body;

    if (!visitorId || !hostId || !purpose) {
      return res.status(400).json({ message: 'visitorId, hostId, and purpose are required' });
    }

    const visitor = await Visitor.findById(visitorId);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    if (visitor.isBlacklisted) {
      return res.status(403).json({ message: 'Visitor is blacklisted and cannot be issued a pass' });
    }

    const pass = await Pass.create({
      visitor: visitorId,
      host: hostId,
      appointment: appointmentId || undefined,
      purpose,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 8 * 60 * 60 * 1000),
      issuedBy: req.user._id,
      floor, room,
    });

    // Generate QR
    const qrBase64 = await generateQR(`VPMS:${pass.passCode}`);
    pass.qrCode = qrBase64;
    await pass.save();

    // Update visitor stats
    await Visitor.findByIdAndUpdate(visitorId, {
      $inc: { totalVisits: 1 },
      lastVisit: new Date(),
    });

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