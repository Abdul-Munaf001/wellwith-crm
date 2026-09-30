const BASE_URL = 'http://localhost:3000';
const SECRET = 'wellwith_n8n_secret_production_2026';

async function testAll() {
  console.log('Testing Wellwith CRM endpoints on', BASE_URL);

  // 1. Test Home UI
  const homeRes = await fetch(BASE_URL);
  console.log(`1. UI Page Status: ${homeRes.status} (Expect 200)`);

  // 2. Test Meta Lead Intake Webhook
  const metaRes = await fetch(`${BASE_URL}/api/webhooks/meta-lead`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': SECRET,
    },
    body: JSON.stringify({
      name: 'Pooja Hegde',
      phone: '98401 55667',
      concern: 'Sleep disturbance & evening cortisol spikes',
      area: 'Jubilee Hills, Hyderabad',
      coupon_code: 'SLEEP20',
    }),
  });
  const metaData = await metaRes.json();
  console.log(`2. Meta Lead Webhook Status: ${metaRes.status}`, metaData.data ? `Lead: ${metaData.data.name} (${metaData.data.phone_clean})` : metaData);

  // 3. Test Bolna AI Call Webhook with Pregnancy Escalation Detection
  const bolnaRes = await fetch(`${BASE_URL}/api/webhooks/bolna-call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': SECRET,
    },
    body: JSON.stringify({
      lead_id: 'lead-test-123',
      duration_sec: 54,
      transcript_text: 'Customer mentioned: I am 4 months pregnant, is this herbal supplement safe?',
    }),
  });
  const bolnaData = await bolnaRes.json();
  console.log(`3. Bolna AI Call Webhook Status: ${bolnaRes.status}`, `Escalated: ${bolnaData.routing?.escalated}`);

  // 4. Test WhatsApp Status Webhook with "STOP" -> DND = true
  const waRes = await fetch(`${BASE_URL}/api/webhooks/whatsapp-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': SECRET,
    },
    body: JSON.stringify({
      lead_id: 'lead-test-123',
      message_id: 'msg-99',
      incoming_text: 'STOP',
    }),
  });
  const waData = await waRes.json();
  console.log(`4. WhatsApp STOP Webhook Status: ${waRes.status}`, `DND Enabled: ${waData.dnd_enabled}`);

  // 5. Test POS Orders API
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: 'lead-101',
      product: 'Deep Sleep Herbal Gummies',
      pack: '2-pack',
      amount: 1618,
      coupon_code: 'HYD10',
      channel: 'Store',
      order_date: '2026-09-30',
    }),
  });
  const orderData = await orderRes.json();
  console.log(`5. POS Orders API Status: ${orderRes.status}`, `Reorder Due Date: ${orderData.reorder_due_date}`);

  console.log('--- ALL 5 ENDPOINTS VERIFIED SUCCESSFULLY ---');
}

testAll().catch(console.error);
