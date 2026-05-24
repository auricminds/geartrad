-- ============================================================
-- GearTrad — Payment System v2 Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add payment details to seller profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS instapay_id          TEXT,
  ADD COLUMN IF NOT EXISTS vodafone_number       TEXT,
  ADD COLUMN IF NOT EXISTS orange_number         TEXT,
  ADD COLUMN IF NOT EXISTS crypto_wallet_usdt    TEXT,
  ADD COLUMN IF NOT EXISTS crypto_wallet_btc     TEXT,
  ADD COLUMN IF NOT EXISTS crypto_wallet_eth     TEXT;

-- 2. Add proof tracking to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_proof_url     TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference     TEXT,
  ADD COLUMN IF NOT EXISTS proof_submitted_at    TIMESTAMPTZ;

-- 3. Update payment_status to include new values
-- First check if there's an existing check constraint and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'orders'
    AND constraint_name = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_payment_status_check;
  END IF;
END $$;

-- Add new check constraint with proof_submitted and cancelled
ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'proof_submitted', 'paid', 'delivered', 'refunded', 'failed', 'cancelled'));

-- Update status check constraint too
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'orders'
    AND constraint_name = 'orders_status_check'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'completed', 'disputed', 'refunded', 'cancelled'));

-- 4. Remove Paymob-specific columns (safe to keep for now, just ignored)
-- ALTER TABLE orders DROP COLUMN IF EXISTS paymob_order_id;
-- ALTER TABLE orders DROP COLUMN IF EXISTS paymob_transaction_id;
-- ALTER TABLE orders DROP COLUMN IF EXISTS merchant_ref;
-- ^ Commented out — safe to run later once you confirm no active orders reference them

-- 5. RLS policies — profiles payment fields
-- Allow sellers to update their own payment details
CREATE POLICY IF NOT EXISTS "sellers_update_payment_details"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Payment details should NOT be visible to buyers — only the platform shows them during checkout
-- The /api/payment/initiate route uses service role key so bypasses RLS

-- ============================================================
-- Done. Verify by running:
-- SELECT instapay_id, vodafone_number, crypto_wallet_usdt FROM profiles LIMIT 1;
-- SELECT payment_proof_url, payment_reference, proof_submitted_at FROM orders LIMIT 1;
-- ============================================================
