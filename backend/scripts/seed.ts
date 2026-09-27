import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env before importing config
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { env } from '../src/config/env.config';
import { User } from '../src/modules/users/user.model';
import { DonorProfile } from '../src/modules/donors/donorProfile.model';
import { Location } from '../src/modules/locations/location.model';
import { BloodRequest } from '../src/modules/requests/bloodRequest.model';
import { Campaign } from '../src/modules/campaigns/campaign.model';
import { PaymentTransaction } from '../src/modules/payments/payment.model';
import { Notification } from '../src/modules/notifications/notification.model';
import { DonationRecord } from '../src/modules/donors/donationRecord.model';
import { Certificate } from '../src/modules/certificates/certificate.model';
import { SystemConfig } from '../src/modules/admin/systemConfig.model';
import { AuditLog } from '../src/modules/audit/auditLog.model';

const isReset = process.argv.includes('--reset');

if (env.NODE_ENV === 'production') {
  console.error("FATAL: Cannot run seed script in production environment. Aborting.");
  process.exit(1);
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const firstNames = ['Aarav', 'Bina', 'Chirag', 'Deepa', 'Eshaan', 'Gita', 'Hari', 'Indu', 'Jeevan', 'Kamala', 'Laxmi', 'Manish', 'Nita', 'Om', 'Pooja', 'Rajan', 'Sita', 'Tara', 'Umesh', 'Vandana'];
const lastNames = ['Sharma', 'Thapa', 'KC', 'Shrestha', 'Adhikari', 'Maharjan', 'Lama', 'Yadav', 'Rai', 'Gurung'];

const sample = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomPhone = () => `98${Math.floor(10000000 + Math.random() * 90000000)}`;
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function runSeed() {
  try {
    console.log(`Connecting to database at ${env.MONGODB_URI}...`);
    await mongoose.connect(env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    if (isReset) {
      console.log("Reset flag detected. Dropping database collections...");
      await mongoose.connection.db?.dropDatabase();
      console.log("Database reset complete.");
    } else {
      console.log("Cleaning demo seed collections for idempotent seed...");
      await Promise.all([
        Location.deleteMany({}),
        User.deleteMany({ $or: [{ email: /@fictional\.local$/ }, { role: 'ADMIN' }] }),
        DonorProfile.deleteMany({}),
        BloodRequest.deleteMany({}),
        Campaign.deleteMany({}),
        PaymentTransaction.deleteMany({}),
        Notification.deleteMany({}),
        DonationRecord.deleteMany({}),
        Certificate.deleteMany({})
      ]);
    }

    // 0. Seed System Configurations
    console.log("Seeding platform system configuration...");
    const systemConfigs = [
      {
        key: 'reminderPolicy',
        value: { donationIntervalDays: 90, maxRemindersPerMonth: 3 }
      },
      {
        key: 'platformFee',
        value: { amountMinor: 5000, currency: 'NPR' }
      },
      {
        key: 'notificationDefaults',
        value: { emailEnabled: true, smsEnabled: true, pushEnabled: true }
      },
      {
        key: 'supportedBloodGroups',
        value: bloodGroups
      },
      {
        key: 'requestExpiryHours',
        value: 72
      },
      {
        key: 'contactRequestExpiryHours',
        value: 48
      },
      {
        key: 'systemToggles',
        value: { maintenanceMode: false, allowNewRegistrations: true }
      }
    ];

    for (const conf of systemConfigs) {
      await SystemConfig.findOneAndUpdate(
        { key: conf.key },
        { value: conf.value },
        { upsert: true, new: true }
      );
    }

    // 1. Locations
    console.log("Seeding geographic locations...");
    const pBagmati = await Location.create({ name: 'Bagmati', code: 'PROV-BAG', type: 'PROVINCE', coordinates: { type: 'Point', coordinates: [85.3, 27.7] }});
    const pGandaki = await Location.create({ name: 'Gandaki', code: 'PROV-GAN', type: 'PROVINCE', coordinates: { type: 'Point', coordinates: [83.9, 28.2] }});
    const pKoshi = await Location.create({ name: 'Koshi', code: 'PROV-KOS', type: 'PROVINCE', coordinates: { type: 'Point', coordinates: [87.2, 26.4] }});

    const dKtm = await Location.create({ name: 'Kathmandu', code: 'DIST-KTM', type: 'DISTRICT', parentId: pBagmati._id, coordinates: { type: 'Point', coordinates: [85.32, 27.71] }});
    const dLtp = await Location.create({ name: 'Lalitpur', code: 'DIST-LTP', type: 'DISTRICT', parentId: pBagmati._id, coordinates: { type: 'Point', coordinates: [85.31, 27.67] }});
    const dKaski = await Location.create({ name: 'Kaski', code: 'DIST-KAS', type: 'DISTRICT', parentId: pGandaki._id, coordinates: { type: 'Point', coordinates: [83.98, 28.20] }});
    const dMorang = await Location.create({ name: 'Morang', code: 'DIST-MOR', type: 'DISTRICT', parentId: pKoshi._id, coordinates: { type: 'Point', coordinates: [87.27, 26.45] }});

    const cKtm = await Location.create({ name: 'Kathmandu Metro', code: 'MUN-KTM', type: 'MUNICIPALITY', parentId: dKtm._id, coordinates: { type: 'Point', coordinates: [85.32, 27.71] }});
    const cLtp = await Location.create({ name: 'Lalitpur Metro', code: 'MUN-LTP', type: 'MUNICIPALITY', parentId: dLtp._id, coordinates: { type: 'Point', coordinates: [85.31, 27.67] }});
    const cPkr = await Location.create({ name: 'Pokhara Metro', code: 'MUN-PKR', type: 'MUNICIPALITY', parentId: dKaski._id, coordinates: { type: 'Point', coordinates: [83.98, 28.20] }});
    const cBrt = await Location.create({ name: 'Biratnagar Metro', code: 'MUN-BRT', type: 'MUNICIPALITY', parentId: dMorang._id, coordinates: { type: 'Point', coordinates: [87.27, 26.45] }});

    const cities = [cKtm, cLtp, cPkr, cBrt];

    // 2. Users & Donors
    console.log("Seeding administrators, fictional donors, and recipients...");
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const usersData = [];
    
    // Seed standard Admin (Only one admin as requested)
    usersData.push({
      email: 'admin@bloodsanjal.org',
      phone: '9800000000',
      passwordHash: hashedPassword,
      name: 'Blood Sanjal Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date()
    });

    // Add 30 fictional users
    for (let i = 1; i <= 30; i++) {
      const city = sample(cities);
      usersData.push({
        email: `user${i}@fictional.local`,
        phone: randomPhone(),
        passwordHash: hashedPassword,
        name: `${sample(firstNames)} ${sample(lastNames)}`,
        role: 'USER',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        provinceId: city.parent,
        cityId: city._id,
        locationCoordinates: city.coordinates
      });
    }

    const createdUsers = await User.insertMany(usersData);
    
    // 20 of them will be active donors distributed across all 8 blood groups
    const donorUsers = createdUsers.filter(u => u.role === 'USER').slice(0, 24);
    const donorProfilesData = donorUsers.map((user, idx) => ({
      userId: user._id,
      bloodGroup: bloodGroups[idx % bloodGroups.length],
      donorStatus: 'ACTIVE',
      isVerified: true,
      lastDonationDate: Math.random() > 0.4 ? randomDate(new Date(Date.now() - 31536000000), new Date(Date.now() - 8640000000)) : null,
      totalDonations: Math.floor(Math.random() * 8) + 1,
      verificationDocumentUrl: 'cloudinary://mock/document.pdf',
      settings: {
        contactRequestEnabled: true,
        autoAcceptEmergencies: false
      }
    }));
    await DonorProfile.insertMany(donorProfilesData);

    // 3. Campaigns
    console.log("Seeding community blood drives...");
    const adminUser = createdUsers[0];
    const campaignsData = Array.from({ length: 5 }).map((_, i) => {
      const city = sample(cities);
      return {
        title: `Community Life Drive - Phase ${i + 1}`,
        description: `Join our community blood donation drive in ${city.name}. Help save lives and build national blood emergency resilience.`,
        organizer: `Red Cross Nepal & Blood Sanjal chapter ${i + 1}`,
        date: randomDate(new Date(), new Date(Date.now() + 2592000000)),
        startTime: '09:00 AM',
        endTime: '04:00 PM',
        location: `Health Center Auditorium, ${city.name}`,
        bloodGroupsNeeded: ['A+', 'O+', 'B+', 'AB+'],
        status: 'PUBLISHED',
        createdBy: adminUser._id
      };
    });
    await Campaign.insertMany(campaignsData);

    // 4. Blood Requests (Normal & Emergency)
    console.log("Seeding clinical and emergency blood requests...");
    const regularUsers = createdUsers.filter(u => u.role === 'USER').slice(24);
    const requestsData = Array.from({ length: 10 }).map((_, i) => {
      const city = sample(cities);
      const isEmergency = i < 3;
      return {
        requesterId: sample(regularUsers || createdUsers.slice(2, 6))._id,
        bloodGroup: sample(bloodGroups),
        unitsRequired: Math.floor(Math.random() * 4) + 1,
        unitsFulfilled: 0,
        hospitalName: isEmergency ? 'Tribhuvan University Teaching Hospital (TUTH)' : `City Hospital ${i + 1}`,
        hospitalLocation: {
          address: 'Main Hospital Road',
          cityId: city._id.toString(),
          coordinates: city.coordinates.coordinates
        },
        contactPerson: {
          name: sample(firstNames),
          phone: randomPhone()
        },
        requiredDate: randomDate(new Date(), new Date(Date.now() + 604800000)),
        urgency: isEmergency ? 'EMERGENCY' : 'NORMAL',
        status: isEmergency ? 'PENDING_VERIFICATION' : 'ACTIVE'
      };
    });
    const createdRequests = await BloodRequest.insertMany(requestsData);

    // 5. Payments, Donations, Certificates, Notifications
    console.log("Seeding transactions, verified donations, and digital certificates...");
    
    // Payments (Search fees)
    await PaymentTransaction.insertMany(createdUsers.slice(2, 12).map(u => ({
      userId: u._id,
      amountMinor: 5000,
      currency: 'NPR',
      purpose: 'SEARCH_PLATFORM_FEE',
      status: 'SUCCESS',
      gatewayTxId: `TXN_${Date.now()}_${u._id.toString().slice(-4)}`
    })));

    const createdDonorProfiles = await DonorProfile.find();

    const donationsData = [];
    const certificatesData = [];
    for (let i = 0; i < 15; i++) {
      const profile = sample(createdDonorProfiles);
      const req = sample(createdRequests);
      
      const donation = new DonationRecord({
        donorProfileId: profile._id,
        donationDate: new Date(Date.now() - 86400000 * (i + 1)),
        hospitalName: req.hospitalName,
        verificationStatus: 'VERIFIED',
        verifiedBy: adminUser._id
      });
      donationsData.push(donation);

      certificatesData.push({
        donorProfileId: profile._id,
        certificateType: 'MILESTONE',
        certificateNumber: `CERT-${profile._id.toString().substring(0, 5).toUpperCase()}-${i + 1}`,
        verificationCode: `VC-${Math.floor(100000 + Math.random() * 900000)}`,
        issueDate: new Date(),
        status: 'ISSUED'
      });
    }
    await DonationRecord.insertMany(donationsData);
    await Certificate.insertMany(certificatesData);

    // Notifications
    await Notification.insertMany(donorUsers.map(u => ({
      userId: u._id,
      title: 'Welcome to Blood Sanjal 🩸',
      message: 'Thank you for registering as a volunteer blood donor. Your profile is active and ready to save lives.',
      type: 'SYSTEM',
      isRead: false,
      dedupeKey: `WELCOME_NOTIF_${u._id}`
    })));

    // Seed initial audit log
    await AuditLog.create({
      actorId: adminUser._id,
      action: 'SYSTEM_DATABASE_SEEDED',
      entityType: 'SYSTEM',
      entityId: 'GLOBAL'
    });

    console.log("==================================================");
    console.log("✅ Seed completed successfully!");
    console.log("   - System Config: Initialized");
    console.log("   - Admin Account: admin@bloodsanjal.org (Password123!)");
    console.log(`   - Locations: 3 Provinces, 4 Districts, 4 Municipalities`);
    console.log(`   - Users: ${createdUsers.length} total (${donorProfilesData.length} donors across 8 blood groups)`);
    console.log(`   - Blood Drives: ${campaignsData.length} published`);
    console.log(`   - Requests: ${requestsData.length} (including verified emergency requests)`);
    console.log(`   - Donations & Certificates: 15 verified donations and issued certificates`);
    console.log("==================================================");
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeed();
