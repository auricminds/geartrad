import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailProofSubmitted } from '@/lib/email';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST /api/payment/submit-proof
 *
 * Buyer submits payment proof (screenshot URL or tx hash).
 * Moves order to proof_submitted status and notifies the seller.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId, buyerId, proofUrl, reference } = await req.json() as {
      orderId: string;
      buyerId: string;
      proofUrl?: string;   // screenshot URL (uploaded to Supabase storage)
      reference?: string;  // tx hash (crypto) or transfer reference (local)
    };

    if (!orderId || !buyerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!proofUrl && !reference) {
      return NextResponse.json({ error: 'Provide a proof screenshot or transaction reference' }, { status: 400 });
    }

    const admin = getAdmin();

    // Verify order belongs to this buyer and is in pending state
    const { data: order, error } = await admin
      .from('orders')
      .select('id, buyer_id, seller_id, payment_status, listing_id')
      .eq('id', orderId)
      .eq('buyer_id', buyerId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.payment_status !== 'pending') {
      return NextResponse.json({ error: 'Proof already submitted for this order' }, { status: 409 });
    }

    // Update order with proof
    await admin.from('orders').update({
      payment_status: 'proof_submitted',
      payment_proof_url: proofUrl ?? null,
      payment_reference: reference ?? null,
      proof_submitted_at: new Date().toISOString(),
    }).eq('id', orderId);

    // Fetch listing title for notification
    const { data: listing } = await admin
      .from('listings')
      .select('title')
      .eq('id', order.listing_id)
      .single();

    // Notify seller to confirm payment
    await admin.from('notifications').insert({
      user_id: order.seller_id,
      type: 'sale',
      title: 'Payment Proof Submitted',
      body: `Buyer has sent payment proof for "${listing?.title ?? 'your listing'}". Please review and confirm receipt.`,
      related_id: orderId,
    });
    emailProofSubmitted(order.seller_id, listing?.title ?? 'your listing', reference ?? null, proofUrl ?? null).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[payment/submit-proof]', err);
    return NextResponse.json({ error: 'Failed to submit proof' }, { status: 500 });
  }
}
