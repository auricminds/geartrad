import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/auth-server';
import { safeDecrypt } from '@/lib/crypto';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * GET /api/orders/credentials?orderId=xxx&buyerId=xxx
 *
 * Returns account credentials ONLY if:
 *  1. The caller is the buyer of this order
 *  2. Payment has been confirmed (payment_status = 'paid' or 'delivered')
 *
 * Credentials are NEVER returned publicly — this is the only place they're exposed.
 */
export async function GET(req: NextRequest) {
  const sessionUserId = await getSessionUserId(req);
  if (!sessionUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  const admin = getAdmin();

  // Verify order belongs to the authenticated buyer AND payment is confirmed.
  // Use sessionUserId directly — never trust a buyerId param from the request.
  const { data: order, error } = await admin
    .from('orders')
    .select('id, buyer_id, payment_status, status, listing_id')
    .eq('id', orderId)
    .eq('buyer_id', sessionUserId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const isPaid =
    order.payment_status === 'paid' ||
    order.payment_status === 'delivered' ||
    order.status === 'completed';

  if (!isPaid) {
    return NextResponse.json(
      { error: 'Credentials are only available after payment is confirmed.' },
      { status: 403 },
    );
  }

  // Fetch credentials from the listing (these columns are NOT in public getListing queries)
  const { data: listing, error: listingErr } = await admin
    .from('listings')
    .select('account_email, account_password, account_extra_info')
    .eq('id', order.listing_id)
    .single();

  if (listingErr || !listing) {
    return NextResponse.json({ error: 'Credentials not found' }, { status: 404 });
  }

  if (!listing.account_email && !listing.account_password) {
    return NextResponse.json({ error: 'No credentials stored for this listing' }, { status: 404 });
  }

  return NextResponse.json({
    account_email:      safeDecrypt(listing.account_email),
    account_password:   safeDecrypt(listing.account_password),
    account_extra_info: safeDecrypt(listing.account_extra_info),
  });
}
