'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/components/providers/StoreProvider';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Shield, Heart, MessageCircle, Gamepad2,
  ShoppingBag, LayoutDashboard, Store, LogOut,
  ChevronRight, CheckCircle2, ShoppingCart, Star, Calendar,
  RefreshCw, X, ArrowRight, AlertTriangle, CreditCard, Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// ── Switch Account Modal ──────────────────────────────────────────────────────
function SwitchModal({
  currentType,
  locale,
  onClose,
  onSuccess,
}: {
  currentType: 'buyer' | 'seller';
  locale: string;
  onClose: () => void;
  onSuccess: (newType: 'buyer' | 'seller') => void;
}) {
  const isRTL = locale === 'ar';
  const targetType = currentType === 'buyer' ? 'seller' : 'buyer';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSwitch = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/auth/switch-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ targetType }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (isRTL ? 'حدث خطأ. حاول مرة أخرى.' : 'Something went wrong. Try again.'));
        return;
      }

      // Refresh the session so user_metadata updates in the client
      await supabase.auth.refreshSession();
      onSuccess(targetType);
    } catch {
      setError(isRTL ? 'خطأ في الشبكة. تحقق من اتصالك.' : 'Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const toSeller = targetType === 'seller';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-5 py-4 border-b border-border',
          toSeller ? 'bg-gold/5' : 'bg-purple/5'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', toSeller ? 'bg-gold/15' : 'bg-purple/15')}>
              {toSeller ? <Store className="w-4 h-4 text-gold" /> : <ShoppingBag className="w-4 h-4 text-purple" />}
            </div>
            <h2 className="text-base font-bold text-white">
              {toSeller
                ? (isRTL ? 'التحول إلى حساب بائع' : 'Switch to Seller Account')
                : (isRTL ? 'التحول إلى حساب مشترٍ' : 'Switch to Buyer Account')}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {toSeller ? (
            <>
              <p className="text-sm text-muted leading-relaxed">
                {isRTL
                  ? 'ستتمكن من نشر إعلاناتك وبيع حساباتك وعناصر الألعاب على المنصة.'
                  : 'You\'ll be able to post listings and sell your game accounts and items on the platform.'}
              </p>

              {/* What you get */}
              <div className="space-y-2">
                {[
                  { icon: Store,       text: isRTL ? 'إضافة إعلانات للبيع' : 'Post listings for sale' },
                  { icon: CreditCard,  text: isRTL ? 'استقبال مدفوعات مباشرة' : 'Receive payments directly' },
                  { icon: LayoutDashboard, text: isRTL ? 'لوحة تحكم البائع' : 'Access your seller dashboard' },
                  { icon: Star,        text: isRTL ? 'بناء تقييمك كبائع موثوق' : 'Build your seller reputation' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-white/80">
                    <item.icon className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Payment methods reminder */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {isRTL
                    ? 'ستحتاج إلى إضافة طريقة دفع واحدة على الأقل (فودافون كاش، إنستاباي، إلخ) قبل نشر أول إعلان.'
                    : 'You\'ll need to add at least one payment method (Vodafone Cash, InstaPay, etc.) before posting your first listing.'}
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted leading-relaxed">
                {isRTL
                  ? 'ستعود إلى وضع المشترٍ. ستبقى إعلاناتك الحالية موجودة لكنك لن تتمكن من إضافة إعلانات جديدة.'
                  : 'You\'ll return to buyer mode. Your existing listings will remain but you won\'t be able to post new ones.'}
              </p>

              {/* Warning */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {isRTL
                    ? 'لن تتمكن من نشر إعلانات جديدة أو الوصول إلى لوحة التحكم بعد التحويل.'
                    : 'You won\'t be able to post new listings or access your dashboard after switching.'}
                </span>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:text-white hover:border-border/80 transition-all"
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSwitch}
            disabled={loading}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg disabled:opacity-60',
              toSeller
                ? 'bg-gold hover:bg-gold-light text-black shadow-gold/25'
                : 'bg-purple hover:bg-purple-light text-white shadow-purple/25'
            )}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                {toSeller
                  ? (isRTL ? 'تحول إلى بائع' : 'Become a Seller')
                  : (isRTL ? 'تحول إلى مشترٍ' : 'Switch to Buyer')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Profile Page ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, authLoading, likedIds, signOut, avatarUrl, setAvatarUrl } = useStore();
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';

  const [showSwitch, setShowSwitch] = useState(false);
  const [switchedTo, setSwitchedTo] = useState<'buyer' | 'seller' | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      alert(isRTL ? 'يُسمح بالصور فقط' : 'Images only');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert(isRTL ? 'الحد الأقصى لحجم الصورة 2 ميجابايت' : 'Max image size is 2 MB');
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      setAvatarUrl(publicUrl);
    } catch {
      alert(isRTL ? 'فشل رفع الصورة، حاول مجدداً' : 'Upload failed, please try again');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Loading skeleton ────────────────────────────────
  if (authLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24 md:py-10 space-y-4">
        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-white/5 animate-pulse" />
          <div className="w-32 h-4 rounded-full bg-white/5 animate-pulse" />
          <div className="w-48 h-3 rounded-full bg-white/5 animate-pulse" />
        </div>
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-border/60 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse shrink-0" />
              <div className="flex-1 h-3 rounded-full bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Not logged in ────────────────────────────────────
  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 pb-24 md:py-12">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple to-purple-light rounded-2xl flex items-center justify-center shadow-lg shadow-purple/30 mb-4">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isRTL ? 'مرحباً في GearTrad' : 'Welcome to GearTrad'}
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-xs">
            {isRTL
              ? 'سجّل دخولك للوصول إلى حسابك وإدارة مشترياتك ومبيعاتك'
              : 'Sign in to access your account, manage purchases and listings'}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <Link
            href={`/${locale}/auth/sign-in`}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple hover:bg-purple-light text-white font-semibold text-base shadow-lg shadow-purple/25 transition-all"
          >
            {isRTL ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
          <Link
            href={`/${locale}/auth/sign-up`}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface border border-border text-white font-medium text-base hover:border-purple/40 hover:bg-white/5 transition-all"
          >
            {isRTL ? 'إنشاء حساب جديد' : 'Create Account'}
          </Link>
          <Link
            href={`/${locale}/auth/sign-up?type=seller`}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-black font-semibold text-base shadow-lg shadow-gold/25 transition-all"
          >
            <Store className="w-4 h-4" />
            {isRTL ? 'أصبح بائعاً' : 'Become a Seller'}
          </Link>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {[
            { icon: Shield,       color: 'text-green-400', bg: 'bg-green-500/10', label: isRTL ? 'مدفوعات محمية' : 'Protected Payments' },
            { icon: Star,         color: 'text-gold',       bg: 'bg-gold/10',      label: isRTL ? 'بائعون موثوقون' : 'Verified Sellers' },
            { icon: ShoppingCart, color: 'text-purple',     bg: 'bg-purple/10',    label: isRTL ? 'آلاف الحسابات المميزة' : 'Thousands of Listings' },
          ].map((item, i) => (
            <div key={i} className={cn('flex items-center gap-3 px-5 py-4', i !== 0 && 'border-t border-border/60')}>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', item.bg)}>
                <item.icon className={cn('w-4 h-4', item.color)} />
              </div>
              <span className="text-sm font-medium text-muted">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Logged in ────────────────────────────────────────
  // Use switchedTo state (immediate feedback) or fall back to metadata
  const effectiveType = switchedTo ?? (user.user_metadata?.account_type as 'buyer' | 'seller' | undefined) ?? 'buyer';
  const isSeller = effectiveType === 'seller';

  const displayName = user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(
        locale === 'ar' ? 'ar-EG' : 'en-US',
        { year: 'numeric', month: 'long' }
      )
    : null;

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}`);
  };

  const handleSwitchSuccess = (newType: 'buyer' | 'seller') => {
    setSwitchedTo(newType);
    setShowSwitch(false);
    // Redirect to sell page after becoming a seller so they can set payment methods
    if (newType === 'seller') {
      router.push(`/${locale}/sell`);
    }
  };

  const menuItems = [
    {
      href: `/${locale}/wishlist`,
      icon: Heart,
      label: isRTL ? 'المفضلة' : 'Wishlist',
      badge: likedIds.length > 0 ? likedIds.length : null,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      href: `/${locale}/chat`,
      icon: MessageCircle,
      label: isRTL ? 'الرسائل' : 'Messages',
      badge: null,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      href: `/${locale}/browse`,
      icon: ShoppingBag,
      label: isRTL ? 'تصفح الحسابات' : 'Browse Listings',
      badge: null,
      color: 'text-purple',
      bg: 'bg-purple/10',
    },
    ...(isSeller
      ? [
          {
            href: `/${locale}/sell`,
            icon: Store,
            label: isRTL ? 'إضافة إعلان' : 'New Listing',
            badge: null,
            color: 'text-gold',
            bg: 'bg-gold/10',
          },
          {
            href: `/${locale}/dashboard`,
            icon: LayoutDashboard,
            label: isRTL ? 'لوحة التحكم' : 'Dashboard',
            badge: null,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
          },
        ]
      : []),
  ];

  return (
    <>
      {showSwitch && (
        <SwitchModal
          currentType={effectiveType}
          locale={locale}
          onClose={() => setShowSwitch(false)}
          onSuccess={handleSwitchSuccess}
        />
      )}

      <div className="max-w-lg mx-auto px-4 pt-6 pb-24 md:py-10">

        {/* Avatar + info card */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-4 flex flex-col items-center text-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="group relative w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-purple/30 focus:outline-none"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple to-purple-light flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAvatar
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera className="w-5 h-5 text-white" />}
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            {isSeller && (
              <span className="absolute -bottom-1 -end-1 flex items-center gap-1 px-1.5 py-0.5 bg-gold rounded-full text-background text-[9px] font-bold leading-none">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {isRTL ? 'بائع' : 'Seller'}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">{displayName}</h1>
            <div className="flex items-center justify-center gap-1.5 mt-1 text-muted text-sm">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[220px]">{user.email}</span>
            </div>
          </div>

          {/* Account type badge */}
          <span className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border',
            isSeller
              ? 'bg-gold/10 text-gold border-gold/30'
              : 'bg-purple/10 text-purple border-purple/30'
          )}>
            {isSeller ? <Store className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {isSeller
              ? (isRTL ? 'حساب بائع' : 'Seller Account')
              : (isRTL ? 'حساب مشترٍ' : 'Buyer Account')}
          </span>

          {/* Switch account type button */}
          <button
            type="button"
            onClick={() => setShowSwitch(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all hover:scale-[1.02] active:scale-[0.98]',
              isSeller
                ? 'border-purple/30 text-purple hover:bg-purple/10'
                : 'border-gold/30 text-gold hover:bg-gold/10'
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {isSeller
              ? (isRTL ? 'التحول إلى مشترٍ' : 'Switch to Buyer')
              : (isRTL ? 'التحول إلى بائع' : 'Become a Seller')}
            <ArrowRight className={cn('w-3 h-3', isRTL && 'rotate-180')} />
          </button>

          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Shield className="w-3.5 h-3.5" />
            {isRTL ? 'البريد الإلكتروني موثق' : 'Email verified'}
          </div>

          {memberSince && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Calendar className="w-3.5 h-3.5" />
              {isRTL ? `عضو منذ ${memberSince}` : `Member since ${memberSince}`}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 w-full pt-1 mb-4">
          <div className="bg-background rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-white">{likedIds.length}</p>
            <p className="text-[11px] text-muted mt-0.5">{isRTL ? 'المفضلة' : 'Wishlist'}</p>
          </div>
          <div className="bg-background rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-white">
              {isSeller ? (isRTL ? 'بائع' : 'Seller') : (isRTL ? 'مشترٍ' : 'Buyer')}
            </p>
            <p className="text-[11px] text-muted mt-0.5">{isRTL ? 'نوع الحساب' : 'Account type'}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-4">
          {menuItems.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors',
                i !== 0 && 'border-t border-border/60'
              )}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', item.bg)}>
                <item.icon className={cn('w-4 h-4', item.color)} />
              </div>
              <span className="flex-1 text-sm font-medium text-white">{item.label}</span>
              {item.badge !== null && (
                <span className="min-w-[20px] h-5 px-1.5 bg-purple rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
              <ChevronRight className={cn('w-4 h-4 text-muted/50', isRTL && 'rotate-180')} />
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-500/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-red-400" />
            </div>
            <span className="flex-1 text-sm font-medium text-red-400 text-start">
              {isRTL ? 'تسجيل الخروج' : 'Sign Out'}
            </span>
          </button>
        </div>

      </div>
    </>
  );
}
