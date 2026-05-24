import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only these emails are allowed to create admin accounts
const ADMIN_EMAILS = ['varefunds@gmail.com', 'ussamahusseinn@gmail.com'];

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  if (!ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
    return NextResponse.json({ error: 'This email is not authorized for admin access.' }, { status: 403 });
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create the user (email auto-confirmed via admin API)
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      return NextResponse.json({ error: 'This email already has an account. Sign in instead.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Set role to admin
  await serviceClient
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', data.user.id);

  return NextResponse.json({ success: true });
}
