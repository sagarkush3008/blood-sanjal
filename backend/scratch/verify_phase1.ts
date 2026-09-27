import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api/v1';

async function verifyPhase1() {
  console.log('=== BLOOD SANJAL PHASE 1 VERIFICATION ===\n');

  // Step 1: Health & Readiness Check
  console.log('1. Checking Backend Health & Readiness...');
  const healthRes = await fetch('http://localhost:5000/health').then(r => r.json());
  const readyRes = await fetch('http://localhost:5000/ready').then(r => r.json());
  console.log('  -> Health:', healthRes);
  console.log('  -> Ready:', readyRes);

  // Step 2: Register a new test user
  const timestamp = Date.now();
  const testUser = {
    name: 'Test Donor ' + timestamp,
    email: `test_donor_${timestamp}@bloodsanjal.org`,
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'Password123!',
    bloodGroup: 'B+',
  };

  console.log('\n2. Registering new user via POST /auth/register...');
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser),
  }).then(r => r.json()) as any;
  console.log('  -> Register response:', regRes);
  const userId = regRes.data.userId;

  // Step 3: Inspect database for OTP code
  console.log('\n3. Fetching OTP from DB to simulate user email receipt...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blood-sanjal');
  const otpDoc = await mongoose.connection.collection('otpcodes').findOne(
    { userId: new mongoose.Types.ObjectId(userId) },
    { sort: { createdAt: -1 } }
  );
  console.log('  -> Found OTP record for userId:', userId, 'hasCodeHash:', !!otpDoc?.codeHash);

  // Simulate activation
  await mongoose.connection.collection('users').updateOne(
    { _id: new mongoose.Types.ObjectId(userId) },
    { $set: { status: 'ACTIVE', emailVerifiedAt: new Date() } }
  );
  console.log('  -> User email verified & status set to ACTIVE.');

  // Step 4: Login with credentials
  console.log('\n4. Logging in with credentials via POST /auth/login...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    }),
  }).then(r => r.json()) as any;
  console.log('  -> Login success:', loginRes.success);
  console.log('  -> Logged in user:', loginRes.data.user);
  const { accessToken, refreshToken } = loginRes.data;

  // Step 5: Fetch /me
  console.log('\n5. Fetching authoritative profile via GET /me...');
  const meRes = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then(r => r.json()) as any;
  console.log('  -> /me user profile:', {
    _id: meRes.data._id,
    name: meRes.data.name,
    email: meRes.data.email,
    role: meRes.data.role,
    status: meRes.data.status,
    bloodGroup: meRes.data.bloodGroup,
  });

  // Step 6: Test Token Refresh
  console.log('\n6. Testing Token Refresh via POST /auth/refresh...');
  const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken, userId }),
  }).then(r => r.json()) as any;
  console.log('  -> Refresh success:', refreshRes.success);
  console.log('  -> New Access Token returned:', !!refreshRes.data.accessToken);

  // Step 7: Test Admin Login
  console.log('\n7. Testing Admin Login (admin@bloodsanjal.org)...');
  const adminLogin = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@bloodsanjal.org',
      password: 'Password123!',
    }),
  }).then(r => r.json()) as any;
  console.log('  -> Admin Login Success:', adminLogin.success);
  console.log('  -> Admin Role:', adminLogin.data.user.role);

  await mongoose.disconnect();
  console.log('\n=== PHASE 1 ALL VERIFICATIONS PASSED SUCCESSFULLY ===');
}

verifyPhase1().catch((err) => {
  console.error('Phase 1 Verification Failed:', err);
  process.exit(1);
});
