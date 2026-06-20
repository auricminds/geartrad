import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/auth-server';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  // Verify the caller is authenticated and owns the seller ID
  const sessionUserId = await getSessionUserId(req);
  if (!sessionUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Guard against oversized payloads (middleware catches >10MB; this catches abuse of the JSON body)
  const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
  if (contentLength > 64 * 1024) { // 64 KB is more than enough for a listing JSON
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
  }

  const body = await req.json();
  const { payload, sellerId } = body;

  if (!sellerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (sessionUserId !== sellerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getServiceClient();

  // Verify seller exists and has correct account type
  const { data: profile } = await db.from('profiles').select('id, account_type, role').eq('id', sellerId).single();
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Server-side validation
  if (!payload.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  if (!payload.description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }
  const price = Number(payload.price);
  if (!Number.isFinite(price) || price <= 0 || price > 100000) {
    return NextResponse.json({ error: 'Price must be between 1 and 100,000' }, { status: 400 });
  }
  if (!payload.game) {
    return NextResponse.json({ error: 'Game is required' }, { status: 400 });
  }
  if (!payload.type) {
    return NextResponse.json({ error: 'Listing type is required' }, { status: 400 });
  }

  const boost = payload.boost_type && payload.boost_type !== 'none' ? payload.boost_type : null;
  const now = Date.now();
  const boostExpiry = boost === 'weekly'
    ? new Date(now + 7 * 86400000).toISOString()
    : boost === 'monthly'
    ? new Date(now + 30 * 86400000).toISOString()
    : null;

  const { data, error } = await db
    .from('listings')
    .insert({
      seller_id: sellerId,
      title: payload.title?.trim(),
      title_ar: payload.title_ar?.trim() || null,
      description: payload.description?.trim(),
      description_ar: payload.description_ar?.trim() || null,
      price,
      game: payload.game,
      type: payload.type?.toLowerCase(),
      cover_image: payload.cover_image?.trim(),
      rank: payload.rank || null,
      is_boosted: !!boost,
      boost_type: boost,
      boost_expires_at: boostExpiry,
      level: payload.level || null,
      hours_played: payload.hours_played || null,
      win_rate: payload.win_rate || null,
      achievements: payload.achievements || null,
      account_email: payload.account_email || null,
      account_password: payload.account_password || null,
      account_extra_info: payload.account_extra_info || null,
      images: Array.isArray(payload.images) ? payload.images.filter(Boolean) : [],
      is_available: true,
      likes: 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('createListing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
