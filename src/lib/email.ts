/**
 * GearTrad email notifications via Resend.
 * Set RESEND_API_KEY in .env.local / Vercel env vars.
 * If the key is missing, emails are silently skipped.
 *
 * From address: set RESEND_FROM_EMAIL (default: noreply@geartrad.com)
 * You must verify the domain in Resend dashboard first.
 */
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'GearTrad <noreply@geartrad.com>';
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geartrad.com';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const admin = getAdmin();
    const { data } = await admin.auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

async function send(to: string, subject: string, html: string) {
  const resend = getResend();
  if (!resend) return; // no key configured — skip silently
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (e) {
    console.error('[email] send failed:', e);
  }
}

// ─── Templates ──────────────────────────────────────────────────────────────

function layout(body: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; background: #0e0e14; color: #e2e2e8; margin: 0; padding: 0; }
  .wrap { max-width: 520px; margin: 32px auto; background: #1a1a26; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a3a; }
  .header { background: #7c3aed; padding: 24px 28px; }
  .header h1 { margin: 0; font-size: 22px; color: #fff; }
  .header p  { margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.7); }
  .body   { padding: 28px; }
  .btn    { display: inline-block; background: #7c3aed; color: #fff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 20px; }
  .box    { background: #0e0e14; border: 1px solid #2a2a3a; border-radius: 10px; padding: 16px; margin: 16px 0; }
  .label  { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .value  { font-size: 15px; color: #e2e2e8; margin-top: 4px; font-weight: 600; }
  .muted  { color: #888; font-size: 13px; margin-top: 20px; }
  .footer { padding: 20px 28px; border-top: 1px solid #2a2a3a; font-size: 11px; color: #555; }
</style></head>
<body><div class="wrap">${body}
<div class="footer">GearTrad — The #1 Gaming Marketplace in Egypt &amp; Gulf<br>
<a href="${BASE}" style="color:#7c3aed;">${BASE.replace('https://', '')}</a></div>
</div></body></html>`;
}

// ─── Exported helpers ────────────────────────────────────────────────────────

export async function emailNewOrder(sellerId: string, listingTitle: string, amount: number, paymentMethod: string) {
  const email = await getUserEmail(sellerId);
  if (!email) return;
  await send(email, 'New Order Received — GearTrad', layout(`
<div class="header"><h1>💰 New Order</h1><p>A buyer wants your listing</p></div>
<div class="body">
  <p>Someone just placed an order for your listing. Go to your dashboard to review the payment proof once they submit it.</p>
  <div class="box">
    <div class="label">Listing</div><div class="value">${listingTitle}</div>
    <div class="label" style="margin-top:12px">Amount</div><div class="value">${amount.toLocaleString()} EGP</div>
    <div class="label" style="margin-top:12px">Payment Method</div><div class="value" style="text-transform:capitalize">${paymentMethod}</div>
  </div>
  <p>The buyer will send you payment directly and submit proof. You'll get another email when proof is submitted.</p>
  <a class="btn" href="${BASE}/en/dashboard">View Dashboard →</a>
  <p class="muted">Do not release any account details until you've confirmed the payment arrived in your account.</p>
</div>`));
}

export async function emailProofSubmitted(sellerId: string, listingTitle: string, reference: string | null, proofUrl: string | null) {
  const email = await getUserEmail(sellerId);
  if (!email) return;
  await send(email, 'Payment Proof Submitted — Action Required', layout(`
<div class="header"><h1>⚡ Proof Submitted</h1><p>Buyer needs your confirmation</p></div>
<div class="body">
  <p>The buyer has submitted payment proof for <strong>${listingTitle}</strong>. Please verify the payment arrived in your account, then confirm.</p>
  ${reference ? `<div class="box"><div class="label">Reference / TX ID</div><div class="value" style="font-family:monospace;font-size:13px">${reference}</div></div>` : ''}
  ${proofUrl ? `<div class="box"><div class="label">Screenshot</div><div class="value"><a href="${proofUrl}" style="color:#7c3aed">View proof image →</a></div></div>` : ''}
  <p>Once you verify the money is in your account, click <strong>Confirm Payment Received</strong> in your dashboard to release the credentials to the buyer.</p>
  <a class="btn" href="${BASE}/en/dashboard">Confirm in Dashboard →</a>
  <p class="muted">⚠ Only confirm after you have personally verified the money arrived. Do not confirm without checking.</p>
</div>`));
}

export async function emailCredentialsAvailable(buyerId: string, listingTitle: string) {
  const email = await getUserEmail(buyerId);
  if (!email) return;
  await send(email, 'Credentials Available — Your Purchase is Ready', layout(`
<div class="header"><h1>🔓 Credentials Unlocked</h1><p>Your account is ready</p></div>
<div class="body">
  <p>The seller has confirmed receipt of your payment for <strong>${listingTitle}</strong>. Your account credentials are now available.</p>
  <a class="btn" href="${BASE}/en/orders">View My Orders →</a>
  <div class="box">
    <div class="label">Next Steps</div>
    <ol style="margin:8px 0 0;padding-left:20px;color:#aaa;font-size:13px;line-height:1.8">
      <li>Go to My Orders</li>
      <li>Click <strong style="color:#e2e2e8">Reveal Credentials</strong></li>
      <li>Log in to the account</li>
      <li>Test that everything works</li>
      <li>Click <strong style="color:#e2e2e8">Confirm Delivery</strong> once satisfied</li>
    </ol>
  </div>
  <p class="muted">You have 72 hours to test and confirm delivery. If there is an issue, open a dispute from My Orders before confirming.</p>
</div>`));
}

export async function emailDeliveryConfirmed(sellerId: string, listingTitle: string, amount: number) {
  const email = await getUserEmail(sellerId);
  if (!email) return;
  await send(email, 'Trade Complete — Buyer Confirmed Delivery', layout(`
<div class="header"><h1>✅ Trade Complete</h1><p>The buyer confirmed delivery</p></div>
<div class="body">
  <p>The buyer has confirmed they received and tested the account for <strong>${listingTitle}</strong>. The trade is fully complete.</p>
  <div class="box">
    <div class="label">You Earned</div><div class="value">${amount.toLocaleString()} EGP</div>
  </div>
  <p>The money was sent directly to you — this is just a confirmation that the buyer is happy. Your total sales count has been updated.</p>
  <a class="btn" href="${BASE}/en/dashboard">View Dashboard →</a>
</div>`));
}

export async function emailOrderCancelled(userId: string, listingTitle: string, isBuyer: boolean) {
  const email = await getUserEmail(userId);
  if (!email) return;
  await send(email, 'Order Cancelled — GearTrad', layout(`
<div class="header"><h1>❌ Order Cancelled</h1><p>The trade did not complete</p></div>
<div class="body">
  <p>${isBuyer ? 'Your order' : 'An order for your listing'} <strong>${listingTitle}</strong> has been cancelled. ${isBuyer ? 'The listing is available again if you wish to try again.' : 'Your listing is now active again and available for other buyers.'}</p>
  <a class="btn" href="${BASE}/en/${isBuyer ? 'browse' : 'dashboard'}">${isBuyer ? 'Browse Listings →' : 'View Dashboard →'}</a>
  <p class="muted">If you believe this was an error, please open a support ticket.</p>
</div>`));
}
