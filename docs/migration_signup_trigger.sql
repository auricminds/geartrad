-- ============================================================
-- GearTrad — Signup Trigger + Admin Columns Migration
-- Fixes "Database error saving new user" on signup
-- Adds role and is_banned columns for admin panel
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 0. Add role and is_banned columns to profiles (if not already there)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role        TEXT        NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_banned   BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ;

-- Add check constraint for role values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('user', 'moderator', 'admin'));
  END IF;
END $$;

-- 1. Function that auto-creates a profile row when a new auth user is created
--    Admin emails are automatically granted the admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  admin_emails TEXT[] := ARRAY['varefunds@gmail.com', 'ussamahusseinn@gmail.com'];
  assigned_role TEXT := 'user';
BEGIN
  IF NEW.email = ANY(admin_emails) THEN
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, username, account_type, role, rating, total_sales, is_verified, is_banned)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'buyer'),
    assigned_role,
    0,
    0,
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger that fires the function after every new auth user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Set admin roles for the two platform admins
UPDATE profiles SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('eldixblo1@gmail.com', 'ussamahusseinn@gmail.com')
);

-- ============================================================
-- Verify by running:
-- SELECT id, username, role FROM profiles WHERE role = 'admin';
-- ============================================================
