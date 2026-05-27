import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailDeliveryConfirmed } from '@/lib/email';

/**
 * GET /api/cron/auto-complete-orders
 *
 * Runs every hour via Vercel cron.
 * Auto-completes orders where the seller confirmed payment ("paid" status)
 * but the buyer has not confirmed delivery within 72 hours.
 *
 * This protects sellers from buyers who receive the account but never close the order.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Orders in "paid" status where proof was submitted > 72h ago
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  const { data: timedOut, error } = await admin
    .from('orders')
    .select('id, buyer_id, seller_id, amount, listing_id')
    .eq('payment_status', 'paid')
    .eq('status', 'completed') // seller already confirmed
    .lt('proof_submitted_at', cutoff);

  if (error) {
    console.error('[cron/auto-complete-orders]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let completed = 0;
  for (const order of (timedOut ?? [])) {
    // Mark as delivered/fully complete
    await admin.from('orders').update({
      payment_status: 'delivered',
    }).eq('id', order.id);

    // Notify buyer
    await admin.from('notifications').insert({
      user_id: order.buyer_id,
      type: 'system',
      title: 'Order Auto-Completed',
      body: 'Your order was automatically marked as complete because the 72-hour confirmation window passed.',
      related_id: order.id,
    });

    // Fetch listing title for email
    const { data: listing } = await admin
      .from('listings').select('title').eq('id', order.listing_id).single();

    // Email seller
    await emailDeliveryConfirmed(order.seller_id, listing?.title ?? 'your listing', order.amount);

    completed++;
  }

  console.log(`[cron/auto-complete-orders] Auto-completed ${completed} orders`);
  return NextResponse.json({ completed });
}
