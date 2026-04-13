import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ─── HMAC verification ────────────────────────────────────────────────────────
// Paymob signs every webhook with HMAC-SHA512.
// Fields must be concatenated in this EXACT order (alphabetical by field name).
function verifyPaymobHmac(body: Record<string, unknown>): boolean {
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  if (!hmacSecret) return false;

  const obj = (body.obj ?? {}) as Record<string, unknown>;
  const sourceData = (obj.source_data ?? {}) as Record<string, unknown>;

  const fields = [
    String(obj.amount_cents ?? ''),
    String(obj.created_at ?? ''),
    String(obj.currency ?? ''),
    String(obj.error_occured ?? ''),
    String(obj.has_parent_transaction ?? ''),
    String(obj.id ?? ''),
    String(obj.integration_id ?? ''),
    String(obj.is_3d_secure ?? ''),
    String(obj.is_auth ?? ''),
    String(obj.is_capture ?? ''),
    String(obj.is_refunded ?? ''),
    String(obj.is_standalone_payment ?? ''),
    String(obj.is_voided ?? ''),
    String((obj.order as Record<string, unknown>)?.id ?? ''),
    String(obj.owner ?? ''),
    String(obj.pending ?? ''),
    String(sourceData.pan ?? ''),
    String(sourceData.sub_type ?? ''),
    String(sourceData.type ?? ''),
    String(obj.success ?? ''),
  ];

  const concatenated = fields.join('');
  const computed = createHmac('sha512', hmacSecret).update(concatenated).digest('hex');
  const received = String(body.hmac ?? '');

  // Constant-time comparison to prevent timing attacks
  if (computed.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // ── Verify signature ───────────────────────────────────────────────────────
  if (!verifyPaymobHmac(body)) {
    console.warn('[paymob/webhook] HMAC verification failed — possible spoofed request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const obj = (body.obj ?? {}) as Record<string, unknown>;
  const paymobOrderId = String((obj.order as Record<string, unknown>)?.id ?? '');
  const success = obj.success === true || obj.success === 'true';
  const pending = obj.pending === true || obj.pending === 'true';
  const transactionId = String(obj.id ?? '');

  // ── Find our order by Paymob order ID ─────────────────────────────────────
  const supabaseAdmin = getAdmin();
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, listing_id, buyer_id, seller_id, amount')
    .eq('paymob_order_id', paymobOrderId)
    .single();

  if (!order) {
    // Could be a duplicate or test webhook — acknowledge to prevent retries
    return NextResponse.json({ received: true });
  }

  const newStatus = success ? 'paid' : pending ? 'pending' : 'failed';

  // ── Update order status ────────────────────────────────────────────────────
  await supabaseAdmin
    .from('orders')
    .update({ payment_status: newStatus, paymob_transaction_id: transactionId })
    .eq('id', order.id);

  // ── If paid: mark listing as sold + notify seller ─────────────────────────
  if (success) {
    await Promise.all([
      supabaseAdmin
        .from('listings')
        .update({ is_available: false })
        .eq('id', order.listing_id),

      supabaseAdmin.from('notifications').insert({
        user_id: order.seller_id,
        type: 'sale',
        title: 'New Sale 🎉',
        body: `Your listing was purchased. Payment is held in escrow until the buyer confirms delivery.`,
        related_id: order.id,
        is_read: false,
      }),
    ]);
  }

  return NextResponse.json({ received: true });
}
