require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

const User = require('./models/User');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database (Users only)...');

  // Delete existing users only
  await User.deleteMany();
  console.log('🗑️  Cleared existing users');

  // Hash password
  const hashed = await bcrypt.hash('123456', 12);

  // Insert users
  await User.collection.insertMany([
    {
      name: 'Admin User',
      email: 'sourav@admin.com',
      password: hashed,
      role: 'admin',
      phone: '+91 98000 00001',
      department: 'Administration',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Security Guard',
      email: 'security@demo.com',
      password: hashed,
      role: 'security',
      phone: '+91 98000 00002',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Priya Singh',
      email: 'employee@demo.com',
      password: hashed,
      role: 'employee',
      phone: '+91 98000 00003',
      department: 'Engineering',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Rahul Sharma',
      email: 'visitor@demo.com',
      password: hashed,
      role: 'visitor',
      phone: '+91 98000 00004',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  console.log('✅ Users created successfully');
  console.log('\n🎉 Database seeded (Users only)!\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Login Accounts (password: 123456)');
  console.log('Admin:    sourav@admin.com');
  console.log('Security: security@demo.com');
  console.log('Employee: employee@demo.com');
  console.log('Visitor:  visitor@demo.com');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});