process.env.NODE_ENV = 'test';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/prisma.js';
import app from '../src/index.js';
import http from 'http';

const JWT_SECRET = process.env.JWT_SECRET || 'wellwith_super_secret_jwt_key_2026_wellness_crm';

async function runRbacTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING WELLWITH CRM RBAC & ISOLATION TEST SUITE');
  console.log('========================================\n');

  // Start temporary test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5001, () => resolve()));
  const baseUrl = 'http://127.0.0.1:5001';

  try {
    // 1. Fetch Users
    const [admin, sai, client] = await Promise.all([
      prisma.user.findUnique({ where: { email: 'admin@wellwith.com' } }),
      prisma.user.findUnique({ where: { email: 'sai@wellwith.com' } }),
      prisma.user.findUnique({ where: { email: 'client@demo.com' } }),
    ]);

    if (!admin || !sai || !client) {
      throw new Error('Test users not found in database. Please run seed script first.');
    }

    const adminToken = jwt.sign({ id: admin.id, email: admin.email, role: admin.role, workspaceId: admin.workspaceId }, JWT_SECRET, { expiresIn: '1h' });
    const saiToken = jwt.sign({ id: sai.id, email: sai.email, role: sai.role, workspaceId: sai.workspaceId }, JWT_SECRET, { expiresIn: '1h' });
    const clientToken = jwt.sign({ id: client.id, email: client.email, role: client.role, workspaceId: client.workspaceId }, JWT_SECRET, { expiresIn: '1h' });

    console.log('🔑 Generated test JWT tokens for Super Admin, Sai (Telecaller), and Client Admin.\n');

    // TEST 1: Super Admin sees all leads across workspaces
    console.log('--- TEST 1: Super Admin global visibility ---');
    const adminRes = await fetch(`${baseUrl}/api/leads`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminData = await adminRes.json();
    console.log(`Admin retrieved ${adminData.pagination.total} total leads.`);
    if (adminRes.status === 200 && adminData.pagination.total >= 50) {
      console.log('✅ TEST 1 PASSED: Super Admin sees all leads.\n');
    } else {
      throw new Error(`TEST 1 FAILED: Expected >= 50 leads, got ${adminData.pagination?.total}`);
    }

    // TEST 2: Sai (Team Member) sees ONLY Sai's assigned leads
    console.log('--- TEST 2: Telecaller (Sai) query scoping ---');
    const saiRes = await fetch(`${baseUrl}/api/leads`, {
      headers: { Authorization: `Bearer ${saiToken}` },
    });
    const saiData = await saiRes.json();
    console.log(`Sai retrieved ${saiData.pagination.total} leads.`);
    
    // Verify every lead in the response is assigned strictly to Sai
    const allAssignedToSai = saiData.leads.every((l: any) => l.assignedToId === sai.id);
    if (saiRes.status === 200 && allAssignedToSai && saiData.pagination.total > 0 && saiData.pagination.total < adminData.pagination.total) {
      console.log('✅ TEST 2 PASSED: 100% of returned leads are strictly assigned to Sai.\n');
    } else {
      throw new Error(`TEST 2 FAILED: Non-Sai leads found in Sai query response.`);
    }

    // TEST 2B: Direct URL query bypass attempt by Sai for another lead
    console.log('--- TEST 2B: Direct ID access security check ---');
    // Find a lead NOT assigned to Sai
    const otherLead = await prisma.lead.findFirst({
      where: { assignedToId: { not: sai.id } },
    });
    if (otherLead) {
      const directAttemptRes = await fetch(`${baseUrl}/api/leads/${otherLead.id}`, {
        headers: { Authorization: `Bearer ${saiToken}` },
      });
      if (directAttemptRes.status === 404) {
        console.log(`✅ TEST 2B PASSED: Direct URL access to another user lead blocked (404 Not Found).\n`);
      } else {
        throw new Error(`TEST 2B FAILED: Sai was able to access unassigned or other user lead ${otherLead.id}!`);
      }
    }

    // TEST 3: Client Admin data isolation
    console.log('--- TEST 3: Multi-Workspace isolation for Client Admin ---');
    const clientRes = await fetch(`${baseUrl}/api/leads`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    const clientData = await clientRes.json();
    console.log(`Client Admin retrieved ${clientData.pagination.total} leads in Zenith workspace.`);

    const clientLeadsInCorrectWorkspace = clientData.leads.every((l: any) => l.workspaceId === client.workspaceId);
    if (clientRes.status === 200 && clientLeadsInCorrectWorkspace && clientData.pagination.total < adminData.pagination.total) {
      console.log('✅ TEST 3 PASSED: Client Admin is strictly isolated to their own workspace.\n');
    } else {
      throw new Error(`TEST 3 FAILED: Cross-workspace leak detected!`);
    }

    // TEST 4: AI Telecalling Access Control
    console.log('--- TEST 4: AI Telecalling Super-Admin & Feature Flag enforcement ---');
    // Admin access in HQ (feature flag ON)
    const aiAdminRes = await fetch(`${baseUrl}/api/ai-telecalling/campaigns`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (aiAdminRes.status === 200) {
      console.log('✅ Super Admin can access AI Telecalling when feature flag is ON.');
    } else {
      throw new Error(`TEST 4A FAILED: Super admin could not access AI telecalling.`);
    }

    // Sai attempt (Role forbidden)
    const aiSaiRes = await fetch(`${baseUrl}/api/ai-telecalling/campaigns`, {
      headers: { Authorization: `Bearer ${saiToken}` },
    });
    if (aiSaiRes.status === 403) {
      console.log('✅ Telecaller Sai is 403 FORBIDDEN from AI Telecalling.');
    } else {
      throw new Error(`TEST 4B FAILED: Telecaller was able to access AI telecalling!`);
    }

    // Client attempt (Role forbidden & feature flag OFF)
    const aiClientRes = await fetch(`${baseUrl}/api/ai-telecalling/campaigns`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    if (aiClientRes.status === 403) {
      console.log('✅ Client Admin is 403 FORBIDDEN from AI Telecalling.');
    } else {
      throw new Error(`TEST 4C FAILED: Client Admin was able to access AI telecalling!`);
    }

    // TEST 5: Webhook Lead Ingestion
    console.log('\n--- TEST 5: Webhook Ingestion with Secret Token ---');
    const hqWs = await prisma.workspace.findUnique({ where: { slug: 'wellwith-hq' } });
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const webhookRes = await fetch(`${baseUrl}/api/campaigns/webhooks/leads/${hqWs!.secretWebhookToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Automated Test Lead ${randomSuffix}`,
        phone: `+91999888${randomSuffix}`,
        email: `webhook.test${randomSuffix}@wellwith.com`,
        wellness_goal: 'Weight Loss',
        source: 'Meta',
        utm_campaign: 'wl_reset_q4',
      }),
    });
    const webhookData = await webhookRes.json();
    if (webhookRes.status === 201 && webhookData.success) {
      console.log('✅ TEST 5 PASSED: Webhook successfully ingested new Meta Lead into CRM.\n');
    } else {
      console.log('Webhook response:', webhookData);
      throw new Error(`TEST 5 FAILED: Webhook ingestion did not succeed.`);
    }

    console.log('========================================');
    console.log('🎉 ALL 5 CORE SECURITY & RBAC TESTS PASSED 100%!');
    console.log('========================================\n');
    process.exit(0);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runRbacTests().catch((e) => {
  console.error('❌ RBAC Test Failure:', e);
  process.exit(1);
});
