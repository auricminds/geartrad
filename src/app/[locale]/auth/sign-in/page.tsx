'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { Gamepad2, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

export default function SignInPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [confirmed, setConfirmed] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setConfirmed(sp.get('confirmed') === '1');
    setLinkExpired(sp.get('error') === 'link_expired');
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const email = emailRef.current?.value.trim() ?? '';
    const password = passwordRef.current?.value ?? '';

    if (!email || !password) {
      setError(locale === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError(locale === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Incorrect email or password');
        } else if (authError.message.includes('Email not confirmed')) {
          setError(locale === 'ar' ? 'يرجى تأكيد بريدك الإلكتروني أولاً' : 'Please confirm your email first');
        } else {
          setError(authError.message);
        }
        return;
      }

      router.refresh();
      router.push(`/${locale}`);
    } catch {
      setError(locale === 'ar' ? 'خطأ في الشبكة، تحقق من اتصالك وحاول مرة أخرى' : 'Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-surface border border-border rounded-2xl p-5 sm:p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-purple to-purple-light rounded-xl flex items-center justify-center shadow-lg shadow-purple/30">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">
              Gear<span className="text-gold">Trad</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-1">{t('signIn')}</h1>
          <p className="text-muted text-sm text-center mb-6">
            {t('dontHave')}{' '}
            <Link href={`/${locale}/auth/sign-up`} className="text-purple hover:text-purple-light transition-colors">
              {t('signUp')}
            </Link>
          </p>

          {/* Email confirmed banner */}
          {confirmed && (
            <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{locale === 'ar' ? 'تم تأكيد بريدك الإلكتروني! يمكنك الآن تسجيل الدخول.' : 'Email confirmed! You can now sign in.'}</span>
            </div>
          )}

          {/* Link expired banner */}
          {linkExpired && (
            <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {locale === 'ar'
                  ? 'رابط التأكيد انتهت صلاحيته. تحقق من بريدك للرسالة الأحدث، أو اتصل بالدعم.'
                  : 'Confirmation link has expired. Check your inbox for a newer email, or contact support.'}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              ref={emailRef}
              label={t('email')}
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />
            <Input
              ref={passwordRef}
              label={t('password')}
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />

            <div className="flex items-center justify-end">
              <Link href={`/${locale}/auth/forgot-password`} className="text-xs text-muted hover:text-purple transition-colors">
                {t('forgotPassword')}
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {t('signIn')}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
