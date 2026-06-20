'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = params.get('code');
    const token_hash = params.get('token_hash');
    const type = params.get('type') ?? 'signup';

    async function exchange() {
      try {
        if (token_hash) {
          // OTP / email link flow (Supabase email confirmation links)
          const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as 'signup' | 'recovery' | 'invite' | 'email_change' | 'email' });
          if (error) {
            router.replace('/en/auth/sign-in?error=link_expired');
            return;
          }
        } else if (code) {
          // PKCE flow (OAuth, magic links with PKCE)
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            router.replace('/en/auth/sign-in?error=link_expired');
            return;
          }
        } else {
          router.replace('/en/auth/sign-in?error=link_expired');
          return;
        }
        router.replace('/en/auth/sign-in?confirmed=1');
      } catch {
        router.replace('/en/auth/sign-in?error=link_expired');
      }
    }

    exchange();
  }, [params, router]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted">
        <span className="inline-block w-6 h-6 border-2 border-purple border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Confirming your account…</p>
      </div>
      <Suspense>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
