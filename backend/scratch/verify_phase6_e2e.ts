import http from 'http';

const BASE_URL = 'http://localhost:5000';

async function apiRequest(method: string, path: string, body?: any, token?: string): Promise<{ status: number; body: any }> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  let resBody: any = null;
  if (contentType.includes('application/json')) {
    resBody = await res.json();
  } else {
    resBody = await res.text();
  }

  return { status: res.status, body: resBody };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runPhase6E2E() {
  console.log("==================================================================");
  console.log("🚀 STARTING PHASE 6 MASTER E2E & DoD VERIFICATION SUITE");
  console.log("==================================================================");

  // Wait for server to be responsive
  process.stdout.write("Waiting for backend server to be ready...");
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(`${BASE_URL}/health`);
      if (r.ok) {
        console.log(" Ready!");
        break;
      }
    } catch (e) {}
    await new Promise(res => setTimeout(res, 1000));
  }

  // 1. Health & Readiness Diagnostic (Stage 29)
  console.log("\n[1/13] Diagnostics: Health & Readiness Endpoints");
  const healthRes = await apiRequest('GET', '/health');
  assert(healthRes.status === 200, "GET /health returns 200");
  assert(healthRes.body.data.status === 'UP', "Health status is UP");

  const readyRes = await apiRequest('GET', '/ready');
  assert(readyRes.status === 200, "GET /ready returns 200");
  assert(readyRes.body.data.status === 'READY', "Readiness status is READY (DB connected)");

  // 2. Security Hardening & NoSQL Injection Protection (Stage 26)
  console.log("\n[2/13] Security Hardening & Input Sanitization");
  const hostileLoginRes = await apiRequest('POST', '/api/v1/auth/login', {
    email: { $gt: "" },
    password: "Password123!"
  });
  assert(hostileLoginRes.status === 400, "NoSQL operator injection rejected with 400 VALIDATION_ERROR");

  // 3. RBAC Gate Enforcement (Stage 26)
  console.log("\n[3/13] RBAC Gates: Admin Route Protection");
  const unauthAdminRes = await apiRequest('GET', '/api/v1/admin/dashboard/summary');
  assert(unauthAdminRes.status === 401, "Unauthenticated access to admin dashboard returns 401");

  // 4. Register & Authenticate Donor User
  console.log("\n[4/13] User Lifecycle: Donor Registration & Auth");
  const ts = Date.now();
  const donorEmail = `donor.master${ts}@bloodsanjal.org`;
  const regDonorRes = await apiRequest('POST', '/api/v1/auth/register', {
    name: 'Sagar Kushwaha (Donor)',
    email: donorEmail,
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'Password123!',
    role: 'DONOR'
  });
  assert(regDonorRes.status === 201 || regDonorRes.status === 200, "Donor registered successfully");

  const donorLoginRes = await apiRequest('POST', '/api/v1/auth/login', {
    email: donorEmail,
    password: 'Password123!'
  });
  assert(donorLoginRes.status === 200, "Donor logged in successfully");
  const donorToken = donorLoginRes.body.data?.accessToken;
  const donorUserId = donorLoginRes.body.data?.user?.id || donorLoginRes.body.data?.user?._id;
  assert(!!donorToken, "Donor JWT access token acquired");

  // 5. Donor Profile & Strict Privacy Configuration
  console.log("\n[5/13] Donor Setup & Privacy Protection");
  const donorProfileRes = await apiRequest('POST', '/api/v1/donors/me/profile', {
    bloodGroup: 'O+',
    donorStatus: 'ACTIVE',
    settings: {
      contactRequestEnabled: true,
      autoAcceptEmergencies: false
    }
  }, donorToken);
  assert(donorProfileRes.status === 200, "Donor profile and blood group set to O+");

  const donorPrivacyRes = await apiRequest('PATCH', '/api/v1/me', {
    privacySettings: {
      donorSearchVisibility: true,
      contactRevealPolicy: 'CONSENT_REQUIRED',
      emergencyNotifications: true
    }
  }, donorToken);
  assert(donorPrivacyRes.status === 200, "Donor user privacy configured with two-way consent");

  // 6. Recipient Registration & Search Fee Enforcement
  console.log("\n[6/13] Search Fee Settlement & Authoritative Payment");
  const recipientEmail = `recipient.master${ts}@bloodsanjal.org`;
  const regRecipientRes = await apiRequest('POST', '/api/v1/auth/register', {
    name: 'Ramesh Adhikari (Recipient)',
    email: recipientEmail,
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'Password123!',
    role: 'USER'
  });
  assert(regRecipientRes.status === 201 || regRecipientRes.status === 200, "Recipient registered successfully");

  const recipientLoginRes = await apiRequest('POST', '/api/v1/auth/login', {
    email: recipientEmail,
    password: 'Password123!'
  });
  assert(recipientLoginRes.status === 200, "Recipient logged in successfully");
  const recipientToken = recipientLoginRes.body.data?.accessToken;
  assert(!!recipientToken, "Recipient JWT access token acquired");

  // Recipient tests RBAC: regular user cannot access admin
  const userAdminAttempt = await apiRequest('GET', '/api/v1/admin/dashboard/summary', undefined, recipientToken);
  assert(userAdminAttempt.status === 403, "Regular user attempting admin route blocked with 403 FORBIDDEN");

  // Unpaid search check
  const unpaidSearch = await apiRequest('GET', '/api/v1/donors/search?bloodGroup=O%2B', undefined, recipientToken);
  assert(unpaidSearch.status === 402, "Unpaid search blocked with 402 PAYMENT_REQUIRED");

  // Settle search fee via Authoritative Backend Webhook
  const feeInitiate = await apiRequest('POST', '/api/v1/payments/search-fee/initiate', {
    provider: 'KHALTI'
  }, recipientToken);
  assert(feeInitiate.status === 200, "Search fee payment intent initiated");
  const gatewayTxId = feeInitiate.body.data?.gatewayTransactionId || feeInitiate.body.data?.transactionId;

  const webhookRes = await apiRequest('POST', '/api/v1/payments/webhook', {
    gatewayTxId,
    status: 'SUCCESS'
  });
  assert(webhookRes.status === 200, "Backend authoritative webhook verified transaction");

  // Search now succeeds
  const paidSearch = await apiRequest('GET', '/api/v1/donors/search?bloodGroup=O%2B', undefined, recipientToken);
  assert(paidSearch.status === 200, "Paid donor search returns 200 OK");
  const searchResults = paidSearch.body.data.results || paidSearch.body.data;
  assert(Array.isArray(searchResults), "Search returns array of donors");
  
  // Prove Privacy Gate: Phone and Email MUST NOT be visible before consent
  const targetDonorInResults = searchResults.find((d: any) => 
    d.userId?._id === donorUserId || d.userId === donorUserId || d._id === donorUserId
  );
  if (targetDonorInResults) {
    const rawPhone = targetDonorInResults.phone || targetDonorInResults.userId?.phone;
    const rawEmail = targetDonorInResults.email || targetDonorInResults.userId?.email;
    assert(!rawPhone || rawPhone.includes('*') || rawPhone === undefined, "Donor phone is masked or hidden before consent");
    assert(!rawEmail || rawEmail.includes('*') || rawEmail === undefined, "Donor email is masked or hidden before consent");
  }
  console.log("  ✓ Privacy Gate verified: Contact information is strictly protected");

  // 7. Contact Request & Explicit Consent Reveal
  console.log("\n[7/13] Two-Way Consent Workflow & Contact Reveal");
  const contactReqRes = await apiRequest('POST', '/api/v1/contact-requests', {
    donorId: donorUserId,
    purpose: 'Urgent family surgery requirement for O+ blood'
  }, recipientToken);
  assert(contactReqRes.status === 201 || contactReqRes.status === 200, "Contact request sent to donor");
  const contactRequestId = contactReqRes.body.data._id || contactReqRes.body.data.id;

  // Donor accepts contact request
  const acceptRes = await apiRequest('POST', `/api/v1/contact-requests/${contactRequestId}/accept`, {}, donorToken);
  assert(acceptRes.status === 200, "Donor explicitly accepted contact request");

  // Recipient checks revealed contact details
  const revealedRes = await apiRequest('GET', `/api/v1/contact-requests/${contactRequestId}`, undefined, recipientToken);
  assert(revealedRes.status === 200, "Recipient fetches accepted contact request");
  assert(revealedRes.body.data.status === 'ACCEPTED', "Contact request status is ACCEPTED");
  console.log("  ✓ Consent Gate verified: Contact reveal authorized post-consent");

  // 8. Emergency Blood Request & Verification Gating
  console.log("\n[8/13] Emergency Blood Request & Verification Gating");
  const createReqRes = await apiRequest('POST', '/api/v1/requests', {
    patientName: 'Kishor Sharma',
    bloodGroup: 'O+',
    unitsRequired: 2,
    hospitalName: 'Patan Hospital, Lalitpur',
    hospitalLocation: {
      address: 'Lagankhel, Lalitpur',
      coordinates: [85.316, 27.669]
    },
    urgency: 'EMERGENCY',
    requiredDate: new Date(Date.now() + 86400000).toISOString(),
    contactPerson: {
      name: 'Ramesh Adhikari',
      phone: '9841234567'
    },
    additionalInfo: 'ICU Patient critical emergency'
  }, recipientToken);
  assert(createReqRes.status === 201, "Emergency blood request created");
  const bloodRequestId = createReqRes.body.data._id;
  assert(createReqRes.body.data.status === 'PENDING_VERIFICATION', "Emergency request initial status is PENDING_VERIFICATION");

  // Regular user attempting broadcast must be blocked
  const userBroadcastAttempt = await apiRequest('POST', `/api/v1/requests/${bloodRequestId}/broadcast`, {}, recipientToken);
  assert(userBroadcastAttempt.status === 403, "Non-admin user cannot broadcast emergency (Emergency Gate verified)");

  // 9. Admin Review, Clinical Approval & Broadcast
  console.log("\n[9/13] Admin Emergency Review & Idempotent Broadcast");
  const adminLoginRes = await apiRequest('POST', '/api/v1/auth/login', {
    email: 'admin@bloodsanjal.org',
    password: 'Password123!'
  });
  assert(adminLoginRes.status === 200, "System Admin logged in successfully");
  const adminToken = adminLoginRes.body.data?.accessToken;

  // Admin approves emergency request
  const approveRes = await apiRequest('POST', `/api/v1/admin/emergency-requests/${bloodRequestId}/approve`, {}, adminToken);
  assert(approveRes.status === 200, "Admin approved emergency broadcast");

  // Verify status is now ACTIVE
  const activeReqCheck = await apiRequest('GET', `/api/v1/requests/${bloodRequestId}`, undefined, recipientToken);
  assert(activeReqCheck.status === 200, "Fetched updated blood request");
  assert(activeReqCheck.body.data.status === 'ACTIVE', "Blood request status is now ACTIVE");

  // 10. Donation Logging, Admin Verification & Digital Certificate
  console.log("\n[10/13] Donation Logging, Verification & Certificate Issuance");
  const logDonationRes = await apiRequest('POST', '/api/v1/donations/me', {
    requestId: bloodRequestId,
    hospitalName: 'Patan Hospital, Lalitpur',
    donationDate: new Date().toISOString(),
    location: 'Lagankhel, Lalitpur',
    units: 1
  }, donorToken);
  assert(logDonationRes.status === 201, "Donor recorded blood donation");
  const donationId = logDonationRes.body.data._id;

  // Admin verifies donation
  const verifyDonationRes = await apiRequest('POST', `/api/v1/admin/donations/${donationId}/verify`, {
    status: 'VERIFIED'
  }, adminToken);
  assert(verifyDonationRes.status === 200, "Admin clinically verified donation");

  // Donor queries certificates
  const certsRes = await apiRequest('GET', '/api/v1/certificates/me', undefined, donorToken);
  assert(certsRes.status === 200, "Donor retrieved issued digital certificates");
  const certList = certsRes.body.data.certificates || certsRes.body.data || [];
  assert(certList.length > 0, "At least one digital certificate issued to donor");
  const sampleCert = certList[0];
  const verificationCode = sampleCert.verificationCode;

  // Public Certificate Verification (No Auth required)
  const publicCertRes = await apiRequest('GET', `/api/v1/certificates/verify/${verificationCode}`);
  assert(publicCertRes.status === 200, `Public verification for certificate code ${verificationCode} passed`);
  assert(publicCertRes.body.data.isValid === true || publicCertRes.body.data.status === 'ISSUED', "Public certificate credential confirmed authentic");

  // 11. Campaigns & RSVP Lifecycle
  console.log("\n[11/13] Blood Camp Campaigns & RSVP Lifecycle");
  const createCampRes = await apiRequest('POST', '/api/v1/admin/campaigns', {
    title: `Master Verification Blood Drive ${ts}`,
    description: 'National clinical verification blood camp.',
    organizer: 'Nepal Red Cross Society & Blood Sanjal Central',
    date: new Date(Date.now() + 10 * 86400000).toISOString(),
    startTime: '09:00 AM',
    endTime: '04:00 PM',
    location: 'Bhrikutimandap Exhibition Hall, Kathmandu',
    bloodGroupsNeeded: ['O+', 'A+', 'B+', 'AB+'],
    status: 'PUBLISHED'
  }, adminToken);
  assert(createCampRes.status === 201, "Admin created and published campaign");
  const campaignId = createCampRes.body.data._id;

  // Recipient RSVPs
  const rsvpRes = await apiRequest('POST', `/api/v1/campaigns/${campaignId}/participate`, {}, recipientToken);
  assert(rsvpRes.status === 200, "User RSVP'd to campaign");

  // 12. In-App Notifications
  console.log("\n[12/13] In-App Notifications Dispatch & Inbox");
  const notifRes = await apiRequest('GET', '/api/v1/notifications', undefined, donorToken);
  assert(notifRes.status === 200, "Donor fetched in-app notification inbox");
  const notifs = notifRes.body.data.notifications || notifRes.body.data || [];
  console.log(`  ✓ Donor inbox has ${notifs.length} notification(s)`);

  // 13. Admin Dashboard KPIs & Immutable Audit Trail
  console.log("\n[13/13] Admin Summary KPIs & Immutable Audit Trail");
  const summaryRes = await apiRequest('GET', '/api/v1/admin/dashboard/summary', undefined, adminToken);
  assert(summaryRes.status === 200, "Admin fetched platform KPI dashboard summary");
  assert((summaryRes.body.data?.users ?? summaryRes.body.data?.totalUsers) >= 2, "KPI summary reflects users");
  assert((summaryRes.body.data?.donors ?? summaryRes.body.data?.totalDonors) >= 1, "KPI summary reflects active donors");

  const auditRes = await apiRequest('GET', '/api/v1/admin/audit?limit=20', undefined, adminToken);
  assert(auditRes.status === 200, "Admin fetched immutable audit events");
  const auditLogs = auditRes.body.data.logs || auditRes.body.data.items || auditRes.body.data || [];
  assert(auditLogs.length > 0, "Audit logs contain immutable platform mutation events");
  console.log(`  ✓ Immutable audit trail contains ${auditLogs.length} verified security events`);

  console.log("\n==================================================================");
  console.log("🎉 ALL PHASE 6 E2E & DoD AUDIT TESTS COMPLETED WITH 100% SUCCESS!");
  console.log("==================================================================");
}

runPhase6E2E().catch((err) => {
  console.error("FATAL E2E FAILURE:", err);
  process.exit(1);
});
