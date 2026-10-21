import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { env } from '../src/config/env.config';
import { User } from '../src/modules/users/user.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { DonationRecord } from '../src/modules/donors/donationRecord.model';
import { Certificate } from '../src/modules/certificates/certificate.model';

/**
 * RESET TEST DONORS SCRIPT
 * Safely resets total_donations = 0, clears medical cooldowns,
 * and deletes all donation records strictly for 'Donar 1' and 'Donar 2'
 * (matching 'Bikram Thapa (Donor 1)', 'Sita Sharma (Donor 2)', 'donor@bloodsanjal.org', 'donor2@bloodsanjal.org').
 */
async function resetTestDonors() {
  console.log("==================================================");
  console.log("🩸 RESETTING TEST DONORS: Donar 1 & Donar 2");
  console.log("==================================================");

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("✓ Connected to MongoDB.");

    // Match specifically Donar 1 / Donor 1 and Donar 2 / Donor 2
    const targetUsers = await User.find({
      $or: [
        { name: { $regex: /donor\s*1|donar\s*1/i } },
        { name: { $regex: /donor\s*2|donar\s*2/i } },
        { email: { $in: ['donor@bloodsanjal.org', 'donor2@bloodsanjal.org'] } },
        { phone: { $in: ['9811111111', '9811111112'] } }
      ]
    });

    if (targetUsers.length === 0) {
      console.warn("⚠️ No matching test donors found in database.");
      await mongoose.disconnect();
      return;
    }

    const userIds = targetUsers.map(u => u._id);
    console.log(`Found ${targetUsers.length} matching test users:`);
    targetUsers.forEach(u => console.log(`  - [${u._id}] ${u.name} (${u.email})`));

    // Find donor profiles for these users
    const profiles = await DonorProfile.find({ userId: { $in: userIds } });
    const profileIds = profiles.map(p => p._id);

    console.log(`\nFound ${profiles.length} associated donor profile(s).`);

    // 1. Delete all donation records for these profiles
    const deletedDonations = await DonationRecord.deleteMany({
      donorProfileId: { $in: profileIds }
    });
    console.log(`✓ Deleted ${deletedDonations.deletedCount} donation records.`);

    // 2. Delete any generated certificates for these profiles
    const deletedCerts = await Certificate.deleteMany({
      donorProfileId: { $in: profileIds }
    });
    console.log(`✓ Deleted ${deletedCerts.deletedCount} certificates.`);

    // 3. Reset totalDonations to 0 and clear medical cooldown timestamps
    const updateResult = await DonorProfile.updateMany(
      { _id: { $in: profileIds } },
      {
        $set: {
          totalDonations: 0,
          lastDonationDate: null,
          next_eligible_date: null,
          reminderDate: null,
          lastRecoveryTips: []
        }
      }
    );
    console.log(`✓ Reset totalDonations = 0 across ${updateResult.modifiedCount} donor profiles.`);

    console.log("\n✅ Test donor history cleanly reset to zero.");
    console.log("==================================================");

    await mongoose.disconnect();
  } catch (error: any) {
    console.error("❌ Reset failed:", error.message || error);
    process.exit(1);
  }
}

resetTestDonors();
