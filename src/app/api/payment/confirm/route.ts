import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailCredentialsAvailable, emailDeliveryConfirmed } from '@/lib/email';
import { getSessionUserId } from '@/lib/auth-server';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/payment/confirm
 *
 * Two flows:
 * 1. Seller confirms payment received (proof_submitted → paid) — pass sellerId
 * 2. Buyer confirms delivery / account works (paid → delivered) — pass buyerId
 *
 * Race-condition-safe: uses a single conditional UPDATE...WHERE instead of
 * SELECT-then-UPDATE, so two simultaneous requests cannot both "win".
 */
export async function POST(req: NextRequest) {
  try {
    const sessionUserId = await getSessionUserId(req);
    if (!sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { orderId: string; sellerId?: string; buyerId?: string };
    const { orderId, sellerId, buyerId } = body;

    if (!orderId || (!sellerId && !buyerId)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify session matches the claimed role
    const claimedId = sellerId ?? buyerId;
    if (sessionUserId !== claimedId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = getAdmin();

    // ── Seller confirms payment received ─────────────────────────────────────
    // Single atomic UPDATE — only succeeds if payment_status is still 'proof_submitted'.
    // Eliminates the SELECT → UPDATE race window.
    if (sellerId) {
      const { data: order, error } = await admin
        .from('orders')
        .update({ payment_status: 'paid', status: 'completed' })
        .eq('id', orderId)
        .eq('seller_id', sellerId)
        .eq('payment_status', 'proof_submitted')
        .select('id, buyer_id, listing_id')
        .single();

      if (error || !order) {
        return NextResponse.json({ error: 'Order not found or already processed' }, { status: 409 });
      }

      const { data: profile } = await admin
        .from('profiles').select('total_sales').eq('id', sellerId).single();
      if (profile) {
        await admin.from('profiles')
          .update({ total_sales: (profile.total_sales ?? 0) + 1 })
          .eq('id', sellerId);
      }

      const { data: listing } = await admin
        .from('listings').select('title').eq('id', order.listing_id).single();

      await admin.from('notifications').insert({
        user_id: order.buyer_id,
        type: 'sale',
        title: 'Payment Confirmed — Credentials Available',
        body: `Seller confirmed your payment for "${listing?.title ?? 'your order'}". Your account credentials are now available in My Orders.`,
        related_id: orderId,
      });
      emailCredentialsAvailable(order.buyer_id, listing?.title ?? 'your order').catch(() => {});

      return NextResponse.json({ success: true });
    }

    // ── Buyer confirms delivery ───────────────────────────────────────────────
    // Single atomic UPDATE — only succeeds if payment_status is 'paid' or 'delivered'.
    if (buyerId) {
      const { data: order, error } = await admin
        .from('orders')
        .update({ payment_status: 'delivered', status: 'completed' })
        .eq('id', orderId)
        .eq('buyer_id', buyerId)
        .in('payment_status', ['paid', 'delivered'])
        .select('id, seller_id, listing_id')
        .single();

      if (error || !order) {
        return NextResponse.json({ error: 'Order not found or not yet released' }, { status: 409 });
      }

      // Re-count completed orders for accuracy
      const { count: completedCount } = await admin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', order.seller_id)
        .in('payment_status', ['paid', 'delivered']);
      await admin.from('profiles')
        .update({ total_sales: completedCount ?? 0 })
        .eq('id', order.seller_id);

      const { data: listing } = await admin
        .from('listings').select('title').eq('id', order.listing_id).single();

      const { data: fullOrder } = await admin
        .from('orders').select('amount').eq('id', orderId).single();

      await admin.from('notifications').insert({
        user_id: order.seller_id,
        type: 'sale',
        title: 'Delivery Confirmed',
        body: `Buyer confirmed receipt of "${listing?.title ?? 'your listing'}". The trade is now complete.`,
        related_id: orderId,
      });
      emailDeliveryConfirmed(order.seller_id, listing?.title ?? 'your listing', fullOrder?.amount ?? 0).catch(() => {});

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err) {
    console.error('[payment/confirm]', err);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
