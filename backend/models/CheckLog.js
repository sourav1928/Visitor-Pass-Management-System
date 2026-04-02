const mongoose = require('mongoose');

const checkLogSchema = new mongoose.Schema({
  pass: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass', required: true },
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },

  action: {
    type: String,
    enum: ['check-in', 'check-out'],
    required: true,
  },

  timestamp: { type: Date, default: Date.now },

  // Who performed the scan
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // For audit
  notes: { type: String },
  location: { type: String },  // gate / entry point
}, { timestamps: true });

module.exports = mongoose.model('CheckLog', checkLogSchema);
