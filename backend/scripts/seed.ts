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
    console.log("Connected.");

    if (isReset) {
      console.log("Reset flag detected. Dropping database...");
      await mongoose.connection.db?.dropDatabase();
      console.log("Database dropped.");
    }

    // 1. Locations
    console.log("Seeding locations...");
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
    console.log("Seeding users and donors...");
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const usersData = [];
    
    // Add 1 Admin
    usersData.push({
      email: 'admin@bloodsanjal.local',
      phone: '9800000000',
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true
    });

    // Add 30 fictional users
    for (let i = 1; i <= 30; i++) {
      const city = sample(cities);
      usersData.push({
        email: `user${i}@fictional.local`,
        phone: randomPhone(),
        password: hashedPassword,
        name: `${sample(firstNames)} ${sample(lastNames)}`,
        role: 'USER',
        status: 'ACTIVE',
        isVerified: true,
        provinceId: city.parent,
        cityId: city._id,
        locationCoordinates: city.coordinates
      });
    }

    const createdUsers = await User.insertMany(usersData);
    
    // 20 of them will be donors
    const donorUsers = createdUsers.filter(u => u.role === 'USER').slice(0, 20);
    const donorProfilesData = donorUsers.map((user) => ({
      userId: user._id,
      bloodGroup: sample(bloodGroups),
      donorStatus: 'ACTIVE',
      isVerified: true,
      lastDonationDate: Math.random() > 0.5 ? randomDate(new Date(Date.now() - 31536000000), new Date(Date.now() - 8640000000)) : null,
      totalDonations: Math.floor(Math.random() * 10),
      verificationDocumentUrl: 'cloudinary://mock/document.pdf',
      settings: {
        contactRequestEnabled: true,
        autoAcceptEmergencies: false
      }
    }));
    await DonorProfile.insertMany(donorProfilesData);

    // 3. Campaigns
    console.log("Seeding campaigns...");
    const adminUser = createdUsers[0];
    const campaignsData = Array.from({ length: 5 }).map((_, i) => {
      const city = sample(cities);
      return {
        title: `Fictional Blood Drive ${i + 1}`,
        description: `Join us for the fictional blood drive event ${i + 1} to save lives.`,
        organizer: `Fictional NGO ${i + 1}`,
        date: randomDate(new Date(), new Date(Date.now() + 2592000000)),
        startTime: '10:00 AM',
        endTime: '04:00 PM',
        location: `Fictional Center, ${city.name}`,
        bloodGroupsNeeded: ['A+', 'O+', 'AB+'],
        status: 'PUBLISHED',
        createdBy: adminUser._id
      };
    });
    const createdCampaigns = await Campaign.insertMany(campaignsData);

    // 4. Blood Requests
    console.log("Seeding blood requests...");
    const regularUsers = createdUsers.filter(u => u.role === 'USER').slice(20, 30);
    const requestsData = Array.from({ length: 10 }).map((_, i) => {
      const city = sample(cities);
      return {
        requesterId: sample(regularUsers)._id,
        bloodGroup: sample(bloodGroups),
        unitsRequired: Math.floor(Math.random() * 5) + 1,
        unitsFulfilled: 0,
        hospitalName: `Fictional Hospital ${i + 1}`,
        hospitalLocation: {
          address: 'Main Road',
          cityId: city._id.toString(),
          coordinates: city.coordinates.coordinates
        },
        contactPerson: {
          name: sample(firstNames),
          phone: randomPhone()
        },
        requiredDate: randomDate(new Date(), new Date(Date.now() + 604800000)),
        urgency: Math.random() > 0.7 ? 'EMERGENCY' : 'NORMAL',
        status: 'ACTIVE'
      };
    });
    const createdRequests = await BloodRequest.insertMany(requestsData);

    // 5. Payments, Donations, Certificates, Notifications
    console.log("Seeding payments, donations, notifications...");
    
    // Payments (Search fees)
    await PaymentTransaction.insertMany(regularUsers.map(u => ({
      userId: u._id,
      amountMinor: 5000,
      currency: 'NPR',
      purpose: 'SEARCH_PLATFORM_FEE',
      status: 'SUCCESS',
      gatewayTxId: `MOCK_TX_${Date.now()}_${u._id}`
    })));

    // Donations
    // We need created donor profiles to get their _ids
    const createdDonorProfiles = await DonorProfile.find();

    // Donations
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
        verifiedBy: createdUsers[0]._id // Admin
      });
      donationsData.push(donation);

      certificatesData.push({
        donorProfileId: profile._id,
        certificateType: 'MILESTONE',
        certificateNumber: `CERT-${profile._id.toString().substring(0, 5).toUpperCase()}-${i}`,
        verificationCode: `VC-${Math.floor(Math.random() * 1000000)}`,
        issueDate: new Date(),
        status: 'ISSUED'
      });
    }
    await DonationRecord.insertMany(donationsData);
    await Certificate.insertMany(certificatesData);

    // Notifications
    await Notification.insertMany(donorUsers.map(u => ({
      userId: u._id,
      title: 'Welcome to Blood Sanjal',
      message: 'Thank you for registering as a fictional donor in our demo environment.',
      type: 'SYSTEM',
      isRead: false,
      dedupeKey: `WELCOME_NOTIF_${u._id}`
    })));

    console.log("Seeding completed successfully!");
    process.exit(0);

  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

runSeed();
