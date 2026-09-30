import { NextRequest, NextResponse } from 'next/server';
import { cleanPhone } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-webhook-secret');
    const validSecret = process.env.N8N_WEBHOOK_SECRET || 'wellwith_n8n_secret_production_2026';

    if (authHeader && authHeader !== validSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid webhook secret' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, concern, area, campaign_id, campaign_name, coupon_code } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Bad Request: name and phone are required' },
        { status: 400 }
      );
    }

    const { phoneClean, isValid } = cleanPhone(phone);

    // Business Logic: Return prepared payload for Supabase / CRM ingestion
    const leadRecord = {
      id: 'lead-' + Date.now(),
      created_at: new Date().toISOString(),
      name,
      phone_raw: phone,
      phone_clean: phoneClean,
      valid: isValid,
      source: 'Meta Instant Form',
      campaign_id: campaign_id || null,
      campaign_name: campaign_name || 'Meta Instant Leads - Sleep & Anxiety (Sep)',
      coupon_code: coupon_code || 'SLEEP20',
      concern: concern || 'General Ayurvedic Wellness',
      area: area || 'Hyderabad',
      lead_score: 'Hot',
      stage: 'New',
      opt_in: true,
      dnd: false,
      escalated: false,
      notes: 'Ingested via n8n Meta Lead Ads Trigger. Bolna AI scheduled.',
    };

    return NextResponse.json({
      status: 'success',
      action: 'lead_intake_processed',
      data: leadRecord,
      next_action: {
        send_whatsapp_welcome: true,
        whatsapp_delay_sec: 10,
        trigger_bolna_call: true,
        bolna_delay_sec: 50,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
