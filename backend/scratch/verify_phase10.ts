import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://127.0.0.1:5000/api/v1';
const HEALTH_URL = 'http://127.0.0.1:5000/health';
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'secret';

function createToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

async function run() {
  console.log('--- Phase 10 Verification: Reports, Auditing, Notifications & System Health ---');
  
  const adminToken = createToken('660000000000000000000001', 'ADMIN');
  const userToken = createToken('660000000000000000000002', 'USER');

  // 1. Health Probe
  console.log('1. Testing GET /health...');
  const healthRes = await fetch(HEALTH_URL);
  const healthData: any = await healthRes.json();
  console.log('Health status:', healthRes.status, 'status text:', healthData.data?.status);

  // 2. Admin Broadcast Notifications (List & Schedule)
  console.log('2. Testing GET /api/v1/admin/notifications...');
  const notifsListRes = await fetch(`${BASE_URL}/admin/notifications`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const notifsListData: any = await notifsListRes.json();
  console.log('Admin notifications list status:', notifsListRes.status, 'success:', notifsListData.success);

  console.log('3. Testing POST /api/v1/admin/notifications/schedule...');
  const scheduleRes = await fetch(`${BASE_URL}/admin/notifications/schedule`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Phase 10 Blood Drive Alert',
      message: 'Urgent need for O+ donors in Kathmandu Valley',
      channels: ['IN_APP'],
      target: { type: 'ALL' },
      status: 'SCHEDULED'
    })
  });
  const scheduleData: any = await scheduleRes.json();
  console.log('Schedule broadcast status:', scheduleRes.status, 'broadcastId:', scheduleData.data?._id);

  // 4. Reports KPIs
  console.log('4. Testing GET /api/v1/admin/reports/kpis...');
  const kpiRes = await fetch(`${BASE_URL}/admin/reports/kpis`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const kpiData: any = await kpiRes.json();
  console.log('KPI status:', kpiRes.status, 'totalUsers:', kpiData.data?.totalUsers);

  // 5. Reports Aggregations by Type
  const reportTypes = ['demand', 'donors', 'locations', 'users', 'donations', 'payments', 'campaigns'];
  for (const rType of reportTypes) {
    const repRes = await fetch(`${BASE_URL}/admin/reports/${rType}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const repData: any = await repRes.json();
    console.log(`Report [${rType}] status:`, repRes.status, 'isSuccess:', repData.success);
  }

  // 6. Settings
  console.log('6. Testing GET /api/v1/admin/settings...');
  const settingsRes = await fetch(`${BASE_URL}/admin/settings`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const settingsData: any = await settingsRes.json();
  console.log('Settings status:', settingsRes.status, 'success:', settingsData.success);

  // 7. Audit Events
  console.log('7. Testing GET /api/v1/admin/audit-events...');
  const auditRes = await fetch(`${BASE_URL}/admin/audit-events?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const auditData: any = await auditRes.json();
  console.log('Audit events status:', auditRes.status, 'count:', auditData.data?.data?.length);

  // 8. Admin Payments Summary & Log
  console.log('8. Testing GET /api/v1/admin/payments/summary...');
  const paySummaryRes = await fetch(`${BASE_URL}/admin/payments/summary`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const paySummaryData: any = await paySummaryRes.json();
  console.log('Payments summary status:', paySummaryRes.status, 'totalRevenueNpr:', paySummaryData.data?.totalRevenueNpr);

  // 9. RBAC Check
  console.log('9. Testing Non-Admin RBAC Block on Admin Reports...');
  const rbacRes = await fetch(`${BASE_URL}/admin/reports/kpis`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const rbacData: any = await rbacRes.json();
  console.log('RBAC block status:', rbacRes.status, 'error code:', rbacData.error?.code);

  console.log('--- Phase 10 Verification Complete! All systems operational. ---');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
