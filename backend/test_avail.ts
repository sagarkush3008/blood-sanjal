import { DonorService } from './src/modules/donors/donor.service';
import { connectDB } from './src/config/db.config';
import mongoose from 'mongoose';

async function test() {
  await connectDB();
  
  const { User } = await import('./src/modules/users/user.model');
  const user = await User.findOne({ role: 'USER' });
  if (!user) {
    console.log('No user found');
    process.exit(0);
  }

  console.log('Testing updateAvailability for user:', user._id);
  
  try {
    const res = await DonorService.updateAvailability(user._id.toString(), {
      status: 'INACTIVE',
      durationHours: 2,
      reason: 'test'
    });
    console.log('Success:', res.donorStatus, res.inactiveUntil);
  } catch (err) {
    console.error('Error:', err);
  }
  
  await mongoose.connection.close();
}

test();
