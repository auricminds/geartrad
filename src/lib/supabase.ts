import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Shared browser/server client — auth token is automatically attached on the client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Database row types ──────────────────────────────────────────────────────

export type DbProfile = {
  id: string;
  username: string;
  account_type: 'buyer' | 'seller';
  avatar_url: string | null;
  rating: number;
  total_sales: number;
  is_verified: boolean;
  created_at: string;
};

export type DbListing = {
  id: string;
  seller_id: string;
  title: string;
  title_ar: string | null;
  description: string;
  description_ar: string | null;
  price: number;
  game: string;
  type: string;
  cover_image: string;
  rank: string | null;
  likes: number;
  is_boosted: boolean;
  boost_type: 'weekly' | 'monthly' | null;
  boost_expires_at: string | null;
  is_available: boolean;
  level: number | null;
  hours_played: number | null;
  win_rate: number | null;
  achievements: number | null;
  created_at: string;
  // Joined
  seller?: DbProfile;
};

export type DbChat = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
};

export type DbMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

export type DbOrder = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  platform_fee: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'disputed' | 'refunded';
  created_at: string;
};
