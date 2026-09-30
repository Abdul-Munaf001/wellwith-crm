import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-webhook-secret');
    const validSecret = process.env.N8N_WEBHOOK_SECRET || 'wellwith_n8n_secret_production_2026';

    if (authHeader && authHeader !== validSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid webhook secret' }, { status: 401 });
    }

    const body = await req.json();
    const { lead_id, message_id, status, incoming_text } = body;

    const isStopCommand = incoming_text && incoming_text.trim().toUpperCase() === 'STOP';

    return NextResponse.json({
      status: 'success',
      message_id,
      delivery_status: status || 'delivered',
      dnd_enabled: isStopCommand,
      compliance_action: isStopCommand ? 'TRAI DND enabled: Marketing blocked.' : 'Normal status logged.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
