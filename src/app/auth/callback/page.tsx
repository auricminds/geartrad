'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Handles Supabase email confirmation redirect.
 * Supabase sends the user here with ?code=xxx after they click
 * the confirmation link in their email (PKCE flow).
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = params.get('code');

    async function exchange() {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      // Redirect to sign-in regardless — user confirmed their email, now they log in
      router.replace('/en/auth/sign-in?confirmed=1');
    }

    exchange();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted">
        <span className="inline-block w-6 h-6 border-2 border-purple border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Confirming your account…</p>
      </div>
    </div>
  );
}
