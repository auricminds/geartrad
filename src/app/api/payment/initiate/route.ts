import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/payment/initiate
 *
 * Creates a pending order, locks the listing, and returns the
 * seller's payment details so the buyer knows where to send money.
 */
export async function POST(req: NextRequest) {
  try {
    const { listingId, buyerId, paymentMethod } = await req.json() as {
      listingId: string;
      buyerId: string;
      paymentMethod: 'instapay' | 'vodafone' | 'orange' | 'usdt' | 'btc' | 'eth';
    };

    if (!listingId || !buyerId || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getAdmin();

    // 1. Fetch listing — must be available
    const { data: listing, error: listingErr } = await admin
      .from('listings')
      .select('id, price, is_available, seller_id, title')
      .eq('id', listingId)
      .single();

    if (listingErr || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    if (!listing.is_available) {
      return NextResponse.json({ error: 'Listing is no longer available' }, { status: 409 });
    }
    if (listing.seller_id === buyerId) {
      return NextResponse.json({ error: 'You cannot buy your own listing' }, { status: 400 });
    }

    // 2. Fetch seller's payment details for the chosen method
    const { data: seller } = await admin
      .from('profiles')
      .select('instapay_id, vodafone_number, orange_number, crypto_wallet_usdt, crypto_wallet_btc, crypto_wallet_eth')
      .eq('id', listing.seller_id)
      .single();

    const methodFieldMap: Record<string, string> = {
      instapay: 'instapay_id',
      vodafone: 'vodafone_number',
      orange:   'orange_number',
      usdt:     'crypto_wallet_usdt',
      btc:      'crypto_wallet_btc',
      eth:      'crypto_wallet_eth',
    };

    const fieldName = methodFieldMap[paymentMethod];
    const sellerDetails = seller as Record<string, string | null> | null;
    const paymentAddress = sellerDetails?.[fieldName] ?? null;

    if (!paymentAddress) {
      return NextResponse.json(
        { error: `Seller has not set up ${paymentMethod.toUpperCase()} payment details yet. Contact them via chat.` },
        { status: 422 },
      );
    }

    const platformFee = Math.round(listing.price * 0.05);
    const total = listing.price + platformFee;

    // 3. Create order (pending)
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .insert({
        listing_id: listingId,
        buyer_id: buyerId,
        seller_id: listing.seller_id,
        amount: total,
        platform_fee: platformFee,
        payment_method: paymentMethod,
        payment_status: 'pending',
        status: 'pending',
      })
      .select('id')
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // 4. Lock listing
    await admin.from('listings').update({ is_available: false }).eq('id', listingId);

    // 5. Notify seller of new pending order
    await admin.from('notifications').insert({
      user_id: listing.seller_id,
      type: 'sale',
      title: 'New Order Received',
      body: `A buyer has initiated purchase of "${listing.title}". Waiting for payment proof.`,
      related_id: order.id,
    });

    return NextResponse.json({
      orderId: order.id,
      total,
      platformFee,
      paymentAddress,
      paymentMethod,
    });
  } catch (err) {
    console.error('[payment/initiate]', err);
    return NextResponse.json({ error: 'Failed to initiate payment' }, { status: 500 });
  }
}
