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

    async function exchange() {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      router.replace('/en/auth/sign-in?confirmed=1');
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
