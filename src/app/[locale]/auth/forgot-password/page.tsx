'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Gamepad2, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const locale  = useLocale();
  const isRTL   = locale === 'ar';

  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [sent, setSent]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(isRTL ? 'يرجى إدخال بريدك الإلكتروني' : 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/${locale}/auth/reset-password` }
      );

      if (authError) {
        setError(isRTL ? 'حدث خطأ، تحقق من البريد الإلكتروني وحاول مرة أخرى' : 'Something went wrong. Check your email and try again.');
        return;
      }

      setSent(true);
    } catch {
      setError(isRTL ? 'خطأ في الشبكة، تحقق من اتصالك وحاول مرة أخرى' : 'Network error. Check your connection and try again.');
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

          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">
                {isRTL ? 'تم الإرسال!' : 'Email Sent!'}
              </h1>
              <p className="text-muted text-sm mb-6 leading-relaxed">
                {isRTL
                  ? `أرسلنا رابط إعادة تعيين كلمة المرور إلى ${email}. تحقق من صندوق الوارد.`
                  : `We sent a password reset link to ${email}. Check your inbox.`}
              </p>
              <Link
                href={`/${locale}/auth/sign-in`}
                className="inline-flex items-center gap-2 text-purple hover:text-purple-light text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white text-center mb-1">
                {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
              </h1>
              <p className="text-muted text-sm text-center mb-6">
                {isRTL
                  ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين'
                  : "Enter your email and we'll send you a reset link"}
              </p>

              {error && (
                <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-muted">
                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full bg-background border border-border rounded-xl ps-10 pe-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  {isRTL ? 'إرسال رابط الاستعادة' : 'Send Reset Link'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href={`/${locale}/auth/sign-in`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-purple transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {isRTL ? 'العودة لتسجيل الدخول' : 'Back to Sign In'}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
