import { NextRequest, NextResponse } from 'next/server';
import { calculateReorderDueDate } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead_id, product, pack, amount, coupon_code, channel, order_date } = body;

    const reorderDueDate = calculateReorderDueDate(order_date, 25);

    const orderRecord = {
      id: 'ord-' + Date.now(),
      lead_id,
      order_date: order_date || new Date().toISOString().split('T')[0],
      product,
      pack: pack || 'single',
      amount,
      coupon_code,
      channel: channel || 'Store',
      payment_status: 'paid',
      delivery_status: channel === 'Store' ? 'delivered' : 'pending',
      reorder_due_date: reorderDueDate,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      status: 'success',
      action: 'order_created',
      order: orderRecord,
      lead_stage_updated: 'Ordered',
      reorder_due_date: reorderDueDate,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
