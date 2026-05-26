import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { payload, sellerId } = body;

  if (!sellerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getServiceClient();

  // Verify seller exists
  const { data: profile } = await db.from('profiles').select('id, account_type, role').eq('id', sellerId).single();
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
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
      price: payload.price,
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
