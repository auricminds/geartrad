import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUserId } from '@/lib/auth-server';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/**
 * GET /api/mod/view-id?path=userId/id_doc.jpg
 * Returns a 60-minute signed URL for a private ID document.
 * Requires mod/admin session.
 */
export async function GET(req: NextRequest) {
  const requesterId = await getSessionUserId(req);
  if (!requesterId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getAdmin();

  // Verify requester is mod/admin
  const { data: profile } = await admin.from('profiles').select('role').eq('id', requesterId).single();
  if (profile?.role !== 'moderator' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const path = req.nextUrl.searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }

  const { data, error } = await admin.storage
    .from('id-documents')
    .createSignedUrl(path, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Could not generate URL' }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
