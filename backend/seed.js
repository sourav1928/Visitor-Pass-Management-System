require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

const User = require('./models/User');
const Visitor = require('./models/Visitor');
const Appointment = require('./models/Appointment');
const Pass = require('./models/Pass');
const CheckLog = require('./models/CheckLog');
const generateQR = require('./utils/generateQR');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  await Promise.all([
    User.deleteMany(),
    Visitor.deleteMany(),
    Appointment.deleteMany(),
    Pass.deleteMany(),
    CheckLog.deleteMany(),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Hash password ONCE before inserting ──────────────
  // We bypass the pre-save hook by using create() directly
  // with already-hashed passwords so no double-hashing occurs
  const hashed = await bcrypt.hash('123456', 12);

  const users = await User.collection.insertMany([
    { name: 'Admin User', email: 'sourav@admin.com', password: hashed, role: 'admin', phone: '+91 98000 00001', department: 'Administration', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Security Guard', email: 'security@demo.com', password: hashed, role: 'security', phone: '+91 98000 00002', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Priya Singh', email: 'employee@demo.com', password: hashed, role: 'employee', phone: '+91 98000 00003', department: 'Engineering', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Rahul Sharma', email: 'visitor@demo.com', password: hashed, role: 'visitor', phone: '+91 98000 00004', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]);

  // Get inserted user docs as array
  const userDocs = await User.find({});
  console.log('✅ Users created (passwords hashed correctly)');

  // ── Visitors ──────────────────────────────────────────
  const visitors = await Visitor.create([
    { name: 'Arjun Mehta', email: 'arjun@example.com', phone: '+91 98765 43210', company: 'TechCorp Pvt Ltd', idType: 'aadhar', idNumber: 'XXXX-XXXX-1234' },
    { name: 'Sarah Johnson', email: 'sarah@globalinc.com', phone: '+91 91234 56789', company: 'Global Inc', idType: 'passport', idNumber: 'A1234567' },
    { name: 'Wei Zhang', email: 'wei@techfirm.cn', phone: '+91 99887 76655', company: 'Tech Firm Shanghai', idType: 'passport' },
    { name: 'Carlos Rivera', email: 'carlos@vendor.com', phone: '+91 97654 32100', company: 'Rivera Supplies', idType: 'driving_license' },
    { name: 'Fatima Al-Hassan', email: 'fatima@consulting.ae', phone: '+91 96543 21098', company: 'Al-Hassan Consulting', idType: 'passport' },
  ]);
  console.log('✅ Visitors created');

  // Find users by role
  const admin = userDocs.find(u => u.role === 'admin');
  const security = userDocs.find(u => u.role === 'security');
  const employee = userDocs.find(u => u.role === 'employee');

  // ── Appointments ──────────────────────────────────────
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);

  const appointments = await Appointment.create([
    {
      visitorName: visitors[0].name, visitorEmail: visitors[0].email, visitorPhone: visitors[0].phone,
      visitor: visitors[0]._id, host: employee._id, purpose: 'meeting',
      date: now, time: '10:00', status: 'approved', preRegCompleted: true,
      approvedBy: admin._id, approvedAt: now,
    },
    {
      visitorName: visitors[1].name, visitorEmail: visitors[1].email,
      visitor: visitors[1]._id, host: employee._id, purpose: 'interview',
      date: now, time: '14:00', status: 'approved', preRegCompleted: true,
      approvedBy: admin._id, approvedAt: now,
    },
    {
      visitorName: visitors[2].name, visitorEmail: visitors[2].email,
      visitor: visitors[2]._id, host: employee._id, purpose: 'vendor',
      date: tomorrow, time: '11:00', status: 'pending',
    },
    {
      visitorName: visitors[3].name, visitorEmail: visitors[3].email,
      visitor: visitors[3]._id, host: employee._id, purpose: 'delivery',
      date: tomorrow, time: '15:00', status: 'pending',
    },
  ]);
  console.log('✅ Appointments created');

  // ── Passes ────────────────────────────────────────────
  const validFrom = new Date();
  const validUntil = new Date();
  validUntil.setHours(validUntil.getHours() + 8);

  const pass1 = await Pass.create({
    visitor: visitors[0]._id, host: employee._id,
    appointment: appointments[0]._id,
    purpose: 'Meeting', validFrom, validUntil,
    status: 'checked-in', issuedBy: security._id,
    floor: '4th Floor', room: 'Conference Room B',
    checkedInAt: new Date(),
  });
  pass1.qrCode = await generateQR(`VPMS:${pass1.passCode}`);
  await pass1.save();

  const pass2 = await Pass.create({
    visitor: visitors[1]._id, host: employee._id,
    appointment: appointments[1]._id,
    purpose: 'Interview', validFrom, validUntil,
    status: 'active', issuedBy: security._id,
    floor: '2nd Floor', room: 'HR Room',
  });
  pass2.qrCode = await generateQR(`VPMS:${pass2.passCode}`);
  await pass2.save();

  console.log('✅ Passes created with QR codes');

  // ── Check Logs ────────────────────────────────────────
  await CheckLog.create([
    {
      pass: pass1._id, visitor: visitors[0]._id,
      action: 'check-in', performedBy: security._id,
      location: 'Main Gate', timestamp: new Date(),
    },
  ]);
  console.log('✅ Check logs created');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Demo Login Accounts (password: 123456)');
  console.log('  Admin:    sourav@admin.com');
  console.log('  Security: security@demo.com');
  console.log('  Employee: employee@demo.com');
  console.log('  Visitor:  visitor@demo.com');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
