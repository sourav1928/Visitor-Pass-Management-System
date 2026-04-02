const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  // Visitor info (filled at invite time, before visitor registers)
  visitorName: { type: String, required: true },
  visitorEmail: { type: String, required: true, lowercase: true },
  visitorPhone: { type: String },

  // Linked visitor doc (set after visitor pre-registers)
  visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor' },

  // Host (the employee who invited)
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  purpose: {
    type: String,
    enum: ['meeting', 'interview', 'vendor', 'delivery', 'client', 'other'],
    required: true,
  },

  date: { type: Date, required: true },
  time: { type: String, required: true },   // e.g. "10:30"
  duration: { type: Number, default: 60 },  // minutes

  notes: { type: String },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending',
  },

  // Pre-registration token (sent via email to visitor)
  preRegToken: { type: String },
  preRegCompleted: { type: Boolean, default: false },

  // Pass generated from this appointment
  pass: { type: mongoose.Schema.Types.ObjectId, ref: 'Pass' },

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
