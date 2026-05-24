import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });

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
