import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import ClassModel from './models/Class.js';

dotenv.config();

const connectionString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/university-dao';

const runSeed = async () => {
  await mongoose.connect(connectionString);
  console.log('Connected to MongoDB for seeding');

  const csClass = await ClassModel.findOneAndUpdate(
    { slug: 'cs101' },
    {
      name: 'Computer Science 101',
      description: 'Student union class for CS 101 and nearby study groups.',
      isPublic: false
    },
    { upsert: true, new: true }
  );

  const adminEmail = 'admin@university.edu';
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync('Admin123!', 10);
    await User.create({
      name: 'Campus Admin',
      email: adminEmail,
      passwordHash,
      role: 'admin',
      classId: csClass._id
    });
    console.log('Created default admin user:', adminEmail);
  } else {
    console.log('Admin user already exists:', adminEmail);
  }

  mongoose.connection.close();
  console.log('Seed complete');
};

runSeed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
