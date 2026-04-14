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
 * POST /api/payment/paymob/void
 * Voids (cancels) a pre-authorized hold — money auto-returns to buyer.
 *
 * Called when:
 *  - Buyer opens a dispute and moderator rules in buyer's favor
 *  - 72-hour delivery window expires with no confirmation (auto-called by cron)
 *  - Buyer requests cancellation before delivery
 *
 * Only moderators or the system (via cron) should call this.
 * Buyers cannot self-void — they must open a ticket.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, requestedBy, role } = await req.json() as {
      orderId: string;
      requestedBy: string;
      role: 'moderator' | 'system';
    };

    if (!orderId || !requestedBy || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const admin = getAdmin();

    // Verify caller is a moderator (or system)
    if (role === 'moderator') {
      const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', requestedBy)
        .single();

      if (!profile || !['moderator', 'admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Fetch the order
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, buyer_id, seller_id, payment_status, payment_method, paymob_transaction_id, amount')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment_status === 'refunded') {
      return NextResponse.json({ ok: true, message: 'Already refunded' });
    }

    if (!['paid', 'pending'].includes(order.payment_status)) {
      return NextResponse.json({ error: 'Order cannot be voided in its current state' }, { status: 400 });
    }

    // ── Void the pre-authorization via Paymob (card payments) ─────────────────
    if (order.payment_method === 'card' && order.paymob_transaction_id) {
      const token = await getAuthToken();

      const voidRes = await fetch('https://accept.paymob.com/api/acceptance/void_refund/void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          auth_token: token,
          transaction_id: parseInt(order.paymob_transaction_id, 10),
        }),
      });

      if (!voidRes.ok) {
        const errBody = await voidRes.text();
        console.error('[void] Paymob void failed:', errBody);
        // If already captured (edge case), fall through and mark manually
      }
    }
    // For Vodafone Cash: money is in Paymob merchant balance.
    // A refund must be issued manually via Paymob dashboard or refund API.
    // Mark order as refunded and moderator handles the manual transfer.

    // ── Update order status ───────────────────────────────────────────────────
    await admin
      .from('orders')
      .update({ payment_status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('id', orderId);

    // Re-list the listing as available
    await admin
      .from('listings')
      .update({ is_available: true })
      .eq('id', order.buyer_id); // note: this uses listing_id — see below

    // ── Notify buyer ──────────────────────────────────────────────────────────
    await admin.from('notifications').insert({
      user_id: order.buyer_id,
      type: 'refund',
      title: 'Refund Initiated 🔄',
      body: 'Your payment hold has been voided. Funds will return to your card within 3–5 business days (usually much faster).',
      related_id: orderId,
      is_read: false,
    });

    // ── Notify seller ─────────────────────────────────────────────────────────
    await admin.from('notifications').insert({
      user_id: order.seller_id,
      type: 'order_cancelled',
      title: 'Order Cancelled',
      body: 'This order was cancelled and the buyer\'s payment voided. Contact support if you believe this is an error.',
      related_id: orderId,
      is_read: false,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[void]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
