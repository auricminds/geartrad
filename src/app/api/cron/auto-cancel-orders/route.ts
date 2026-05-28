import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailOrderCancelled } from '@/lib/email';

/**
 * GET /api/cron/auto-cancel-orders
 *
 * Runs every hour via Vercel cron.
 * Cancels orders stuck in "pending" payment status for > 24 hours
 * and re-opens the listing so other buyers can purchase.
 *
 * Vercel cron sends: Authorization: Bearer CRON_SECRET
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

  // Find orders pending for more than 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: stale, error } = await admin
    .from('orders')
    .select('id, listing_id, buyer_id, seller_id')
    .eq('payment_status', 'pending')
    .eq('status', 'pending')
    .lt('created_at', cutoff);

  if (error) {
    console.error('[cron/auto-cancel-orders]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let cancelled = 0;
  for (const order of (stale ?? [])) {
    // Cancel order
    await admin.from('orders').update({
      status: 'cancelled',
      payment_status: 'cancelled',
    }).eq('id', order.id);

    // Re-open listing
    await admin.from('listings')
      .update({ is_available: true })
      .eq('id', order.listing_id);

    // Notify buyer
    await admin.from('notifications').insert({
      user_id: order.buyer_id,
      type: 'system',
      title: 'Order Auto-Cancelled',
      body: 'Your order was cancelled because no payment proof was submitted within 24 hours. The listing is available again.',
      related_id: order.id,
    });

    // Fetch listing title for email
    const { data: listing } = await admin
      .from('listings').select('title').eq('id', order.listing_id).single();
    const title = listing?.title ?? 'a listing';

    // Email buyer
    await emailOrderCancelled(order.buyer_id, title, true);

    cancelled++;
  }

  console.log(`[cron/auto-cancel-orders] Cancelled ${cancelled} stale orders`);
  return NextResponse.json({ cancelled });
}
