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
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
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

    // Update seller's total_sales count
    const { count: completedCount } = await admin
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', order.seller_id)
      .in('payment_status', ['paid', 'delivered']);
    if (completedCount !== null) {
      await admin.from('profiles')
        .update({ total_sales: completedCount })
        .eq('id', order.seller_id);
    }

    // Fetch listing title for notifications/email
    const { data: listing } = await admin
      .from('listings').select('title').eq('id', order.listing_id).single();
    const listingTitle = listing?.title ?? 'your listing';

    // Notify buyer
    await admin.from('notifications').insert({
      user_id: order.buyer_id,
      type: 'system',
      title: 'Order Auto-Completed',
      body: `Your order for "${listingTitle}" was automatically marked as complete because the 72-hour confirmation window passed.`,
      related_id: order.id,
    });

    // Notify seller
    await admin.from('notifications').insert({
      user_id: order.seller_id,
      type: 'sale',
      title: 'Trade Auto-Completed',
      body: `"${listingTitle}" was automatically marked as complete. The buyer did not dispute within 72 hours.`,
      related_id: order.id,
    });

    // Email seller
    await emailDeliveryConfirmed(order.seller_id, listingTitle, order.amount);

    completed++;
  }

  console.log(`[cron/auto-complete-orders] Auto-completed ${completed} orders`);
  return NextResponse.json({ completed });
}
