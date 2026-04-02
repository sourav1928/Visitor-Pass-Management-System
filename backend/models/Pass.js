const mongoose = require('mongoose');

// Generate a readable pass code without uuid dependency at model level
const generatePassCode = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VP-${ts}-${rand}`;
};

const passSchema = new mongoose.Schema({
  passCode: {
    type: String,
    unique: true,
    default: generatePassCode,
  },
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  purpose: { type: String, required: true },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'checked-in', 'checked-out', 'expired', 'revoked'],
    default: 'active',
  },
  qrCode: { type: String },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  floor: { type: String },
  room: { type: String },
  checkedInAt: { type: Date },
  checkedOutAt: { type: Date },
  revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  revokedAt: { type: Date },
  revokeReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Pass', passSchema);
