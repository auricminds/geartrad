# GearTrad — Complete Setup Guide
### Everything you need to do manually, step by step
Last updated: April 2026

---

## STEP 0 — Before You Start: What Paymob Will Ask For

> Read this entire section before creating your Paymob account.
> Gather everything listed here first — the application is much smoother when you have it all ready.

Paymob is licensed by the Central Bank of Egypt. They are legally required to verify who they're giving a payment terminal to. This is a one-time process and usually takes 1–5 business days.

---

### 0A — Choose Your Registration Type

**Option 1: Individual / Sole Trader (أفراد)**
Use this if you don't have a company registered yet. Most common for startups at this stage.

**Option 2: Company (شركة)**
Use this if you have a registered LLC or S.A.E. in Egypt. Looks more professional and allows higher transaction limits.

> Recommendation: Start as Individual if you don't have a company yet. You can upgrade later.

---

### 0B — Documents You Must Have Ready (Individual)

Gather these before starting the Paymob application:

| # | What | Details |
|---|---|---|
| 1 | **National ID (الرقم القومي)** | Front + back photo, clear and unblurred. Must be valid (not expired). |
| 2 | **National ID Number** | The 14-digit number on the front of the card. |
| 3 | **Personal Phone Number** | Must be registered in your name (Vodafone/Etisalat/Orange/We). This is used for OTP verification. |
| 4 | **Personal Email Address** | Must be one you actively use — Paymob sends all payment notifications here. |
| 5 | **Bank Account IBAN** | See Section 0D below — this is where Paymob sends your money. |
| 6 | **Bank Account Holder Name** | Must exactly match the name on your National ID. |
| 7 | **Website URL** | `https://geartrad.com` (or your Vercel URL if domain not ready yet). |
| 8 | **Business Description** | Short paragraph explaining what GearTrad does (see template below). |
| 9 | **Expected Monthly Volume** | Estimate conservatively — e.g. "Under 50,000 EGP/month initially". |

---

### 0C — Documents You Must Have Ready (Company — if applicable)

If you have or will register a company, Paymob needs all of the above PLUS:

| # | What | Details |
|---|---|---|
| 1 | **Commercial Registration (سجل تجاري)** | Official document from GAFI or Shahr El-Aqari. Photo or scan of all pages. |
| 2 | **Tax Card (البطاقة الضريبية)** | Issued by Egyptian Tax Authority. Both sides. |
| 3 | **Company Bank Account** | Must be in the company name, not personal. |
| 4 | **Company Bank Account IBAN** | See Section 0D. |
| 5 | **Authorized Signatory National ID** | Your ID as the person signing on behalf of the company. |
| 6 | **Articles of Association (عقد تأسيس الشركة)** | May be requested for higher-volume merchants. |

---

### 0D — How to Get Your Bank IBAN (Required for Payouts)

Your IBAN is your Egyptian bank account number in international format. Paymob will wire your earnings here.

**How to find your IBAN:**

**Option 1 — Mobile App (fastest)**
- Open your bank's app (CIB, NBE, Banque Misr, QNB, Alex Bank, etc.)
- Go to: My Accounts → Account Details → IBAN
- It starts with `EG` followed by 27 numbers. Example: `EG380019000500000012345180002`

**Option 2 — ATM**
- Insert card → Account Services → Account Details → IBAN

**Option 3 — Bank Branch**
- Walk into any branch of your bank
- Say: "أنا عايز رقم الـ IBAN بتاع حسابي"
- They'll print it for you immediately

**Important rules about your bank account:**
- Must be an Egyptian Pound (EGP) account
- Must be in YOUR name (matching your National ID exactly)
- Can be any Egyptian bank — CIB, NBE, Banque Misr, Faisal, QNB, HSBC Egypt, etc.
- Savings account OR current account both work
- Vodafone Cash alone is NOT enough — you need an actual bank account

**Other bank info Paymob may ask for:**
- Bank Name (e.g. "Commercial International Bank — CIB")
- Branch Name/Address (the branch where your account is registered)
- Account Number (the shorter number, usually 10–16 digits — different from IBAN)
- Swift Code (for your bank, e.g. CIB Egypt Swift: `CIBEEGCX`)

**Common Egyptian Bank Swift Codes:**
| Bank | Swift Code |
|---|---|
| CIB (Commercial International Bank) | `CIBEEGCX` |
| NBE (National Bank of Egypt) | `NBEGEGCX` |
| Banque Misr | `BMISEGCX` |
| QNB Al Ahli | `QNBAEGCX` |
| Alex Bank (Alexandria) | `ALEXEGCX` |
| HSBC Egypt | `BARCEGCX` |
| Faisal Islamic Bank | `FAIBEGCA` |
| Arab African International Bank | `ARAIEGCX` |

---

### 0E — Business Description Template

When Paymob asks "What does your business do?", use this:

> "GearTrad is an online peer-to-peer marketplace for buying and selling gaming accounts, in-game items, skins, and digital assets. We serve the Egyptian and MENA gaming community. All transactions are protected by an escrow system — buyer funds are held until delivery is confirmed. We process payments between buyers and sellers and take a 5% platform commission. Monthly volume is expected to be under [X] EGP initially."

---

### 0F — What Paymob Does With This Information

- **National ID**: KYC (Know Your Customer) verification — legally required by CBE
- **Bank account**: Where your earnings are deposited (after deducting their fees)
- **Website**: They verify your business is real and your website is live
- **Business description**: They classify your merchant category (MCC code) — affects transaction limits

**After approval you receive:**
- Your API Key
- Integration IDs for each payment method
- A Paymob account manager contact (very useful — save their number)
- Access to the full merchant dashboard

---

### 0G — Paymob Transaction Limits (Know These)

| Category | Individual Merchant | Company Merchant |
|---|---|---|
| Single transaction max | 30,000 EGP | 100,000 EGP |
| Daily limit | 150,000 EGP | Negotiable |
| Monthly limit | Negotiable | Negotiable |

> If any of your gaming accounts sell for more than 30,000 EGP as an Individual merchant, you'll need to register as a Company or request a limit increase from your Paymob account manager.

---

### 0H — Timeline Expectations

| Step | Expected Time |
|---|---|
| Create Paymob account | 5 minutes |
| Submit documents | 10–15 minutes |
| Paymob reviews application | 1–5 business days |
| Get API keys and go live | Same day as approval |
| First payout to your bank | 3–7 business days after transaction |

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
