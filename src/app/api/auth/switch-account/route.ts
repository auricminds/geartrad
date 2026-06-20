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
  const userId = await getSessionUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { targetType } = body;

  if (targetType !== 'buyer' && targetType !== 'seller') {
    return NextResponse.json({ error: 'Invalid account type' }, { status: 400 });
  }

  const db = getServiceClient();

  // Verify current account type (prevent no-op)
  const { data: profile, error: fetchErr } = await db
    .from('profiles')
    .select('account_type, is_banned')
    .eq('id', userId)
    .single();

  if (fetchErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.is_banned) {
    return NextResponse.json({ error: 'Account is banned' }, { status: 403 });
  }

  if (profile.account_type === targetType) {
    return NextResponse.json({ error: `Already a ${targetType}` }, { status: 400 });
  }

  // Update profiles table
  const { error: updateErr } = await db
    .from('profiles')
    .update({ account_type: targetType })
    .eq('id', userId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Update auth user metadata (so new JWTs carry the correct account_type)
  const { error: metaErr } = await db.auth.admin.updateUserById(userId, {
    user_metadata: { account_type: targetType },
  });

  if (metaErr) {
    // Non-fatal — profile is already updated; metadata will sync on next login
    console.error('switch-account meta update failed:', metaErr.message);
  }

  return NextResponse.json({ success: true, accountType: targetType });
}
