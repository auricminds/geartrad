import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/payment/confirm
 *
 * Seller confirms they received the payment.
 * Moves order to completed, releases credentials to buyer.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, sellerId } = await req.json() as {
      orderId: string;
      sellerId: string;
    };

    if (!orderId || !sellerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getAdmin();

    // Verify order belongs to this seller and is in proof_submitted state
    const { data: order, error } = await admin
      .from('orders')
      .select('id, seller_id, buyer_id, payment_status, listing_id')
      .eq('id', orderId)
      .eq('seller_id', sellerId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.payment_status !== 'proof_submitted') {
      return NextResponse.json(
        { error: 'Order is not in proof_submitted state' },
        { status: 409 },
      );
    }

    // Mark order as completed
    await admin.from('orders').update({
      payment_status: 'paid',
      status: 'completed',
    }).eq('id', orderId);

    // Increment seller's total_sales
    const { data: profile } = await admin
      .from('profiles')
      .select('total_sales')
      .eq('id', sellerId)
      .single();

    if (profile) {
      await admin.from('profiles')
        .update({ total_sales: (profile.total_sales ?? 0) + 1 })
        .eq('id', sellerId);
    }

    // Fetch listing title for notification
    const { data: listing } = await admin
      .from('listings')
      .select('title')
      .eq('id', order.listing_id)
      .single();

    // Notify buyer — credentials are now available
    await admin.from('notifications').insert({
      user_id: order.buyer_id,
      type: 'sale',
      title: 'Payment Confirmed — Credentials Available',
      body: `Seller confirmed your payment for "${listing?.title ?? 'your order'}". Your account credentials are now available in My Orders.`,
      related_id: orderId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[payment/confirm]', err);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
