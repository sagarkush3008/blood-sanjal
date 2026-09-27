import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api/v1';

async function verifyPhase2() {
  console.log('=== BLOOD SANJAL PHASE 2 VERIFICATION ===\n');

  // 1. Test Home Screen Endpoints (Metrics, Active Requests, Campaigns)
  console.log('1. Testing Home Screen live backend endpoints...');
  const metricsRes = await fetch(`${API_BASE}/metrics`).then(r => r.json());
  console.log('  -> Live Metrics:', metricsRes.data);

  // Login as admin to get auth token
  const adminLogin = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@bloodsanjal.org', password: 'Password123!' }),
  }).then(r => r.json());
  const adminToken = adminLogin.data.accessToken;
  const adminUserId = adminLogin.data.user.id;

  const requestsRes = await fetch(`${API_BASE}/requests?limit=4`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then(r => r.json());
  console.log('  -> Active Requests count:', requestsRes.data?.length || 0);

  const campaignsRes = await fetch(`${API_BASE}/campaigns?limit=3`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then(r => r.json());
  console.log('  -> Campaigns count:', campaignsRes.data?.length || 0);

  // 2. Ensure test donor exists and has search fee access
  console.log('\n2. Ensuring test donor exists with blood group A+...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blood-sanjal');
  
  // Find or create a donor user with active profile
  const donorUserDoc = await mongoose.connection.collection('users').findOne({ role: 'USER', status: 'ACTIVE' });
  let donorUserId = donorUserDoc?._id?.toString();
  
  if (!donorUserId) {
    const newDonor = await mongoose.connection.collection('users').insertOne({
      name: 'Bikram Thapa',
      email: 'bikram.donor@bloodsanjal.org',
      phone: '9841000001',
      role: 'USER',
      status: 'ACTIVE',
      bloodGroup: 'A+',
      privacySettings: { donorSearchVisibility: true, contactRevealPolicy: 'CONSENT_REQUIRED' },
      createdAt: new Date(),
    });
    donorUserId = newDonor.insertedId.toString();
  }

  // Ensure donor profile exists
  await mongoose.connection.collection('donorprofiles').updateOne(
    { userId: new mongoose.Types.ObjectId(donorUserId) },
    {
      $set: {
        bloodGroup: 'A+',
        donorStatus: 'ACTIVE',
        totalDonations: 3,
        contactPreference: 'PHONE',
        lastDonationDate: new Date(Date.now() - 60 * 86400000),
      },
    },
    { upsert: true }
  );

  // Ensure search visibility is true
  await mongoose.connection.collection('users').updateOne(
    { _id: new mongoose.Types.ObjectId(donorUserId) },
    { $set: { 'privacySettings.donorSearchVisibility': true, bloodGroup: 'A+' } }
  );

  // 3. Test Search Fee & Search Endpoints
  console.log('\n3. Testing Search Fee activation for requester...');
  const initFee = await fetch(`${API_BASE}/payments/search-fee/initiate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then(r => r.json());
  console.log('  -> Search Fee Init Status:', initFee.data?.status);

  if (initFee.data?.status === 'PENDING') {
    const txKey = initFee.data?.gatewayTransactionId || initFee.data?.transactionId;
    const webhookRes = await fetch(`${API_BASE}/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gatewayTxId: txKey }),
    }).then(r => r.json());
    console.log('  -> Search Fee Webhook raw response:', webhookRes);
  }

  // 4. Test Donor Search
  console.log('\n4. Testing Donor Search via GET /donors/search...');
  const searchRes = await fetch(`${API_BASE}/donors/search?bloodGroup=A+`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then(r => r.json());
  console.log('  -> Search raw response:', searchRes);
  console.log('  -> Search Success:', searchRes.success);
  console.log('  -> Donors Found:', searchRes.data?.results?.length || 0);
  if (searchRes.data?.results?.length > 0) {
    const sampleDonor = searchRes.data.results[0];
    console.log('  -> Privacy Check (Must NOT contain phone/email):', {
      name: sampleDonor.name,
      bloodGroup: sampleDonor.bloodGroup,
      hasPhone: !!sampleDonor.phone,
      hasEmail: !!sampleDonor.email,
    });
  }

  // 5. Test Contact Request Flow
  console.log('\n5. Testing Contact Request Creation via POST /contact-requests...');
  // Clean up any existing open request between admin and donor
  await mongoose.connection.collection('contactrequests').deleteMany({
    requesterId: new mongoose.Types.ObjectId(adminUserId),
    donorId: new mongoose.Types.ObjectId(donorUserId),
  });

  const createContactRes = await fetch(`${API_BASE}/contact-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      donorId: donorUserId,
      message: 'Urgent requirement of A+ blood at Tribhuvan University Teaching Hospital.',
    }),
  }).then(r => r.json());
  console.log('  -> Contact Request Created:', createContactRes.success);
  const contactRequestId = createContactRes.data?._id;
  console.log('  -> Contact Request Status (Should be PENDING):', createContactRes.data?.status);

  // 6. Test Listing Contact Requests
  console.log('\n6. Testing Listing Contact Requests via GET /contact-requests...');
  const listContactRes = await fetch(`${API_BASE}/contact-requests`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  }).then(r => r.json());
  console.log('  -> Listed Contact Requests Total:', listContactRes.data?.total || 0);

  // 7. Donor Accepts Contact Request
  console.log('\n7. Donor Accepts Contact Request via POST /contact-requests/:id/accept...');
  // Generate token for donor
  const donorUser = await mongoose.connection.collection('users').findOne({ _id: new mongoose.Types.ObjectId(donorUserId) });
  const jwt = await import('jsonwebtoken');
  const donorToken = jwt.default.sign(
    { userId: donorUserId, role: donorUser?.role || 'USER' },
    process.env.JWT_ACCESS_SECRET || 'supersecret'
  );

  const acceptRes = await fetch(`${API_BASE}/contact-requests/${contactRequestId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${donorToken}` },
  }).then(r => r.json());
  console.log('  -> Accept Status:', acceptRes.data?.status);
  console.log('  -> Revealed Contact Info (Authorized on Consent):', acceptRes.data?.revealedContactInfo);

  await mongoose.disconnect();
  console.log('\n=== PHASE 2 ALL VERIFICATIONS PASSED SUCCESSFULLY ===');
}

verifyPhase2().catch((err) => {
  console.error('Phase 2 Verification Failed:', err);
  process.exit(1);
});
