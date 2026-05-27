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
  CheckCircle2, Clock, AlertCircle, RefreshCw, Wallet, ExternalLink, Save, MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getSellerListings, getSellerOrders, toggleListingAvailability,
  deleteListing, getProfile, updateSellerPaymentDetails,
} from '@/lib/api';
import type { Listing } from '@/types';
import type { OrderRow } from '@/lib/api';
import type { DbProfile } from '@/lib/supabase';

// Re-export OrderRow from api since it's needed here
export type { OrderRow };

const STATUS_COLORS: Record<string, string> = {
  pending:         'text-amber-400 bg-amber-500/10 border-amber-500/20',
  proof_submitted: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  completed:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  disputed:        'text-red-400 bg-red-500/10 border-red-500/20',
  refunded:        'text-blue-400 bg-blue-500/10 border-blue-500/20',
  cancelled:       'text-muted bg-white/5 border-border',
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
  const [activeTab, setActiveTab] = useState<'listings' | 'orders' | 'payment'>('listings');
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [toggling, setToggling]       = useState<string | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);
  const [confirmedOrders, setConfirmedOrders] = useState<Set<string>>(new Set());

  // Payment settings state
  const [instapayId, setInstapayId]   = useState('');
  const [vodafoneNum, setVodafoneNum] = useState('');
  const [orangeNum, setOrangeNum]     = useState('');
  const [walletUsdt, setWalletUsdt]   = useState('');
  const [walletBtc, setWalletBtc]     = useState('');
  const [walletEth, setWalletEth]     = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);

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
    // Pre-fill payment settings
    if (p) {
      const pp = p as typeof p & {
        instapay_id?: string; vodafone_number?: string; orange_number?: string;
        crypto_wallet_usdt?: string; crypto_wallet_btc?: string; crypto_wallet_eth?: string;
      };
      setInstapayId(pp.instapay_id ?? '');
      setVodafoneNum(pp.vodafone_number ?? '');
      setOrangeNum(pp.orange_number ?? '');
      setWalletUsdt(pp.crypto_wallet_usdt ?? '');
      setWalletBtc(pp.crypto_wallet_btc ?? '');
      setWalletEth(pp.crypto_wallet_eth ?? '');
    }
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

  const handleConfirmOrder = async (orderId: string) => {
    if (!user || confirmingOrder) return;
    setConfirmingOrder(orderId);
    const res = await fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, sellerId: user.id }),
    });
    if (res.ok) {
      setConfirmedOrders((prev) => { const s = new Set(prev); s.add(orderId); return s; });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, payment_status: 'paid', status: 'completed' } : o));
    }
    setConfirmingOrder(null);
  };

  const handleSavePaymentSettings = async () => {
    if (!user) return;
    setSavingPayment(true);
    await updateSellerPaymentDetails(user.id, {
      instapay_id:         instapayId.trim() || undefined,
      vodafone_number:     vodafoneNum.trim() || undefined,
      orange_number:       orangeNum.trim() || undefined,
      crypto_wallet_usdt:  walletUsdt.trim() || undefined,
      crypto_wallet_btc:   walletBtc.trim() || undefined,
      crypto_wallet_eth:   walletEth.trim() || undefined,
    });
    setSavingPayment(false);
    setPaymentSaved(true);
    setTimeout(() => setPaymentSaved(false), 3000);
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
    .reduce((sum, o) => sum + o.amount, 0);

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
      <div className="flex gap-1 p-1 rounded-xl bg-surface border border-border mb-6 w-fit flex-wrap">
        {([
          { id: 'listings', labelEn: 'My Listings',      labelAr: 'إعلاناتي' },
          { id: 'orders',   labelEn: 'Orders',            labelAr: 'الطلبات'  },
          { id: 'payment',  labelEn: 'Payment Settings',  labelAr: 'إعدادات الدفع' },
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
              const isProofSubmitted = order.payment_status === 'proof_submitted';
              const isCompleted = order.status === 'completed' || confirmedOrders.has(order.id);
              const StatusIcon = STATUS_ICONS[isCompleted ? 'completed' : order.status] ?? Clock;
              const statusKey = isCompleted ? 'completed' : (order.payment_status ?? order.status);

              return (
                <div
                  key={order.id}
                  className={cn(
                    'rounded-2xl bg-surface border overflow-hidden',
                    isProofSubmitted && !isCompleted ? 'border-blue-500/30' : 'border-border'
                  )}
                >
                  <div className="flex items-center gap-3 p-3 sm:p-4">
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
                          +{order.amount.toLocaleString()} EGP
                        </span>
                        <span className="text-xs text-muted capitalize">{order.payment_method}</span>
                      </div>
                    </div>
                    <span className={cn(
                      'inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border font-medium shrink-0',
                      STATUS_COLORS[statusKey] ?? 'text-muted bg-white/5 border-border'
                    )}>
                      <StatusIcon className="w-3 h-3" />
                      {isCompleted
                        ? (isRTL ? 'مكتمل' : 'Completed')
                        : isProofSubmitted
                          ? (isRTL ? 'إثبات مُرسَل' : 'Proof Submitted')
                          : (isRTL ? 'قيد الانتظار' : order.status.charAt(0).toUpperCase() + order.status.slice(1))}
                    </span>
                  </div>

                  {/* Proof submitted — seller action required */}
                  {isProofSubmitted && !isCompleted && (
                    <div className="border-t border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
                      <p className="text-xs font-semibold text-blue-400">
                        {isRTL ? '⚡ المشتري أرسل إثبات الدفع — تحقق وأكد الاستلام' : '⚡ Buyer submitted payment proof — review and confirm'}
                      </p>
                      {order.payment_reference && (
                        <p className="text-xs text-muted">
                          {isRTL ? 'رقم المرجع:' : 'Reference:'}{' '}
                          <span className="text-white font-mono">{order.payment_reference}</span>
                        </p>
                      )}
                      {order.payment_proof_url && (
                        <a
                          href={order.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {isRTL ? 'عرض لقطة الإثبات' : 'View proof screenshot'}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleConfirmOrder(order.id)}
                        disabled={!!confirmingOrder}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {confirmingOrder === order.id
                          ? (isRTL ? 'جاري التأكيد...' : 'Confirming...')
                          : (isRTL ? 'تأكيد استلام الدفع — إرسال بيانات الدخول للمشتري' : 'Confirm Payment Received — Release Credentials')}
                      </button>
                    </div>
                  )}

                  {/* Message Buyer */}
                  {order.status !== 'cancelled' && (
                    <div className="px-4 pb-3">
                      <Link
                        href={`/${locale}/chat?listing=${order.listing_id}`}
                        className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-white transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {isRTL ? 'مراسلة المشتري' : 'Message Buyer'}
                      </Link>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Payment Settings tab */}
      {activeTab === 'payment' && (
        <div className="space-y-6 max-w-lg">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-purple/5 border border-purple/20">
            <Wallet className="w-4 h-4 text-purple shrink-0 mt-0.5" />
            <p className="text-xs text-muted leading-relaxed">
              {isRTL
                ? 'أضف تفاصيل الدفع حتى يتمكن المشترون من إرسال المبالغ إليك. بدون هذه البيانات لا يمكنهم إتمام الشراء.'
                : 'Add your payment details so buyers can send you money. Without these, buyers cannot complete a purchase from you.'}
            </p>
          </div>

          {/* Local payments */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {isRTL ? 'محافظ محلية' : 'Local Payments'}
            </h3>
            {[
              { label: 'InstaPay ID', labelAr: 'معرف إنستاباي', val: instapayId, set: setInstapayId, placeholder: 'your-instapay-id' },
              { label: 'Vodafone Cash Number', labelAr: 'رقم فودافون كاش', val: vodafoneNum, set: setVodafoneNum, placeholder: '01XXXXXXXXX' },
              { label: 'Orange Money Number', labelAr: 'رقم أورانج موني', val: orangeNum, set: setOrangeNum, placeholder: '01XXXXXXXXX' },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-xs text-muted mb-1.5">
                  {isRTL ? field.labelAr : field.label}
                </label>
                <input
                  type="text"
                  value={field.val}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all"
                />
              </div>
            ))}
          </div>

          {/* Crypto wallets */}
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {isRTL ? 'محافظ العملات الرقمية' : 'Crypto Wallets'}
            </h3>
            {[
              { label: 'USDT Wallet (TRC20)', labelAr: 'محفظة USDT (TRC20)', val: walletUsdt, set: setWalletUsdt, placeholder: 'T...' },
              { label: 'Bitcoin (BTC) Wallet', labelAr: 'محفظة بيتكوين (BTC)', val: walletBtc, set: setWalletBtc, placeholder: 'bc1q...' },
              { label: 'Ethereum (ETH) Wallet', labelAr: 'محفظة إيثيريوم (ETH)', val: walletEth, set: setWalletEth, placeholder: '0x...' },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-xs text-muted mb-1.5">
                  {isRTL ? field.labelAr : field.label}
                </label>
                <input
                  type="text"
                  value={field.val}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted font-mono focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSavePaymentSettings}
            disabled={savingPayment}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple hover:bg-purple-light text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-purple/25"
          >
            {paymentSaved
              ? <><CheckCircle2 className="w-4 h-4" />{isRTL ? 'تم الحفظ!' : 'Saved!'}</>
              : savingPayment
                ? (isRTL ? 'جاري الحفظ...' : 'Saving...')
                : <><Save className="w-4 h-4" />{isRTL ? 'حفظ إعدادات الدفع' : 'Save Payment Settings'}</>}
          </button>
        </div>
      )}
    </div>
  );
}
