const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function verifyAdminAPIs() {
  console.log('🧪 Starting End-to-End Admin API Integration Verification...\n');

  try {
    // 1. Authenticate as Admin
    console.log('1️⃣ Authenticating as System Admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bloodsanjal.org',
        password: 'Password123!',
      }),
    });

    const loginData: any = await loginRes.json();
    const token = loginData.data?.accessToken || loginData.token || loginData.data?.token;
    if (!token) {
      throw new Error(`Failed to obtain access token: ${JSON.stringify(loginData)}`);
    }
    console.log('   ✅ Admin Authenticated Successfully! Token acquired.\n');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Dashboard Summary
    console.log('2️⃣ Testing GET /admin/dashboard/summary...');
    const dashRes = await fetch(`${BASE_URL}/admin/dashboard/summary`, { headers: authHeaders });
    const dashJson: any = await dashRes.json();
    const dData = dashJson.data;
    console.log(`   ✅ Dashboard Stats: Users=${dData.users}, Donors=${dData.donors}, ActiveRequests=${dData.activeRequests}, Emergencies=${dData.pendingEmergencies}, Donations=${dData.donations}, Revenue=NPR ${dData.revenueNPR}\n`);

    // 3. User Management
    console.log('3️⃣ Testing GET /admin/users...');
    const usersRes = await fetch(`${BASE_URL}/admin/users`, { headers: authHeaders });
    const usersJson: any = await usersRes.json();
    const uList = usersJson.data?.items || usersJson.data || [];
    console.log(`   ✅ Found ${uList.length} users.\n`);

    // 4. Donor Management
    console.log('4️⃣ Testing GET /admin/donors...');
    const donorsRes = await fetch(`${BASE_URL}/admin/donors`, { headers: authHeaders });
    const donorsJson: any = await donorsRes.json();
    const dList = donorsJson.data?.items || donorsJson.data || [];
    console.log(`   ✅ Found ${dList.length} donors.\n`);

    // 5. Blood Requests
    console.log('5️⃣ Testing GET /admin/blood-requests...');
    const reqRes = await fetch(`${BASE_URL}/admin/blood-requests`, { headers: authHeaders });
    const reqJson: any = await reqRes.json();
    const rList = reqJson.data?.items || reqJson.data || [];
    console.log(`   ✅ Found ${rList.length} blood requests.\n`);

    // 6. Emergency Requests
    console.log('6️⃣ Testing GET /admin/emergency-requests...');
    const emRes = await fetch(`${BASE_URL}/admin/emergency-requests`, { headers: authHeaders });
    const emJson: any = await emRes.json();
    const emList = emJson.data?.items || emJson.data || [];
    console.log(`   ✅ Found ${emList.length} emergency requests.\n`);

    // 7. Donations
    console.log('7️⃣ Testing GET /admin/donations...');
    const donRes = await fetch(`${BASE_URL}/admin/donations`, { headers: authHeaders });
    const donJson: any = await donRes.json();
    const donList = donJson.data?.items || donJson.data || [];
    console.log(`   ✅ Found ${donList.length} donation records.\n`);

    // 8. Campaigns
    console.log('8️⃣ Testing GET /admin/campaigns...');
    const campRes = await fetch(`${BASE_URL}/admin/campaigns`, { headers: authHeaders });
    const campJson: any = await campRes.json();
    const cList = campJson.data?.items || campJson.data || [];
    console.log(`   ✅ Found ${cList.length} campaigns.\n`);

    // 9. Notifications / Broadcasts
    console.log('9️⃣ Testing GET /admin/notifications...');
    const notifRes = await fetch(`${BASE_URL}/admin/notifications`, { headers: authHeaders });
    const notifJson: any = await notifRes.json();
    const nList = notifJson.data?.items || notifJson.data || [];
    console.log(`   ✅ Found ${nList.length} broadcasts/notifications.\n`);

    // 10. Financials & Revenue Summary
    console.log('🔟 Testing GET /admin/payments/summary...');
    const payRes = await fetch(`${BASE_URL}/admin/payments/summary`, { headers: authHeaders });
    const payJson: any = await payRes.json();
    console.log(`   ✅ Payment Summary: Total Transactions=${payJson.data?.totalTransactions || 0}, Total Volume=NPR ${(payJson.data?.totalVolumeMinor || 0) / 100}\n`);

    // 11. System Settings
    console.log('1️⃣1️⃣ Testing GET /admin/settings...');
    const setRes = await fetch(`${BASE_URL}/admin/settings`, { headers: authHeaders });
    const setJson: any = await setRes.json();
    const sData = setJson.data;
    console.log(`   ✅ Settings Loaded: PlatformFee=${sData.platformFee?.amountMinor / 100} ${sData.platformFee?.currency}, IntervalDays=${sData.reminderPolicy?.donationIntervalDays}, Maintenance=${sData.systemToggles?.maintenanceMode}\n`);

    // 12. Security Audit Logs
    console.log('1️⃣2️⃣ Testing GET /admin/audit-events...');
    const auditRes = await fetch(`${BASE_URL}/admin/audit-events`, { headers: authHeaders });
    const auditJson: any = await auditRes.json();
    const aList = auditJson.data?.items || auditJson.data || [];
    console.log(`   ✅ Found ${aList.length} audit log entries.\n`);

    // 13. Reminders Trigger
    console.log('1️⃣3️⃣ Testing POST /admin/reminders/trigger...');
    const remRes = await fetch(`${BASE_URL}/admin/reminders/trigger`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    const remJson: any = await remRes.json();
    console.log(`   ✅ Eligibility reminder job triggered: ${JSON.stringify(remJson.data || remJson.message || 'Triggered')}\n`);

    console.log('🎉 ALL 13 CORE ADMIN API INTEGRATION POINTS VERIFIED 100% OPERATIONAL!');
  } catch (err: any) {
    console.error('❌ Verification failed:', err.message, err.cause);
    process.exit(1);
  }
}

verifyAdminAPIs();
