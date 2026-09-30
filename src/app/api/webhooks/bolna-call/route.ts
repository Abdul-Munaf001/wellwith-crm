import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-webhook-secret');
    const validSecret = process.env.N8N_WEBHOOK_SECRET || 'wellwith_n8n_secret_production_2026';

    if (authHeader && authHeader !== validSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid webhook secret' }, { status: 401 });
    }

    const body = await req.json();
    const { lead_id, duration_sec, outcome, transcript_text, recording_url } = body;

    // Detect medical safety triggers in transcript
    const medicalKeywords = ['pregnant', 'pregnancy', 'trimester', 'high bp', 'blood pressure', 'chemotherapy', 'medication'];
    const hasMedicalMention = transcript_text
      ? medicalKeywords.some((kw) => transcript_text.toLowerCase().includes(kw))
      : false;

    const callResult = {
      id: 'call-' + Date.now(),
      lead_id,
      called_at: new Date().toISOString(),
      duration_sec: duration_sec || 60,
      outcome: hasMedicalMention ? 'Escalated Medical Mention' : outcome || 'Answered - Interested',
      score_given: hasMedicalMention ? 'Warm' : 'Hot',
      recording_url: recording_url || 'https://bolna.ai/recordings/demo-call.mp3',
      transcript_text: transcript_text || 'Bolna AI automated consultation completed.',
      escalated: hasMedicalMention,
    };

    return NextResponse.json({
      status: 'success',
      action: 'call_result_recorded',
      data: callResult,
      routing: {
        escalated: hasMedicalMention,
        alert_human_doctor: hasMedicalMention,
        notify_closer_whatsapp: !hasMedicalMention,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
