import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/servicehive';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    const passwordHash = await bcrypt.hash('password123', 12);

    const demoCustomer = await User.create({
      name: 'Demo Customer',
      email: 'demo@servicehive.com',
      passwordHash,
      role: 'customer',
      bio: 'A demo customer account for testing ServiceHive.',
      location: 'San Francisco, CA',
      phone: '+1 (555) 123-4567',
    });

    const demoProvider = await User.create({
      name: 'Demo Provider',
      email: 'provider@servicehive.com',
      passwordHash,
      role: 'provider',
      bio: 'Professional service provider with 5+ years of experience.',
      location: 'San Francisco, CA',
      phone: '+1 (555) 987-6543',
    });

    console.log('Seeded demo users:');
    console.log(`  Customer: ${demoCustomer.email} / password123`);
    console.log(`  Provider: ${demoProvider.email} / password123`);

    await mongoose.disconnect();
    console.log('Done. Database disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
