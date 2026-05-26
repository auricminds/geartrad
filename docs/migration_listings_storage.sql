-- ============================================================
-- Migration: listings table RLS + listing-images storage bucket
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Enable RLS on listings (if not already)
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to insert their own listings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'listings' AND policyname = 'sellers_can_insert_listings'
  ) THEN
    CREATE POLICY sellers_can_insert_listings ON public.listings
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = seller_id);
  END IF;
END $$;

-- 3. Allow anyone to read available listings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'listings' AND policyname = 'anyone_can_read_listings'
  ) THEN
    CREATE POLICY anyone_can_read_listings ON public.listings
      FOR SELECT USING (is_available = true OR auth.uid() = seller_id);
  END IF;
END $$;

-- 4. Allow sellers to update their own listings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'listings' AND policyname = 'sellers_can_update_own_listings'
  ) THEN
    CREATE POLICY sellers_can_update_own_listings ON public.listings
      FOR UPDATE TO authenticated
      USING (auth.uid() = seller_id);
  END IF;
END $$;

-- 5. Create listing-images storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Allow authenticated users to upload to listing-images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'authenticated_upload_listing_images'
  ) THEN
    CREATE POLICY authenticated_upload_listing_images ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'listing-images');
  END IF;
END $$;

-- 7. Allow public read of listing images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'public_read_listing_images'
  ) THEN
    CREATE POLICY public_read_listing_images ON storage.objects
      FOR SELECT USING (bucket_id = 'listing-images');
  END IF;
END $$;
