const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminName = process.env.ADMIN_NAME || 'College Admin';
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@college.edu').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log(`[Seed] Checking for existing admin account with email: ${adminEmail}`);
    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      console.log(`[Seed] Admin user already exists (userId: ${adminUser.userId}). Updating credentials...`);
      adminUser.name = adminName;
      adminUser.password = adminPassword; // Will be hashed by pre-save hook
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('[Seed] Admin user updated successfully.');
    } else {
      console.log('[Seed] Creating new Admin user...');
      adminUser = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      await adminUser.save();
      console.log(`[Seed] Admin user created successfully with userId: ${adminUser.userId}`);
    }

    console.log('--------------------------------------------------');
    console.log('Admin Account Details:');
    console.log(`Name:     ${adminUser.name}`);
    console.log(`Email:    ${adminUser.email}`);
    console.log(`Role:     ${adminUser.role}`);
    console.log(`Password: [Secured from ADMIN_PASSWORD env variable]`);
    console.log('--------------------------------------------------');

    await mongoose.connection.close();
    console.log('[Seed] Database connection closed. Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] Failed to seed admin: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedAdmin();
