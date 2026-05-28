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
  // ── Auth: verify the caller owns the userId they're uploading to ──────────
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '').trim();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse form data ───────────────────────────────────────────────────────
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const userId = formData.get('userId') as string | null;

  if (!file || !userId) {
    return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
  }

  // Ensure the authenticated user matches the upload target
  if (user.id !== userId && !userId.startsWith('verif/')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getServiceClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await db.storage
    .from('listing-images')
    .upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });

  if (error) {
    console.error('uploadListingImage error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = db.storage.from('listing-images').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
