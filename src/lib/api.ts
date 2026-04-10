/**
 * GearTrad API layer — all Supabase data fetching lives here.
 * Read functions work server-side (public RLS policies).
 * Write functions require auth and must be called from client components.
 */
import { supabase, DbListing, DbProfile } from './supabase';
import type { Listing, User, ListingType, AccountRank, BoostType } from '@/types';

// ── Type Conversion ──────────────────────────────────────────────────────────

const PROFILE_COLS = 'id, username, account_type, avatar_url, rating, total_sales, is_verified, created_at';
const LISTING_COLS = `
  id, seller_id, title, title_ar, description, description_ar,
  price, game, type, cover_image, rank, likes,
  is_boosted, boost_type, boost_expires_at, is_available,
  level, hours_played, win_rate, achievements, created_at,
  seller:profiles!listings_seller_id_fkey(${PROFILE_COLS})
`;

export function dbProfileToUser(p: DbProfile): User {
  return {
    id: p.id,
    username: p.username,
    email: '',
    avatar: p.avatar_url ?? undefined,
    type: p.account_type,
    rating: Number(p.rating) || 0,
    totalSales: p.total_sales,
    joinedAt: new Date(p.created_at),
    isVerified: p.is_verified,
  };
}

export function dbListingToListing(row: DbListing): Listing {
  const hasStats = row.level || row.hours_played || row.win_rate || row.achievements;
  return {
    id: row.id,
    title: row.title,
    titleAr: row.title_ar ?? undefined,
    description: row.description,
    descriptionAr: row.description_ar ?? undefined,
    price: row.price,
    game: row.game,
    type: row.type as ListingType,
    coverImage: row.cover_image,
    rank: (row.rank as AccountRank) ?? undefined,
    seller: row.seller
      ? dbProfileToUser(row.seller)
      : { id: row.seller_id, username: 'Unknown', email: '', type: 'seller', rating: 0, totalSales: 0, joinedAt: new Date(), isVerified: false },
    likes: row.likes,
    isBoosted: row.is_boosted,
    boostType: (row.boost_type as BoostType) ?? null,
    boostExpiresAt: row.boost_expires_at ? new Date(row.boost_expires_at) : undefined,
    createdAt: new Date(row.created_at),
    isAvailable: row.is_available,
    stats: hasStats ? {
      level: row.level ?? undefined,
      hoursPlayed: row.hours_played ?? undefined,
      winRate: row.win_rate ?? undefined,
      achievements: row.achievements ?? undefined,
    } : undefined,
  };
}

// ── Listings ─────────────────────────────────────────────────────────────────

export interface ListingFilters {
  game?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  boosted?: boolean;
  limit?: number;
  offset?: number;
}

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  let query = supabase
    .from('listings')
    .select(LISTING_COLS)
    .eq('is_available', true);

  if (filters.game && filters.game !== 'All Games') {
    query = query.eq('game', filters.game);
  }
  if (filters.type && filters.type !== 'All Types') {
    query = query.eq('type', filters.type.toLowerCase());
  }
  if (typeof filters.minPrice === 'number') {
    query = query.gte('price', filters.minPrice);
  }
  if (typeof filters.maxPrice === 'number') {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim().replace(/[%_]/g, '\\$&');
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,game.ilike.%${q}%`);
  }
  if (filters.boosted) {
    query = query.eq('is_boosted', true);
  }

  switch (filters.sortBy) {
    case 'price_asc':  query = query.order('price', { ascending: true }); break;
    case 'price_desc': query = query.order('price', { ascending: false }); break;
    case 'popular':    query = query.order('likes', { ascending: false }); break;
    default:           query = query.order('created_at', { ascending: false });
  }

  const limit = filters.limit ?? 24;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as unknown as DbListing[]).map(dbListingToListing);
}

export async function getListing(id: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_COLS)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return dbListingToListing(data as unknown as DbListing);
}

export async function getTopSellers(limit = 8): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLS)
    .eq('account_type', 'seller')
    .order('total_sales', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as DbProfile[]).map(dbProfileToUser);
}

export async function createListing(payload: {
  title: string;
  title_ar?: string;
  description: string;
  description_ar?: string;
  price: number;
  game: string;
  type: string;
  cover_image: string;
  rank?: string;
  boost_type?: string;
  level?: number | null;
  hours_played?: number | null;
  win_rate?: number | null;
  achievements?: number | null;
}, sellerId: string): Promise<{ id: string } | null> {
  const boost = payload.boost_type && payload.boost_type !== 'none' ? payload.boost_type : null;
  const now = Date.now();
  const boostExpiry = boost === 'weekly'
    ? new Date(now + 7 * 86400000).toISOString()
    : boost === 'monthly'
    ? new Date(now + 30 * 86400000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: sellerId,
      title: payload.title.trim(),
      title_ar: payload.title_ar?.trim() || null,
      description: payload.description.trim(),
      description_ar: payload.description_ar?.trim() || null,
      price: payload.price,
      game: payload.game,
      type: payload.type.toLowerCase(),
      cover_image: payload.cover_image.trim(),
      rank: payload.rank || null,
      is_boosted: !!boost,
      boost_type: boost,
      boost_expires_at: boostExpiry,
      level: payload.level || null,
      hours_played: payload.hours_played || null,
      win_rate: payload.win_rate || null,
      achievements: payload.achievements || null,
    })
    .select('id')
    .single();

  if (error) { console.error('createListing error:', error); return null; }
  return data;
}

// ── Wishlist ──────────────────────────────────────────────────────────────────

export async function getWishlistIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('wishlist')
    .select('listing_id')
    .eq('user_id', userId);
  return (data ?? []).map((r: { listing_id: string }) => r.listing_id);
}

export async function getWishlistListings(userId: string): Promise<Listing[]> {
  const { data } = await supabase
    .from('wishlist')
    .select(`listing:listings(${LISTING_COLS})`)
    .eq('user_id', userId);

  if (!data) return [];
  return (data as unknown as { listing: DbListing | null }[])
    .filter((r) => r.listing)
    .map((r) => dbListingToListing(r.listing!));
}

export async function addToWishlist(userId: string, listingId: string): Promise<void> {
  await supabase.from('wishlist').insert({ user_id: userId, listing_id: listingId });
}

export async function removeFromWishlist(userId: string, listingId: string): Promise<void> {
  await supabase.from('wishlist').delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function createOrder(order: {
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  platform_fee: number;
  payment_method: string;
}): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('orders')
    .insert({ ...order, status: 'pending' })
    .select('id')
    .single();

  if (error) { console.error('createOrder error:', error); return null; }

  // Mark listing unavailable
  await supabase.from('listings').update({ is_available: false }).eq('id', order.listing_id);

  return data;
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export type ChatRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listing: { id: string; title: string; cover_image: string; price: number; game: string } | null;
  buyer: DbProfile | null;
  seller: DbProfile | null;
};

export async function getUserChats(userId: string): Promise<ChatRow[]> {
  const { data } = await supabase
    .from('chats')
    .select(`
      id, listing_id, buyer_id, seller_id, created_at,
      listing:listings(id, title, cover_image, price, game),
      buyer:profiles!chats_buyer_id_fkey(${PROFILE_COLS}),
      seller:profiles!chats_seller_id_fkey(${PROFILE_COLS})
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  return (data as ChatRow[] | null) ?? [];
}

export async function findOrCreateChat(
  listingId: string,
  buyerId: string,
  sellerId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('chats')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('chats')
    .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
    .select('id')
    .single();

  if (error) { console.error('findOrCreateChat error:', error); return null; }
  return data.id;
}

export async function getChatMessages(chatId: string) {
  const { data } = await supabase
    .from('messages')
    .select('id, chat_id, sender_id, content, is_read, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: senderId, content: content.trim() })
    .select()
    .single();

  if (error) { console.error('sendMessage error:', error); return null; }
  return data;
}

export async function markMessagesRead(chatId: string, userId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('chat_id', chatId)
    .neq('sender_id', userId)
    .eq('is_read', false);
}

// ── Profile helpers ───────────────────────────────────────────────────────────

export async function ensureProfile(
  userId: string,
  username: string,
  accountType: string
): Promise<void> {
  await supabase
    .from('profiles')
    .upsert({ id: userId, username, account_type: accountType }, { onConflict: 'id', ignoreDuplicates: true });
}

export async function getProfile(userId: string): Promise<DbProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select(PROFILE_COLS)
    .eq('id', userId)
    .single();
  return data as DbProfile | null;
}

// ── Seller helpers ────────────────────────────────────────────────────────────

export async function getSellerListings(sellerId: string): Promise<Listing[]> {
  const { data } = await supabase
    .from('listings')
    .select(LISTING_COLS)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (!data) return [];
  return (data as unknown as DbListing[]).map(dbListingToListing);
}

export async function toggleListingAvailability(
  listingId: string,
  isAvailable: boolean
): Promise<void> {
  await supabase
    .from('listings')
    .update({ is_available: isAvailable })
    .eq('id', listingId);
}

export async function deleteListing(listingId: string): Promise<void> {
  await supabase.from('listings').delete().eq('id', listingId);
}

export type OrderRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  platform_fee: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'disputed' | 'refunded';
  created_at: string;
  listing: { title: string; cover_image: string; game: string } | null;
  buyer: { username: string } | null;
};

export async function getSellerOrders(sellerId: string): Promise<OrderRow[]> {
  const { data } = await supabase
    .from('orders')
    .select(`
      id, listing_id, buyer_id, seller_id, amount, platform_fee,
      payment_method, status, created_at,
      listing:listings(title, cover_image, game),
      buyer:profiles!orders_buyer_id_fkey(username)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  return (data as OrderRow[] | null) ?? [];
}

// ── Ad inquiries ──────────────────────────────────────────────────────────────

export async function submitAdInquiry(inquiry: {
  name: string;
  company?: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<boolean> {
  const { error } = await supabase
    .from('ad_inquiries')
    .insert({
      name: inquiry.name.trim(),
      company: inquiry.company?.trim() || null,
      email: inquiry.email.trim(),
      phone: inquiry.phone?.trim() || null,
      message: inquiry.message.trim(),
    });
  return !error;
}
