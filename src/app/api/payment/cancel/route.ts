import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailOrderCancelled } from '@/lib/email';
import { getSessionUserId } from '@/lib/auth-server';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/payment/cancel
 *
 * Cancels a pending or proof_submitted order.
 * Re-lists the listing so other buyers can purchase.
 * Can be called by buyer, seller, or moderator.
 */
export async function POST(req: NextRequest) {
  try {
    const sessionUserId = await getSessionUserId(req);
    if (!sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, userId } = await req.json() as {
      orderId: string;
      userId: string;
    };

    if (!orderId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (sessionUserId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = getAdmin();

    // Fetch order — must belong to buyer or seller
    const { data: order, error } = await admin
      .from('orders')
      .select('id, buyer_id, seller_id, payment_status, status, listing_id')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check caller is buyer or seller or moderator
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    const isMod = ['moderator', 'admin'].includes(callerProfile?.role ?? '');
    const isParty = order.buyer_id === userId || order.seller_id === userId;

    if (!isParty && !isMod) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Can only cancel orders that haven't been completed
    if (order.status === 'completed') {
      return NextResponse.json({ error: 'Cannot cancel a completed order' }, { status: 409 });
    }

    // Cancel the order
    await admin.from('orders').update({
      status: 'cancelled',
      payment_status: 'cancelled',
    }).eq('id', orderId);

    // Re-list the listing
    await admin.from('listings').update({ is_available: true }).eq('id', order.listing_id);

    // Fetch listing title
    const { data: listing } = await admin
      .from('listings')
      .select('title')
      .eq('id', order.listing_id)
      .single();

    const title = listing?.title ?? 'the listing';

    // Notify both parties
    const notifications = [
      {
        user_id: order.buyer_id,
        type: 'system',
        title: 'Order Cancelled',
        body: `Your order for "${title}" has been cancelled. The listing is now available again.`,
        related_id: orderId,
      },
      {
        user_id: order.seller_id,
        type: 'system',
        title: 'Order Cancelled',
        body: `The order for "${title}" was cancelled. Your listing is back to active.`,
        related_id: orderId,
      },
    ].filter((n) => n.user_id !== userId); // don't notify the person who cancelled

    if (notifications.length > 0) {
      await admin.from('notifications').insert(notifications);
    }

    // Email both parties (fire-and-forget)
    if (order.buyer_id !== userId) {
      emailOrderCancelled(order.buyer_id, title, true).catch(() => {});
    }
    if (order.seller_id !== userId) {
      emailOrderCancelled(order.seller_id, title, false).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[payment/cancel]', err);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
