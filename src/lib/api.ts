/**
 * GearTrad API layer — all Supabase data fetching lives here.
 * Read functions work server-side (public RLS policies).
 * Write functions require auth and must be called from client components.
 */
import { supabase, DbListing, DbProfile } from './supabase';
import type { Listing, User, ListingType, AccountRank, BoostType } from '@/types';

// ── Type Conversion ──────────────────────────────────────────────────────────

const PROFILE_COLS = 'id, username, account_type, role, avatar_url, rating, total_sales, is_verified, created_at';
const PAYMENT_COLS = 'instapay_id, vodafone_number, orange_number, paypal_email, crypto_wallet_usdt, crypto_wallet_btc, crypto_wallet_eth';
const LISTING_COLS = `
  id, seller_id, title, title_ar, description, description_ar,
  price, game, type, cover_image, rank, likes,
  is_boosted, boost_type, boost_expires_at, is_available,
  level, hours_played, win_rate, achievements, created_at,
  seller:profiles!listings_seller_id_fkey(${PROFILE_COLS}, ${PAYMENT_COLS})
`;

export function dbProfileToUser(p: DbProfile): User {
  const hasPayment = p.vodafone_number || p.orange_number || p.instapay_id || p.paypal_email || p.crypto_wallet_usdt || p.crypto_wallet_btc || p.crypto_wallet_eth;
  return {
    id: p.id,
    username: p.username,
    email: '',
    avatar: p.avatar_url ?? undefined,
    type: p.account_type,
    role: p.role ?? 'user',
    rating: Number(p.rating) || 0,
    totalSales: p.total_sales,
    joinedAt: new Date(p.created_at),
    isVerified: p.is_verified,
    paymentMethods: hasPayment ? {
      vodafone: p.vodafone_number,
      orange: p.orange_number,
      instapay: p.instapay_id,
      paypal: p.paypal_email,
      usdt: p.crypto_wallet_usdt,
      btc: p.crypto_wallet_btc,
      eth: p.crypto_wallet_eth,
    } : undefined,
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
  account_email?: string;
  account_password?: string;
  account_extra_info?: string;
}, sellerId: string): Promise<{ id: string } | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch('/api/listings/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ payload, sellerId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('createListing error:', err);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error('createListing error:', e);
    return null;
  }
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

  // Notify the other party (seller if sender is buyer, buyer if sender is seller)
  try {
    const { data: chat } = await supabase
      .from('chats')
      .select('buyer_id, seller_id, listing:listings(title)')
      .eq('id', chatId)
      .single();
    if (chat) {
      const recipientId = chat.buyer_id === senderId ? chat.seller_id : chat.buyer_id;
      const listingTitle = (chat.listing as { title?: string } | null)?.title ?? 'a listing';
      const { data: senderProfile } = await supabase.from('profiles').select('username').eq('id', senderId).single();
      const senderName = senderProfile?.username ?? 'Someone';
      await supabase.from('notifications').insert({
        user_id: recipientId,
        type: 'message',
        title: `New message from ${senderName}`,
        body: `"${content.trim().slice(0, 60)}${content.trim().length > 60 ? '…' : ''}" — re: ${listingTitle}`,
        related_id: chatId,
      });
    }
  } catch { /* non-critical */ }

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
    .select(`${PROFILE_COLS}, ${PAYMENT_COLS}`)
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
  status: 'pending' | 'completed' | 'disputed' | 'refunded' | 'cancelled';
  payment_status: 'pending' | 'proof_submitted' | 'paid' | 'delivered' | 'refunded' | 'failed' | 'cancelled';
  payment_proof_url: string | null;
  payment_reference: string | null;
  proof_submitted_at: string | null;
  buyer_rating: number | null;
  buyer_comment: string | null;
  created_at: string;
  listing: { title: string; cover_image: string; game: string } | null;
  buyer: { username: string } | null;
  seller?: { username: string } | null;
};

export async function getSellerOrders(sellerId: string): Promise<OrderRow[]> {
  const { data } = await supabase
    .from('orders')
    .select(`
      id, listing_id, buyer_id, seller_id, amount, platform_fee,
      payment_method, status, payment_status,
      payment_proof_url, payment_reference, proof_submitted_at,
      created_at,
      listing:listings(title, cover_image, game),
      buyer:profiles!orders_buyer_id_fkey(username)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  return (data as OrderRow[] | null) ?? [];
}

export async function getBuyerOrders(buyerId: string): Promise<OrderRow[]> {
  const { data } = await supabase
    .from('orders')
    .select(`
      id, listing_id, buyer_id, seller_id, amount, platform_fee,
      payment_method, status, payment_status,
      payment_proof_url, payment_reference, proof_submitted_at,
      created_at,
      listing:listings(title, cover_image, game),
      seller:profiles!orders_seller_id_fkey(username)
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  return (data as OrderRow[] | null) ?? [];
}

export async function getSellerPaymentDetails(sellerId: string): Promise<{
  instapay_id: string | null;
  vodafone_number: string | null;
  orange_number: string | null;
  paypal_email: string | null;
  crypto_wallet_usdt: string | null;
  crypto_wallet_btc: string | null;
  crypto_wallet_eth: string | null;
} | null> {
  const { data } = await supabase
    .from('profiles')
    .select(PAYMENT_COLS)
    .eq('id', sellerId)
    .single();
  return data as {
    instapay_id: string | null;
    vodafone_number: string | null;
    orange_number: string | null;
    paypal_email: string | null;
    crypto_wallet_usdt: string | null;
    crypto_wallet_btc: string | null;
    crypto_wallet_eth: string | null;
  } | null;
}

export async function updateSellerPaymentDetails(userId: string, details: {
  instapay_id?: string | null;
  vodafone_number?: string | null;
  orange_number?: string | null;
  paypal_email?: string | null;
  crypto_wallet_usdt?: string | null;
  crypto_wallet_btc?: string | null;
  crypto_wallet_eth?: string | null;
}): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update(details)
    .eq('id', userId);
  return !error;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications(userId: string) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function createNotification(n: {
  user_id: string;
  type: 'message' | 'sale' | 'system' | 'mod';
  title: string;
  body: string;
  related_id?: string;
}): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: n.user_id,
    type: n.type,
    title: n.title,
    body: n.body,
    related_id: n.related_id ?? null,
  });
}

export async function markNotificationRead(notifId: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}

// ── Image upload ──────────────────────────────────────────────────────────────

export async function uploadListingImage(file: File, userId: string): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    const res = await fetch('/api/listings/upload-image', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('uploadListingImage error:', err);
      return null;
    }
    const { url } = await res.json();
    return url;
  } catch (e) {
    console.error('uploadListingImage error:', e);
    return null;
  }
}

// ── Verifications ─────────────────────────────────────────────────────────────

export async function submitVerification(userId: string, idFrontFile: File, selfieFile: File): Promise<boolean> {
  const idUrl = await uploadListingImage(idFrontFile, `verif/${userId}`);
  const selfieUrl = await uploadListingImage(selfieFile, `verif/${userId}`);
  if (!idUrl || !selfieUrl) return false;
  const { error } = await supabase.from('verifications').insert({
    user_id: userId,
    id_front_url: idUrl,
    selfie_url: selfieUrl,
  });
  return !error;
}

export async function getMyVerification(userId: string) {
  const { data } = await supabase
    .from('verifications')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getAllVerifications() {
  const { data } = await supabase
    .from('verifications')
    .select('*, user:profiles!verifications_user_id_fkey(id, username, avatar_url)')
    .order('submitted_at', { ascending: false });
  return data ?? [];
}

export async function reviewVerification(id: string, reviewerId: string, status: 'approved' | 'rejected', notes?: string): Promise<void> {
  await supabase.from('verifications').update({
    status,
    reviewer_id: reviewerId,
    reviewed_at: new Date().toISOString(),
    notes: notes ?? null,
  }).eq('id', id);
  if (status === 'approved') {
    const { data: verif } = await supabase.from('verifications').select('user_id').eq('id', id).single();
    if (verif) {
      await supabase.from('profiles').update({ is_verified: true }).eq('id', verif.user_id);
    }
  }
}

// ── Support Tickets ───────────────────────────────────────────────────────────

export async function createSupportTicket(t: {
  user_id: string;
  chat_id?: string;
  type: 'general' | 'dispute' | 'scam' | 'chat_mod';
  title: string;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({ user_id: t.user_id, chat_id: t.chat_id ?? null, type: t.type, title: t.title })
    .select('id')
    .single();
  if (error) { console.error('createSupportTicket error:', error); return null; }
  return data.id;
}

export async function getMyTickets(userId: string) {
  const { data } = await supabase
    .from('support_tickets')
    .select('*, user:profiles!support_tickets_user_id_fkey(id, username)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getAllTickets() {
  const { data } = await supabase
    .from('support_tickets')
    .select('*, user:profiles!support_tickets_user_id_fkey(id, username)')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getTicketMessages(ticketId: string) {
  const { data } = await supabase
    .from('ticket_messages')
    .select('*, sender:profiles!ticket_messages_sender_id_fkey(id, username, role)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function sendTicketMessage(ticketId: string, senderId: string, content: string): Promise<boolean> {
  const { error } = await supabase
    .from('ticket_messages')
    .insert({ ticket_id: ticketId, sender_id: senderId, content: content.trim() });
  if (!error) {
    await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticketId);
  }
  return !error;
}

export async function updateTicketStatus(ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed'): Promise<void> {
  await supabase.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', ticketId);
}

// ── Chat Moderators ───────────────────────────────────────────────────────────

export async function pingModerator(chatId: string, userId: string, username: string): Promise<string | null> {
  // Create a ticket of type chat_mod
  const ticketId = await createSupportTicket({
    user_id: userId,
    chat_id: chatId,
    type: 'chat_mod',
    title: `Moderator requested in chat by ${username}`,
  });
  if (!ticketId) return null;
  // Notify all moderators
  const { data: mods } = await supabase.from('profiles').select('id').in('role', ['moderator', 'admin']);
  if (mods && mods.length > 0) {
    await supabase.from('notifications').insert(
      mods.map((m: { id: string }) => ({
        user_id: m.id,
        type: 'mod',
        title: 'Moderator Requested',
        body: `${username} is requesting a moderator in a chat.`,
        related_id: ticketId,
      }))
    );
  }
  return ticketId;
}

export async function joinChatAsModerator(chatId: string, moderatorId: string): Promise<void> {
  await supabase.from('chat_moderators').upsert({ chat_id: chatId, moderator_id: moderatorId }, { onConflict: 'chat_id,moderator_id' });
}

export async function getChatModerators(chatId: string): Promise<string[]> {
  const { data } = await supabase.from('chat_moderators').select('moderator_id').eq('chat_id', chatId);
  return (data ?? []).map((r: { moderator_id: string }) => r.moderator_id);
}

export async function getMyRole(userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  return data?.role ?? 'user';
}

// ── Admin / Moderator ─────────────────────────────────────────────────────────

export async function getAllOrders() {
  const { data } = await supabase
    .from('orders')
    .select('*, listing:listings(id, title, game, cover_image), buyer:profiles!orders_buyer_id_fkey(id, username), seller:profiles!orders_seller_id_fkey(id, username)')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getAllUsers() {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, account_type, role, rating, total_sales, is_verified, created_at, is_banned')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getAllListingsAdmin() {
  const { data } = await supabase
    .from('listings')
    .select('*, seller:profiles!listings_seller_id_fkey(id, username)')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function setUserRole(userId: string, role: 'user' | 'moderator' | 'admin'): Promise<void> {
  await supabase.from('profiles').update({ role }).eq('id', userId);
}

export async function setBanStatus(userId: string, banned: boolean): Promise<void> {
  await supabase.from('profiles').update({ is_banned: banned, banned_until: null }).eq('id', userId);
}

export async function setUserTimeout(userId: string, hours: number): Promise<void> {
  const bannedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  await supabase.from('profiles').update({ is_banned: true, banned_until: bannedUntil }).eq('id', userId);
}

export async function cancelOrderAsMod(orderId: string, listingId: string): Promise<void> {
  await supabase.from('orders').update({ status: 'cancelled', payment_status: 'cancelled' }).eq('id', orderId);
  await supabase.from('listings').update({ is_available: true }).eq('id', listingId);
}

export async function deleteListingAsMod(listingId: string): Promise<void> {
  await supabase.from('listings').update({ is_available: false }).eq('id', listingId);
}

export async function getPlatformStats() {
  const [ordersRes, usersRes, listingsRes, disputesRes] = await Promise.all([
    supabase.from('orders').select('id, status, payment_status', { count: 'exact' }),
    supabase.from('profiles').select('id, account_type', { count: 'exact' }),
    supabase.from('listings').select('id, is_available', { count: 'exact' }),
    supabase.from('orders').select('id').eq('status', 'disputed'),
  ]);
  return {
    totalOrders: ordersRes.count ?? 0,
    completedOrders: (ordersRes.data ?? []).filter((o: { status: string }) => o.status === 'completed').length,
    pendingOrders: (ordersRes.data ?? []).filter((o: { payment_status: string }) => o.payment_status === 'proof_submitted').length,
    totalUsers: usersRes.count ?? 0,
    sellers: (usersRes.data ?? []).filter((u: { account_type: string }) => u.account_type === 'seller').length,
    totalListings: listingsRes.count ?? 0,
    activeListings: (listingsRes.data ?? []).filter((l: { is_available: boolean }) => l.is_available).length,
    openDisputes: (disputesRes.data ?? []).length,
  };
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
