import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/auth-server';

/**
 * POST /api/orders/rate
 *
 * Buyer submits a 1–5 star rating for a completed order.
 * Updates the seller's overall rating (average of all ratings).
 */
export async function POST(req: NextRequest) {
  try {
    const sessionUserId = await getSessionUserId(req);
    if (!sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, buyerId, rating, comment } = await req.json() as {
      orderId: string;
      buyerId: string;
      rating: number;
      comment?: string;
    };

    if (!orderId || !buyerId || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (sessionUserId !== buyerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Verify order is completed and belongs to this buyer
    const { data: order, error } = await admin
      .from('orders')
      .select('id, buyer_id, seller_id, status, payment_status, buyer_rating')
      .eq('id', orderId)
      .eq('buyer_id', buyerId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.status !== 'completed' && order.payment_status !== 'paid' && order.payment_status !== 'delivered') {
      return NextResponse.json({ error: 'Can only rate completed orders' }, { status: 409 });
    }
    if (order.buyer_rating !== null) {
      return NextResponse.json({ error: 'You have already rated this order' }, { status: 409 });
    }

    // Save rating on the order
    await admin.from('orders').update({
      buyer_rating: rating,
      buyer_comment: comment?.trim() ?? null,
    }).eq('id', orderId);

    // Recalculate seller's average rating from all rated orders
    const { data: allRatings } = await admin
      .from('orders')
      .select('buyer_rating')
      .eq('seller_id', order.seller_id)
      .not('buyer_rating', 'is', null);

    const ratings = (allRatings ?? []).map((r: { buyer_rating: number }) => r.buyer_rating);
    const avg = ratings.length
      ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
      : rating;

    await admin.from('profiles').update({ rating: avg }).eq('id', order.seller_id);

    // Notify seller of the new rating
    await admin.from('notifications').insert({
      user_id: order.seller_id,
      type: 'sale',
      title: `New Rating: ${rating}/5 ⭐`,
      body: comment?.trim()
        ? `Buyer left a ${rating}/5 review: "${comment.trim().slice(0, 80)}"`
        : `A buyer rated your service ${rating}/5.`,
      related_id: orderId,
    });

    return NextResponse.json({ success: true, newAvgRating: avg });
  } catch (err) {
    console.error('[orders/rate]', err);
    return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 });
  }
}
