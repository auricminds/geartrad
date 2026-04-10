'use client';

import { useStore } from '@/components/providers/StoreProvider';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Mail, Shield, Heart, MessageCircle, Gamepad2,
  ShoppingBag, LayoutDashboard, Store, LogOut,
  ChevronRight, CheckCircle2, ShoppingCart, Star, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, authLoading, likedIds, signOut } = useStore();
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';

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

  // ── Not logged in — show auth options ──────────────
  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 pb-24 md:py-12">
        {/* Header */}
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

        {/* Auth buttons */}
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

        {/* Feature highlights */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          {[
            { icon: Shield,      color: 'text-green-400',  bg: 'bg-green-500/10', label: isRTL ? 'مدفوعات محمية' : 'Protected Payments' },
            { icon: Star,        color: 'text-gold',        bg: 'bg-gold/10',      label: isRTL ? 'بائعون موثوقون' : 'Verified Sellers' },
            { icon: ShoppingCart, color: 'text-purple',    bg: 'bg-purple/10',    label: isRTL ? 'آلاف الحسابات المميزة' : 'Thousands of Listings' },
          ].map((item, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 px-5 py-4',
                i !== 0 && 'border-t border-border/60'
              )}
            >
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

  // ── Logged in ───────────────────────────────────────
  const displayName = user.user_metadata?.username ?? user.email?.split('@')[0] ?? 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const isSeller = user.user_metadata?.account_type === 'seller';

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
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 md:py-10">

      {/* Avatar + info card */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-4 flex flex-col items-center text-center gap-3">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple to-purple-light flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple/30">
            {initials}
          </div>
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
      <div className="grid grid-cols-2 gap-3 w-full pt-1">
        <div className="bg-background rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">{likedIds.length}</p>
          <p className="text-[11px] text-muted mt-0.5">
            {isRTL ? 'المفضلة' : 'Wishlist'}
          </p>
        </div>
        <div className="bg-background rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">
            {isSeller ? (isRTL ? 'بائع' : 'Seller') : (isRTL ? 'مشترٍ' : 'Buyer')}
          </p>
          <p className="text-[11px] text-muted mt-0.5">
            {isRTL ? 'نوع الحساب' : 'Account type'}
          </p>
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
  );
}
