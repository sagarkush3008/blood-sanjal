const BASE_URL = 'http://127.0.0.1:5000';

async function testAllEndpoints() {
  console.log('--- TESTING ALL BACKEND API ENDPOINTS ---');
  let passed = 0;
  let total = 0;

  async function check(name: string, fn: () => Promise<any>) {
    total++;
    try {
      const res = await fn();
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error(`[FAIL] ${name}: status ${res.status}`, body);
      } else {
        console.log(`[PASS] ${name} (Status: ${res.status})`);
        passed++;
      }
    } catch (e: any) {
      console.error(`[FAIL] ${name}:`, e.message);
    }
  }

  // 1. Health & Ready
  await check('GET /health', () => fetch(`${BASE_URL}/health`));
  await check('GET /ready', () => fetch(`${BASE_URL}/ready`));

  // 2. Metrics
  await check('GET /api/v1/metrics', () => fetch(`${BASE_URL}/api/v1/metrics`));

  // 3. Legal
  await check('GET /api/v1/legal/terms', () => fetch(`${BASE_URL}/api/v1/legal/terms`));
  await check('GET /api/v1/legal/privacy', () => fetch(`${BASE_URL}/api/v1/legal/privacy`));
  await check('GET /api/v1/legal/disclaimer', () => fetch(`${BASE_URL}/api/v1/legal/disclaimer`));

  // 4. Locations & Blood Banks
  await check('GET /api/v1/locations/banks', () => fetch(`${BASE_URL}/api/v1/locations/banks`));
  await check('GET /api/v1/locations', () => fetch(`${BASE_URL}/api/v1/locations`));

  // 5. Public Campaigns & Milestones
  await check('GET /api/v1/campaigns', () => fetch(`${BASE_URL}/api/v1/campaigns`));
  await check('GET /api/v1/rewards/milestones', () => fetch(`${BASE_URL}/api/v1/rewards/milestones`));

  // 6. Auth Login (Admin or Seeded User)
  let authToken = '';
  total++;
  try {
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@bloodsanjal.org',
        password: 'Password123!',
      }),
    });
    const data = await loginRes.json();
    authToken = data?.data?.accessToken || data?.accessToken;
    if (authToken) {
      console.log('[PASS] POST /api/v1/auth/login -> Logged in successfully');
      passed++;
    } else {
      console.warn('Admin login response:', data);
    }
  } catch (err: any) {
    console.warn('Admin login error:', err.message);
  }

  if (authToken) {
    const headers = {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };

    // 7. Me Profile & Privacy
    await check('GET /api/v1/me', () => fetch(`${BASE_URL}/api/v1/me`, { headers }));
    await check('GET /api/v1/me/privacy', () => fetch(`${BASE_URL}/api/v1/me/privacy`, { headers }));
    await check('PATCH /api/v1/me/privacy', () => fetch(`${BASE_URL}/api/v1/me/privacy`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ donorSearchVisibility: true }),
    }));

    // 8. Blood Requests
    await check('GET /api/v1/requests', () => fetch(`${BASE_URL}/api/v1/requests`, { headers }));

    // 9. Contact Requests
    await check('GET /api/v1/contact-requests', () => fetch(`${BASE_URL}/api/v1/contact-requests`, { headers }));

    // 10. Donations
    await check('GET /api/v1/donations', () => fetch(`${BASE_URL}/api/v1/donations`, { headers }));

    // 11. Payments History
    await check('GET /api/v1/payments/history', () => fetch(`${BASE_URL}/api/v1/payments/history`, { headers }));

    // 12. Notifications
    await check('GET /api/v1/notifications', () => fetch(`${BASE_URL}/api/v1/notifications`, { headers }));
    await check('GET /api/v1/notifications/unread-count', () => fetch(`${BASE_URL}/api/v1/notifications/unread-count`, { headers }));

    // 13. Rewards & Certificates
    await check('GET /api/v1/rewards/me', () => fetch(`${BASE_URL}/api/v1/rewards/me`, { headers }));
    await check('GET /api/v1/rewards/stats', () => fetch(`${BASE_URL}/api/v1/rewards/stats`, { headers }));
    await check('GET /api/v1/certificates/me', () => fetch(`${BASE_URL}/api/v1/certificates/me`, { headers }));

    // 14. Admin Endpoints
    await check('GET /api/v1/admin/dashboard/summary', () => fetch(`${BASE_URL}/api/v1/admin/dashboard/summary`, { headers }));
    await check('GET /api/v1/admin/users', () => fetch(`${BASE_URL}/api/v1/admin/users`, { headers }));
    await check('GET /api/v1/admin/donors', () => fetch(`${BASE_URL}/api/v1/admin/donors`, { headers }));
    await check('GET /api/v1/admin/blood-requests', () => fetch(`${BASE_URL}/api/v1/admin/blood-requests`, { headers }));
    await check('GET /api/v1/admin/emergency-requests', () => fetch(`${BASE_URL}/api/v1/admin/emergency-requests`, { headers }));
    await check('GET /api/v1/admin/donations', () => fetch(`${BASE_URL}/api/v1/admin/donations`, { headers }));
    await check('GET /api/v1/admin/campaigns', () => fetch(`${BASE_URL}/api/v1/admin/campaigns`, { headers }));
    await check('GET /api/v1/admin/settings', () => fetch(`${BASE_URL}/api/v1/admin/settings`, { headers }));
    await check('GET /api/v1/admin/audit-events', () => fetch(`${BASE_URL}/api/v1/admin/audit-events`, { headers }));
  }

  console.log(`\n========================================`);
  console.log(`RESULT: ${passed}/${total} API ENDPOINTS VERIFIED & OPERATIONAL`);
  console.log(`========================================`);
}

testAllEndpoints();
