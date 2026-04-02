const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String },
  company: { type: String },
  address: { type: String },
  photo: { type: String },
  idType: {
    type: String,
    enum: ['aadhar', 'passport', 'driving_license', 'voter_id', 'other'],
  },
  idNumber: { type: String },
  userAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalVisits: { type: Number, default: 0 },
  lastVisit: { type: Date },
  isBlacklisted: { type: Boolean, default: false },
  blacklistReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Visitor', visitorSchema);
