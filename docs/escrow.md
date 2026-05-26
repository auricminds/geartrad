# GearTrad — Escrow System & Payment Security

> **How GearTrad protects both buyers and sellers on every trade.**

---

## What Is Escrow on GearTrad?

GearTrad uses **credential escrow** — the game account login details are locked inside the platform and are only released to the buyer *after* the seller confirms the payment was received. The money itself travels directly between buyer and seller via their chosen payment method (Vodafone Cash, InstaPay, PayPal, USDT, etc.), but the goods (the account credentials) are never handed over until payment is confirmed.

This is different from a traditional money escrow where a middleman holds funds. GearTrad holds the *product*, not the money — which makes the system practical for peer-to-peer digital goods trading without needing a payment processor license.

---

## How a Complete Trade Works (Step by Step)

### 1. Seller Lists the Account
- Seller fills in the listing form including the account's **email, password, and any extra login info**.
- These credentials are **stored encrypted** and are never shown publicly.
- The seller also sets which **payment methods** they accept (Vodafone Cash, InstaPay, PayPal, USDT, BTC, etc.).

### 2. Buyer Initiates the Purchase
- Buyer goes to checkout and selects one of the seller's accepted payment methods.
- The system creates a **pending order** and **locks the listing** (marks it unavailable so no one else can buy it simultaneously).
- The buyer is shown the seller's payment details for the chosen method (phone number, wallet address, PayPal email, etc.).

### 3. Buyer Sends the Money (Off-Platform)
- The buyer manually transfers the exact listing price to the seller's payment address.
- No money goes through GearTrad — it's a direct transfer between buyer and seller.
- This is why **no platform fee is charged** — GearTrad doesn't touch the money.

### 4. Buyer Submits Payment Proof
- After sending, the buyer submits:
  - A **reference number / transaction ID**, and/or
  - A **screenshot** of the payment confirmation.
- The order status moves to `proof_submitted`.
- The seller receives a notification to review the proof.

### 5. Seller Confirms Receipt
- The seller checks their wallet/account and verifies the money arrived.
- Seller clicks **"Confirm Payment Received"** in the seller dashboard.
- The order moves to `paid` / `completed` status.
- The buyer's **account credentials are unlocked** and available in My Orders.

### 6. Buyer Confirms Delivery
- The buyer logs in to the account, tests it, and verifies everything is as described.
- Buyer clicks **"Confirm Delivery"** within the 72-hour window.
- The order is marked fully `delivered` / `completed`.
- The seller's `total_sales` counter increments and their rating reflects the trade.

---

## The 72-Hour Confirmation Window

After the seller confirms payment, the buyer has **72 hours** to:
- Test the account
- Confirm delivery, **or**
- Open a dispute if something is wrong

If the window expires without buyer action, the order is still considered complete (seller confirmed payment, credentials were delivered). This protects sellers from buyers who receive the account but never close the order.

---

## What Happens If There's a Problem?

### Seller doesn't confirm payment within 24 hours:
→ The buyer can open a **support ticket** (dispute) from My Orders.  
→ The moderation team reviews the proof and can manually release or cancel the order.

### Account credentials don't work / account not as described:
→ The buyer opens a dispute **before** confirming delivery.  
→ Moderation team investigates. If the seller provided false info, the order is cancelled and the seller is penalized (possible ban).  
→ The buyer is advised to seek a refund directly from the seller since money transferred directly.

### Buyer doesn't test the account and confirms delivery:
→ Once confirmed, the trade is final. GearTrad cannot intervene after the buyer clicks Confirm Delivery.

---

## Why There Is No Platform Fee

GearTrad does not charge a platform fee because:

1. **No payment processing** — money goes directly between buyer and seller. There is nothing to take a cut from at the platform level.
2. **Trust-based growth** — in the early stage, keeping it zero-fee helps attract the first sellers and buyers.
3. **Volume over margin** — the goal is to build the largest gaming marketplace in Egypt and Gulf. Revenue will come from **listing boosts** (sellers pay to promote their listings), not from transaction fees.

Future monetization: Listing boosts (50 EGP/week, 150 EGP/month) are the current revenue model.

---

## Payment Security Summary

| What GearTrad Protects | How |
|---|---|
| Account credentials | Encrypted in DB, only released after seller confirms payment |
| Listing availability | Locked the moment a buyer initiates purchase — no double-selling |
| Payment proof | Screenshot/reference stored and linked to order permanently |
| Dispute trail | Every order state change is logged (pending → proof_submitted → paid → delivered) |
| Seller identity | Seller must have a verified profile to list |

| What GearTrad Cannot Guarantee | Why |
|---|---|
| Money refund if seller is unresponsive | Funds are sent directly — GearTrad cannot reverse a bank transfer |
| Account ban after purchase | Game companies ban trading — buyer accepts this risk at checkout |
| Accuracy of account description | Seller provides info; buyers dispute via support if it's wrong |

---

## Current Order Status Flow

```
[Order Created]
     ↓
  pending          ← buyer has been shown seller's payment details
     ↓
proof_submitted    ← buyer submitted payment screenshot/reference
     ↓
  paid             ← seller confirmed payment received → credentials unlocked
     ↓
  delivered        ← buyer confirmed the account works
     ↓
  completed        ← trade fully closed

Alternate paths:
  cancelled  ← order cancelled before proof submitted
  refunded   ← moderation team cancelled after dispute
  disputed   ← under active moderation review
  failed     ← payment initiation failed
```

---

## What's Missing / Still Needs to Be Built

The following features are **not yet implemented** and are needed for the platform to be fully production-ready:

### Critical (Must Have Before Scale)

| # | Feature | Why It Matters |
|---|---|---|
| 1 | **Auto-cancel unpaid orders** | If a buyer initiates an order but never submits proof within X hours, the listing stays locked forever. Need a cron job to auto-cancel and re-open the listing. |
| 2 | **Email / push notifications** | Buyers and sellers have no way to know about order updates unless they check the dashboard. Need email or push for: new order, proof submitted, payment confirmed. |
| 3 | **Dispute resolution workflow** | Currently disputes are just support tickets. Mods need a proper tool: view proof, view order history, issue refund, ban seller — all from one screen. |
| 4 | **Seller payout confirmation** | No way for a seller to mark "I received the money" and show what payment method was used. The confirm button says "I received it" but the evidence isn't attached to the order. |
| 5 | **Re-open listing on order cancel** | When an order is cancelled/refunded, the listing should automatically go back to `is_available = true` so it can be purchased again. |

### Important (Needed for Trust at Scale)

| # | Feature | Why It Matters |
|---|---|---|
| 6 | **Seller rating system** | After a completed trade, buyer should be prompted to rate the seller (1–5 stars). Currently `rating` is on the profile but there's no way to submit a rating. |
| 7 | **Order timeout cron** | 72-hour buyer confirmation window exists in UI but is not enforced in the backend. Need a cron to auto-complete orders after 72 hours if buyer hasn't acted. |
| 8 | **Buyer verification (KYC-light)** | Sellers are at risk of chargebacks on PayPal if buyers are anonymous. A simple ID verification step for buyers adds accountability. |
| 9 | **Chat linked to active order** | Currently chat and orders are separate. Buyers/sellers need to be able to message each other within an active order without navigating separately. |
| 10 | **Admin panel: order management** | Admins need to see all orders, filter by status, see proof images, and manually confirm/cancel from an admin dashboard. |

### Nice to Have

| # | Feature | Why It Matters |
|---|---|---|
| 11 | **Price in multiple currencies** | Buyers from Gulf see prices in EGP. Should detect or allow currency switching (EGP / SAR / AED). |
| 12 | **Bulk listing management** | Sellers with many listings need to update availability, price, or delete in bulk. |
| 13 | **Discord server integration** | Auto-post new boosted listings to Discord `#listings-showcase` channel. |
| 14 | **Repeat buyer discount** | Sellers can offer a discount code to returning buyers. Builds loyalty. |
| 15 | **Mobile app (PWA or React Native)** | Most of the target audience is on mobile. The web app is mobile-responsive but a native-feeling app would dramatically increase retention. |

---

## Escrow Pitch (for Users)

> **"GearTrad doesn't hold your money — it holds what matters more: the account itself."**
>
> When you buy on GearTrad, you pay the seller directly. But the account credentials are locked on our servers until we see your payment went through. The seller can't walk away with both the money and the account. And if they try to scam you? Our moderation team steps in and the listing is blacklisted.
>
> This isn't blind trust. It's accountable peer-to-peer trading.
