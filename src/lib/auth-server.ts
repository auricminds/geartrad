import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Extracts and verifies the authenticated user from the Authorization Bearer token.
 * Returns the user's UUID or null if the token is missing or invalid.
 *
 * Usage in API routes:
 *   const sessionUserId = await getSessionUserId(req);
 *   if (!sessionUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */
export async function getSessionUserId(req: NextRequest): Promise<string | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '').trim();
  if (!token) return null;
  try {
    const { data: { user } } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ).auth.getUser(token);
    return user?.id ?? null;
  } catch {
    return null;
  }
}
