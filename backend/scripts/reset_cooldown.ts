import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { env } from '../src/config/env.config';
import { User } from '../src/modules/users/user.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { DonationRecord } from '../src/modules/donors/donationRecord.model';

async function resetCooldowns() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const res = await DonorProfile.updateMany(
      {},
      {
        $unset: {
          lastDonationDate: 1,
          next_eligible_date: 1,
          reminderDate: 1,
        },
        $set: {
          totalDonations: 0,
        },
      }
    );
    console.log(`Reset ${res.modifiedCount} donor profiles.`);

    await User.updateMany({}, { $set: { totalDonations: 0 } });
    console.log('Reset totalDonations to 0 across all users.');

    const deletedRecords = await DonationRecord.deleteMany({});
    console.log(`Deleted ${deletedRecords.deletedCount} donation records so you can test form submission again.`);

    console.log('✅ Cooldown cleared completely!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to reset cooldowns:', error);
    process.exit(1);
  }
}

resetCooldowns();
