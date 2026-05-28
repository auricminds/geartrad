import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Allowed admin emails — set MOD_ADMIN_EMAILS in Vercel env as a comma-separated list.
 * e.g. MOD_ADMIN_EMAILS=admin@geartrad.com,mod@geartrad.com
 */
function getAllowedEmails(): string[] {
  const raw = process.env.MOD_ADMIN_EMAILS ?? '';
  return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const allowedEmails = getAllowedEmails();

  if (allowedEmails.length === 0) {
    return NextResponse.json({ error: 'Admin registration is not configured.' }, { status: 503 });
  }

  if (!allowedEmails.includes(normalizedEmail)) {
    return NextResponse.json({ error: 'This email is not authorized for admin access.' }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geartrad.com';

  // Fallback: if service role key is missing, use regular signup
  if (!serviceKey || !supabaseUrl) {
    const anonClient = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error } = await anonClient.auth.signUp({
      email: normalizedEmail,
      password,
      options: { emailRedirectTo: `${siteUrl}/en/mod/sign-in` },
    });
    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        return NextResponse.json({ error: 'Account already exists. Sign in instead.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, needsConfirmation: true });
  }

  // With service role key: create user with email auto-confirmed
  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await serviceClient.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already been registered')) {
      return NextResponse.json({ error: 'Account already exists. Sign in instead.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Set role to admin immediately
  await serviceClient.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);

  return NextResponse.json({ success: true, needsConfirmation: false });
}
