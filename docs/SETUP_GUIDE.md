# GearTrad — Complete Setup Guide
### Everything you need to do manually, step by step
Last updated: April 2026

---

## STEP 1 — Supabase: Run the SQL Migrations

> Go to: supabase.com → your project → SQL Editor → New Query

Run each block separately, click Run after each one.

### 1A — Add payment columns to orders table
```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paymob_order_id TEXT,
  ADD COLUMN IF NOT EXISTS paymob_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS merchant_ref TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
```

### 1B — Add account credentials columns to listings table
```sql
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS account_email TEXT,
  ADD COLUMN IF NOT EXISTS account_password TEXT,
  ADD COLUMN IF NOT EXISTS account_extra_info TEXT;
```

### 1C — Hide credentials from public reads (RLS policy)
```sql
-- Only the seller can read their own credentials.
-- Buyers get credentials through the /api/orders/credentials endpoint (server-side).
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credentials_hidden_from_public"
ON listings
FOR SELECT
USING (
  account_email IS NULL
  OR seller_id = auth.uid()
);
```

### 1D — Add seller payout tracking
```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payout_at TIMESTAMPTZ;
```

---

## STEP 2 — Supabase: Upgrade to Pro

> Go to: supabase.com → your project → Settings → Billing → Upgrade to Pro ($25/month)

**Why you must do this before launch:**
- Free tier pauses your entire database after 7 days of inactivity
- Free tier only has 500MB storage (fills up fast with listings + messages)
- Pro gives you 8GB database, daily backups, no pausing, priority support

---

## STEP 3 — Supabase: Get Your Service Role Key

> Go to: supabase.com → your project → Settings → API

- Copy the **service_role** key (NOT the anon key)
- This key bypasses Row Level Security — never expose it in frontend code
- You will add it to Vercel in Step 5

---

## STEP 4 — Paymob: Create Your Account & Get API Keys

> Go to: accept.paymob.com → Create Account

### 4A — Register your business
1. Sign up with your business email
2. Go to Settings → Profile
3. Fill in: Business Name (GearTrad), Business Type (E-commerce/Marketplace), Phone, Address
4. Submit for verification (takes 1–3 business days)

### 4B — Get your API Key
1. Dashboard → Developers → API Keys
2. Copy your **API Key** — you will add it to Vercel

### 4C — Create Card Integration (Auth & Capture — CRITICAL)
1. Dashboard → Integrations → New Integration
2. Name: "GearTrad Card"
3. Type: **"Auth & Capture"** ← This is the escrow magic. NOT "Pay".
4. Currency: EGP
5. Save → copy the **Integration ID** (e.g. 123456)

### 4D — Create Mobile Wallet Integration (Vodafone Cash)
1. Dashboard → Integrations → New Integration
2. Name: "GearTrad Wallet"
3. Type: "Mobile Wallet"
4. Save → copy the **Integration ID** (different number from card)

### 4E — Enable International Cards
1. Go to your Card integration → Edit
2. Enable "Accept International Cards" checkbox
3. Save — now Visa/Mastercard from any country will work

### 4F — Create iFrame
1. Dashboard → iFrames → New iFrame
2. Name: "GearTrad Checkout"
3. Return URL (success): `https://yourdomain.com/en/orders`
4. Return URL (failure): `https://yourdomain.com/en/browse`
5. Save → copy the **iFrame ID** (e.g. 12345)

### 4G — Get HMAC Secret
1. Dashboard → Settings → Security Settings
2. Copy your **HMAC Secret** (used to verify webhook signatures)

### 4H — Set Webhook URL
1. Dashboard → Settings → Webhooks (or Transaction Notifications)
2. Set Transaction Processed URL to:
   `https://yourdomain.com/api/payment/paymob/webhook`
3. Save

---

## STEP 5 — Vercel: Add All Environment Variables

> Go to: vercel.com → GearTrad project → Settings → Environment Variables

Add each of these. For Environment, select: Production + Preview + Development.

| Variable Name | Where to get it | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | `eyJhbG...` |
| `PAYMOB_API_KEY` | Paymob → Developers → API Keys | `ZXlKaGJ...` |
| `PAYMOB_INTEGRATION_ID_CARD` | Paymob → Integrations → Card | `123456` |
| `PAYMOB_INTEGRATION_ID_WALLET` | Paymob → Integrations → Wallet | `123457` |
| `PAYMOB_IFRAME_ID` | Paymob → iFrames | `12345` |
| `PAYMOB_HMAC_SECRET` | Paymob → Settings → Security | `abc123...` |
| `NEXT_PUBLIC_SITE_URL` | Your domain | `https://geartrad.com` |
| `NEXT_PUBLIC_WALLET_BTC` | Your Bitcoin wallet address | `bc1q...` |
| `NEXT_PUBLIC_WALLET_USDT` | Your USDT TRC20 address | `TXxxx...` |
| `NEXT_PUBLIC_WALLET_ETH` | Your Ethereum address | `0x...` |

After adding all variables → click **Redeploy** (Deployments → latest → Redeploy)

---

## STEP 6 — Connect Your Domain (Cloudflare + Vercel)

### 6A — Buy the domain on Cloudflare
1. Go to: cloudflare.com → Create free account
2. Left sidebar → Domain Registration → Register Domains
3. Search for `geartrad.com` (or `geartrad.gg` for gaming feel)
4. Purchase (pay with card) — ~$10/year for .com, ~$20/year for .gg
5. Fill in your real contact info (legally required by ICANN)

### 6B — Add domain to Vercel
1. vercel.com → GearTrad → Settings → Domains
2. Click "Add Domain" → type `geartrad.com` → Add
3. Also add `www.geartrad.com` → Vercel handles the redirect
4. Vercel shows you DNS records to add (write them down — usually one A record + one CNAME)

### 6C — Point DNS on Cloudflare
1. Cloudflare → your domain → DNS → Records
2. Delete any existing A or CNAME records for @ and www
3. Add the records Vercel gave you:
   - Type: **A** | Name: **@** | Content: `76.76.21.21` | TTL: Auto | Proxy: **OFF (grey cloud)**
   - Type: **CNAME** | Name: **www** | Content: `cname.vercel-dns.com` | TTL: Auto | Proxy: **OFF (grey cloud)**
4. Wait 5–30 minutes → Vercel shows green checkmark on your domain

> ⚠ The Cloudflare proxy (orange cloud) must be OFF for Vercel domains. Vercel manages SSL itself.

---

## STEP 7 — Replace Crypto Wallet Addresses

> Open file: `src/components/checkout/CheckoutClient.tsx`

Find this section (around line 35):
```
const CRYPTO_ADDRESSES: Record<string, string> = {
  btc:  process.env.NEXT_PUBLIC_WALLET_BTC  ?? 'bc1qYOURBITCOINADDRESS',
  usdt: process.env.NEXT_PUBLIC_WALLET_USDT ?? 'TYOURUSDTTRC20ADDRESS',
  eth:  process.env.NEXT_PUBLIC_WALLET_ETH  ?? '0xYOUREthereumAddress',
};
```

Your wallet addresses are now set via environment variables in Step 5.
Make sure all three are added to Vercel. That's it.

---

## STEP 8 — Test the Full Payment Flow (Before Going Live)

Paymob gives you a test/sandbox mode.

1. Paymob → Dashboard → toggle to "Test" mode
2. Add test API key to Vercel as a separate env var (optional — or just test in production carefully)
3. Test card numbers (Paymob sandbox):
   - Card: `4987654321098769` | Expiry: any future | CVV: any 3 digits
   - Name: any
4. Make a test purchase on your site
5. Check: order appears in Supabase orders table with `payment_status = 'paid'`
6. Check: credentials appear on /orders page after payment
7. Confirm delivery → check `payment_status = 'delivered'` in Supabase
8. Switch back to Live mode when confirmed working

---

## STEP 9 — Set Up Seller Payouts

Right now, when a buyer confirms delivery, the money sits in your Paymob merchant balance.

**Manual payout (MVP approach):**
1. Paymob Dashboard → Balance → Withdraw
2. Transfer to your bank account
3. Then manually send the seller's share (amount - 5% fee) to their account

**Automated payout (when you scale):**
- Paymob has a "Split Payment" or "Payout" API
- Contact your Paymob account manager to enable it
- Then the capture endpoint can automatically split: 95% to seller, 5% to you

---

## STEP 10 — Final Checklist Before Launch

- [ ] All SQL migrations run in Supabase (Steps 1A–1D)
- [ ] Supabase upgraded to Pro (Step 2)
- [ ] Paymob account verified by Paymob team (Step 4A)
- [ ] Card integration set to "Auth & Capture" (Step 4C)
- [ ] All 12 environment variables added to Vercel (Step 5)
- [ ] Domain connected and showing green in Vercel (Step 6)
- [ ] Real crypto wallet addresses added to Vercel env vars (Step 5 + 7)
- [ ] Full payment test done in sandbox (Step 8)
- [ ] Seeded 10–20 real listings before opening to public
- [ ] Moderator account created and assigned `role = 'moderator'` in Supabase profiles table

---
*Setup guide generated for GearTrad — AuricMinds Group, April 2026*
