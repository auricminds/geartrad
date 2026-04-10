'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/components/providers/StoreProvider';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard, Store, Plus, Package, ShoppingBag,
  ArrowLeft, Trash2, Eye, EyeOff, Star, TrendingUp,
  CheckCircle2, Clock, AlertCircle, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSellerListings, getSellerOrders, toggleListingAvailability,
  deleteListing, getProfile,
} from '@/lib/api';
import type { Listing } from '@/types';
import type { OrderRow } from '@/lib/api';
import type { DbProfile } from '@/lib/supabase';

// Re-export OrderRow from api since it's needed here
export type { OrderRow };

const STATUS_COLORS: Record<string, string> = {
  pending:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  disputed:  'text-red-400 bg-red-500/10 border-red-500/20',
  refunded:  'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending:   Clock,
  completed: CheckCircle2,
  disputed:  AlertCircle,
  refunded:  RefreshCw,
};

export default function DashboardPage() {
  const { user, authLoading } = useStore();
  const locale  = useLocale();
  const router  = useRouter();
  const isRTL   = locale === 'ar';

  const [listings, setListings]   = useState<Listing[]>([]);
  const [orders, setOrders]       = useState<OrderRow[]>([]);
  const [profile, setProfile]     = useState<DbProfile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'orders'>('listings');
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [toggling, setToggling]   = useState<string | null>(null);

  const load = useCallback(async (uid: string) => {
    setLoading(true);
    const [l, o, p] = await Promise.all([
      getSellerListings(uid),
      getSellerOrders(uid),
      getProfile(uid),
    ]);
    setListings(l);
    setOrders(o);
    setProfile(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(`/${locale}/auth/sign-in`); return; }
    if (user.user_metadata?.account_type !== 'seller') {
      router.replace(`/${locale}/profile`);
      return;
    }
    load(user.id);
  }, [user, authLoading, locale, router, load]);

  const handleToggle = async (id: string, current: boolean) => {
    setToggling(id);
    await toggleListingAvailability(id, !current);
    setListings((prev) =>
      prev.map((l) => l.id === id ? { ...l, isAvailable: !current } : l)
    );
    setToggling(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا الإعلان؟' : 'Delete this listing?')) return;
    setDeleting(id);
    await deleteListing(id);
    setListings((prev) => prev.filter((l) => l.id !== id));
    setDeleting(null);
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-5">
        <div className="h-8 w-48 rounded-full bg-white/5 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-surface border border-border animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-surface border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const activeListing  = listings.filter((l) => l.isAvailable).length;
  const soldListings   = listings.filter((l) => !l.isAvailable).length;
  const totalRevenue   = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + (o.amount - o.platform_fee), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
          {isRTL ? 'الملف الشخصي' : 'Profile'}
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple/10 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isRTL ? 'لوحة التحكم' : 'Seller Dashboard'}
            </h1>
            {profile && (
              <p className="text-muted text-sm">
                {isRTL ? `مرحباً، ${profile.username}` : `Welcome, ${profile.username}`}
              </p>
            )}
          </div>
        </div>
        <Link
          href={`/${locale}/sell`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple hover:bg-purple-light text-white text-sm font-semibold transition-all shadow-lg shadow-purple/25"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? 'إعلان جديد' : 'New Listing'}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          {
            icon: Package,
            color: 'text-purple',
            bg: 'bg-purple/10',
            value: activeListing,
            label: isRTL ? 'إعلانات نشطة' : 'Active',
          },
          {
            icon: Store,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            value: soldListings,
            label: isRTL ? 'مباعة' : 'Sold',
          },
          {
            icon: ShoppingBag,
            color: 'text-gold',
            bg: 'bg-gold/10',
            value: orders.length,
            label: isRTL ? 'طلبات' : 'Orders',
          },
          {
            icon: TrendingUp,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            value: profile?.rating ? `${profile.rating}★` : '—',
            label: isRTL ? 'التقييم' : 'Rating',
          },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', stat.bg)}>
              <stat.icon className={cn('w-4 h-4', stat.color)} />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
              <p className="text-[11px] text-muted mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue callout */}
      {totalRevenue > 0 && (
        <div className="mb-6 px-5 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
          <Star className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-emerald-300 text-sm font-medium">
            {isRTL
              ? `إجمالي أرباحك: ${totalRevenue.toLocaleString()} ج.م`
              : `Total earnings: ${totalRevenue.toLocaleString()} EGP`}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface border border-border mb-6 w-fit">
        {([
          { id: 'listings', labelEn: 'My Listings', labelAr: 'إعلاناتي' },
          { id: 'orders',   labelEn: 'Orders',       labelAr: 'الطلبات'  },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-purple text-white shadow-lg shadow-purple/25'
                : 'text-muted hover:text-white'
            )}
          >
            {isRTL ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Listings tab */}
      {activeTab === 'listings' && (
        <div className="space-y-3">
          {listings.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center">
                <Package className="w-7 h-7 text-muted/30" />
              </div>
              <p className="text-white font-semibold">
                {isRTL ? 'لا توجد إعلانات بعد' : 'No listings yet'}
              </p>
              <Link
                href={`/${locale}/sell`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple/10 border border-purple/30 text-purple text-sm font-medium hover:bg-purple/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                {isRTL ? 'أضف أول إعلان' : 'Add your first listing'}
              </Link>
            </div>
          ) : (
            listings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-surface border border-border hover:border-border/80 transition-all"
              >
                {/* Cover image */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
                  <Image
                    src={listing.coverImage}
                    alt={listing.title}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{listing.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted">{listing.game}</span>
                    <span className="text-xs font-bold text-gold">{listing.price.toLocaleString()} EGP</span>
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full border font-medium',
                      listing.isAvailable
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-muted bg-white/5 border-border'
                    )}>
                      {listing.isAvailable
                        ? (isRTL ? 'نشط' : 'Active')
                        : (isRTL ? 'مباع' : 'Sold')}
                    </span>
                    {listing.isBoosted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border text-gold bg-gold/10 border-gold/20 font-medium">
                        {isRTL ? 'مرفوع' : 'Boosted'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    href={`/${locale}/listing/${listing.id}`}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    title={isRTL ? 'عرض' : 'View'}
                  >
                    <Eye className="w-3.5 h-3.5 text-muted" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleToggle(listing.id, listing.isAvailable)}
                    disabled={toggling === listing.id}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-50"
                    title={listing.isAvailable ? (isRTL ? 'إخفاء' : 'Mark Sold') : (isRTL ? 'إظهار' : 'Mark Available')}
                  >
                    {listing.isAvailable
                      ? <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                      : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(listing.id)}
                    disabled={deleting === listing.id}
                    className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-50"
                    title={isRTL ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Orders tab */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-muted/30" />
              </div>
              <p className="text-white font-semibold">
                {isRTL ? 'لا توجد طلبات بعد' : 'No orders yet'}
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const StatusIcon = STATUS_ICONS[order.status] ?? Clock;
              const net = order.amount - order.platform_fee;
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-3 p-3 sm:p-4 rounded-2xl bg-surface border border-border"
                >
                  {order.listing?.cover_image && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0">
                      <Image
                        src={order.listing.cover_image}
                        alt={order.listing.title ?? ''}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {order.listing?.title ?? order.listing_id}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted">
                        {isRTL ? 'المشتري:' : 'Buyer:'} {order.buyer?.username ?? '—'}
                      </span>
                      <span className="text-xs font-bold text-gold">
                        +{net.toLocaleString()} EGP
                      </span>
                    </div>
                  </div>
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border font-medium shrink-0',
                    STATUS_COLORS[order.status] ?? 'text-muted bg-white/5 border-border'
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    {isRTL
                      ? { pending: 'قيد الانتظار', completed: 'مكتمل', disputed: 'نزاع', refunded: 'مسترجع' }[order.status]
                      : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
