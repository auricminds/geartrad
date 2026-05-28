import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = 200;

  const { data, error } = await serviceClient.auth.admin.listUsers({
    page,
    perPage,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return id → email map
  const emailMap: Record<string, string> = {};
  for (const user of data.users) {
    emailMap[user.id] = user.email ?? '';
  }

  return NextResponse.json(emailMap);
}
