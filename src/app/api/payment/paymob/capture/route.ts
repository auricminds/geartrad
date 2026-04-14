import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getAuthToken(): Promise<string> {
  const res = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
  });
  if (!res.ok) throw new Error('Paymob auth failed');
  const data = await res.json();
  return data.token as string;
}

/**
 * POST /api/payment/paymob/capture
 * Called when the buyer clicks "Confirm Delivery" on their order.
 *
 * Flow:
 *  1. Verify the caller is the buyer of this order
 *  2. Tell Paymob to capture (charge) the pre-authorized hold
 *  3. Mark order as delivered + release seller notification
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, buyerId } = await req.json() as { orderId: string; buyerId: string };

    if (!orderId || !buyerId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const admin = getAdmin();

    // Fetch the order and verify the buyer
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, buyer_id, seller_id, listing_id, amount, paymob_transaction_id, payment_status, payment_method')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.buyer_id !== buyerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (order.payment_status === 'delivered') {
      return NextResponse.json({ ok: true, message: 'Already confirmed' });
    }

    if (order.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Order is not in a capturable state' }, { status: 400 });
    }

    // ── For card payments: capture the pre-authorized hold via Paymob ────────
    if (order.payment_method === 'card' && order.paymob_transaction_id) {
      const token = await getAuthToken();

      const captureRes = await fetch('https://accept.paymob.com/api/acceptance/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          auth_token: token,
          transaction_id: parseInt(order.paymob_transaction_id, 10),
          amount_cents: Math.round(order.amount * 100),
        }),
      });

      if (!captureRes.ok) {
        const errBody = await captureRes.text();
        console.error('[capture] Paymob capture failed:', errBody);
        return NextResponse.json({ error: 'Capture failed. Contact support.' }, { status: 502 });
      }
    }
    // For Vodafone Cash / crypto / InstaPay: money is already in Paymob merchant
    // balance or pending crypto confirmation — no capture API call needed.
    // Just mark as delivered and queue seller payout.

    // ── Mark order as delivered ───────────────────────────────────────────────
    await admin
      .from('orders')
      .update({ payment_status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', orderId);

    // ── Notify seller: payment released ──────────────────────────────────────
    await admin.from('notifications').insert({
      user_id: order.seller_id,
      type: 'payment_released',
      title: 'Payment Released 💸',
      body: 'The buyer confirmed delivery. Your payment will be transferred within 24 hours.',
      related_id: orderId,
      is_read: false,
    });

    // ── Notify buyer: confirmed ───────────────────────────────────────────────
    await admin.from('notifications').insert({
      user_id: order.buyer_id,
      type: 'delivery_confirmed',
      title: 'Delivery Confirmed ✅',
      body: 'You confirmed receipt. Enjoy your account!',
      related_id: orderId,
      is_read: false,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[capture]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
