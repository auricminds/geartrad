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

export type DbNotification = {
  id: string;
  user_id: string;
  type: 'message' | 'sale' | 'system' | 'mod';
  title: string;
  body: string;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type DbVerification = {
  id: string;
  user_id: string;
  id_front_url: string;
  selfie_url: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_id: string | null;
  notes: string | null;
};

export type DbSupportTicket = {
  id: string;
  user_id: string;
  chat_id: string | null;
  type: 'general' | 'dispute' | 'scam' | 'chat_mod';
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  user?: DbProfile;
};

export type DbTicketMessage = {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: DbProfile;
};
