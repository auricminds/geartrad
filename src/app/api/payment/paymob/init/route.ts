import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy — only instantiated at request time (env vars unavailable at build time)
function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const PAYMOB_BASE = 'https://accept.paymob.com/api';

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
  });
  if (!res.ok) throw new Error('Paymob auth failed');
  const data = await res.json();
  return data.token as string;
}

async function createPaymobOrder(token: string, amountCents: number, merchantRef: string) {
  const res = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      auth_token: token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: 'EGP',
      merchant_order_id: merchantRef,
      items: [],
    }),
  });
  if (!res.ok) throw new Error('Paymob order creation failed');
  return res.json();
}

async function getPaymentKey(
  token: string,
  orderId: number,
  amountCents: number,
  integrationId: number,
  billingData: Record<string, string>,
) {
  const res = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      auth_token: token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: billingData,
      currency: 'EGP',
      integration_id: integrationId,
      lock_order_when_paid: true,
    }),
  });
  if (!res.ok) throw new Error('Paymob payment key failed');
  const data = await res.json();
  return data.token as string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, buyerId, paymentMethod, amount, platformFee, buyerEmail, buyerPhone } = body as {
      listingId: string;
      buyerId: string;
      paymentMethod: 'card' | 'vodafone';
      amount: number;         // in EGP piastres (amount × 100)
      platformFee: number;
      buyerEmail: string;
      buyerPhone?: string;
    };

    // Basic validation
    if (!listingId || !buyerId || !paymentMethod || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const amountCents = Math.round(amount * 100);
    const merchantRef = `gt-${listingId}-${Date.now()}`;

    // 1. Auth
    const authToken = await getAuthToken();

    // 2. Create order in Paymob
    const paymobOrder = await createPaymobOrder(authToken, amountCents, merchantRef);

    // 3. Choose integration ID based on method
    const integrationId =
      paymentMethod === 'vodafone'
        ? parseInt(process.env.PAYMOB_INTEGRATION_ID_WALLET!, 10)
        : parseInt(process.env.PAYMOB_INTEGRATION_ID_CARD!, 10);

    const billingData = {
      apartment: 'NA',
      email: buyerEmail ?? 'buyer@geartrad.com',
      floor: 'NA',
      first_name: 'GearTrad',
      last_name: 'Buyer',
      street: 'NA',
      building: 'NA',
      phone_number: buyerPhone ?? '+201000000000',
      shipping_method: 'NA',
      postal_code: 'NA',
      city: 'Cairo',
      country: 'EG',
      state: 'Cairo',
    };

    // 4. Get payment key
    const paymentKey = await getPaymentKey(authToken, paymobOrder.id, amountCents, integrationId, billingData);

    // 5. Persist a pending order row in our DB
    const supabaseAdmin = getAdmin();
    const { data: order } = await supabaseAdmin
      .from('orders')
      .insert({
        listing_id: listingId,
        buyer_id: buyerId,
        amount,
        platform_fee: platformFee,
        payment_method: paymentMethod,
        payment_status: 'pending',
        paymob_order_id: String(paymobOrder.id),
        merchant_ref: merchantRef,
      })
      .select('id')
      .single();

    // 6. Return the data the client needs to redirect to Paymob
    const iframeId = process.env.PAYMOB_IFRAME_ID;

    return NextResponse.json({
      paymentKey,
      orderId: order?.id,
      // For card payments: embed or redirect to this URL
      checkoutUrl: `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`,
      // For wallet payments: client must call /pay endpoint with phone + paymentKey
      paymobOrderId: paymobOrder.id,
    });
  } catch (err) {
    console.error('[paymob/init]', err);
    return NextResponse.json({ error: 'Payment initialization failed. Please try again.' }, { status: 500 });
  }
}
