import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { env } from '../src/config/env.config';
import { User } from '../src/modules/users/user.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { BloodRequest } from '../src/modules/requests/bloodRequest.model';
import { Campaign } from '../src/modules/campaigns/campaign.model';
import { PaymentTransaction } from '../src/modules/payments/payment.model';
import { Notification } from '../src/modules/notifications/notification.model';
import { DonationRecord } from '../src/modules/donors/donationRecord.model';
import { Certificate } from '../src/modules/certificates/certificate.model';
import { AuditLog } from '../src/modules/audit/auditLog.model';

async function clearData() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    console.log("Clearing all user data to exactly 0...");
    await Promise.all([
      User.deleteMany({ role: { $ne: 'ADMIN' }, email: { $ne: 'admin@bloodsanjal.org' } }),
      DonorProfile.deleteMany({}),
      BloodRequest.deleteMany({}),
      Campaign.deleteMany({}),
      PaymentTransaction.deleteMany({}),
      Notification.deleteMany({}),
      DonationRecord.deleteMany({}),
      Certificate.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log("✅ All dummy users, donors, requests, campaigns, etc., deleted!");
    console.log("Admin account remains intact.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
clearData();
