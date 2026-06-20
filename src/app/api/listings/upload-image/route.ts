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

  // ── File validation ──────────────────────────────────────────────────────
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 5 MB.' }, { status: 413 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP and GIF images are allowed.' }, { status: 415 });
  }

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: 'Invalid file extension.' }, { status: 415 });
  }

  // Sanitise path — strip anything that isn't alphanumeric/dash/underscore
  const safeUserId = userId.replace(/[^a-zA-Z0-9_\-\/]/g, '');
  const path = `${safeUserId}/${Date.now()}.${ext}`;

  const db = getServiceClient();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await db.storage
    .from('listing-images')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('uploadListingImage error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = db.storage.from('listing-images').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
