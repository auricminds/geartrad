'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Gamepad2, Mail, Lock, User, ShoppingBag, Store, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type BoostType = 'none' | 'weekly' | 'monthly';

export default function SignUpPage() {
  const t = useTranslations('auth');
  const ts = useTranslations('seller');
  const locale = useLocale();
  const router = useRouter();

  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef    = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef  = useRef<HTMLInputElement>(null);

  const [accountType, setAccountType] = useState<'buyer' | 'seller'>('buyer');
  const [boostType, setBoostType]     = useState<BoostType>('none');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [emailSent, setEmailSent]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const username = usernameRef.current?.value.trim() ?? '';
    const email    = emailRef.current?.value.trim() ?? '';
    const password = passwordRef.current?.value ?? '';
    const confirm  = confirmRef.current?.value ?? '';

    if (!username || !email || !password || !confirm) {
      setError(locale === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError(locale === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError(locale === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}`,
          data: {
            username,
            account_type: accountType,
            boost_type: boostType !== 'none' ? boostType : null,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
          setError(locale === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل' : 'This email is already registered');
        } else {
          setError(authError.message);
        }
        return;
      }

      // Supabase sends a confirmation email by default
      setEmailSent(true);
    } catch {
      setError(locale === 'ar' ? 'خطأ في الشبكة، تحقق من اتصالك وحاول مرة أخرى' : 'Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Email confirmation screen ─────────────────────
  if (emailSent) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-10 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              {locale === 'ar' ? 'تم إنشاء الحساب!' : 'Account Created!'}
            </h1>
            <p className="text-muted text-sm leading-relaxed mb-6">
              {locale === 'ar'
                ? 'أرسلنا رسالة تأكيد إلى بريدك الإلكتروني. تحقق من صندوق الوارد وانقر على رابط التأكيد للمتابعة.'
                : 'We sent a confirmation email to your inbox. Click the link inside to activate your account.'}
            </p>
            <Link
              href={`/${locale}/auth/sign-in`}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-xl bg-purple hover:bg-purple-light text-white shadow-lg shadow-purple/25 transition-all duration-200"
            >
              {t('signIn')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Sign-up form ──────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
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

          <h1 className="text-2xl font-bold text-white text-center mb-1">{t('signUp')}</h1>
          <p className="text-muted text-sm text-center mb-6">
            {t('alreadyHave')}{' '}
            <Link href={`/${locale}/auth/sign-in`} className="text-purple hover:text-purple-light transition-colors">
              {t('signIn')}
            </Link>
          </p>

          {/* Account type */}
          <div className="mb-6">
            <p className="text-sm text-muted mb-3">{t('accountType')}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('buyer')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 text-center',
                  accountType === 'buyer' ? 'bg-purple/10 border-purple text-purple' : 'border-border text-muted hover:border-purple/30 hover:text-white'
                )}
              >
                <ShoppingBag className="w-6 h-6" />
                <div>
                  <p className="text-sm font-semibold">{t('buyer')}</p>
                  <p className="text-xs opacity-70 mt-0.5">{t('buyerDesc')}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('seller')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 text-center',
                  accountType === 'seller' ? 'bg-gold/10 border-gold text-gold' : 'border-border text-muted hover:border-gold/30 hover:text-white'
                )}
              >
                <Store className="w-6 h-6" />
                <div>
                  <p className="text-sm font-semibold">{t('seller')}</p>
                  <p className="text-xs opacity-70 mt-0.5">{t('sellerDesc')}</p>
                </div>
              </button>
            </div>
          </div>

          {/* Boost upsell for sellers */}
          {accountType === 'seller' && (
            <div className="mb-6 p-4 rounded-xl border border-gold/20 bg-gold/5">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-gold" />
                <p className="text-sm font-semibold text-white">{ts('boostTitle')}</p>
              </div>
              <p className="text-xs text-muted mb-4">{ts('boostDesc')}</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'none', labelEn: 'No boost', labelAr: 'بدون رفع', priceEn: 'Free', priceAr: 'مجاناً' },
                  { id: 'weekly', labelEn: '1 Week', labelAr: 'أسبوع', priceEn: '50 EGP', priceAr: '٥٠ ج.م' },
                  { id: 'monthly', labelEn: '1 Month', labelAr: 'شهر', priceEn: '150 EGP', priceAr: '١٥٠ ج.م', save: true },
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setBoostType(opt.id as BoostType)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all duration-200',
                      boostType === opt.id
                        ? opt.id === 'monthly' ? 'border-gold bg-gold/10' : opt.id === 'weekly' ? 'border-purple bg-purple/10' : 'border-border bg-white/5'
                        : 'border-border/50 text-muted hover:border-border hover:text-white'
                    )}
                  >
                    {opt.id !== 'none' && <Zap className="w-3.5 h-3.5 text-gold" />}
                    <span className="text-xs font-medium text-white">{locale === 'ar' ? opt.labelAr : opt.labelEn}</span>
                    <span className="text-xs font-bold text-gold">{locale === 'ar' ? opt.priceAr : opt.priceEn}</span>
                    {'save' in opt && opt.save && (
                      <span className="text-[10px] text-emerald-400">{ts('save')}</span>
                    )}
                  </button>
                ))}
              </div>
              {boostType !== 'none' && (
                <p className="text-xs text-muted mt-3 text-center">
                  {locale === 'ar' ? 'سيتم محاسبتك عند نشر إعلانك الأول' : 'You will be charged when you publish your first listing'}
                </p>
              )}
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
              ref={usernameRef}
              label={t('username')}
              type="text"
              placeholder="GamerTag123"
              icon={<User className="w-4 h-4" />}
              autoComplete="username"
              required
            />
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
              autoComplete="new-password"
              required
            />
            <Input
              ref={confirmRef}
              label={t('confirmPassword')}
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              variant={accountType === 'seller' ? 'gold' : 'primary'}
              loading={loading}
            >
              {t('signUp')}
            </Button>
          </form>

          <p className="text-xs text-muted text-center mt-4 leading-relaxed">{t('terms')}</p>
        </div>
      </div>
    </div>
  );
}
