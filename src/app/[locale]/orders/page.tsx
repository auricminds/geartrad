'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/components/providers/StoreProvider';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag, Clock, CheckCircle2, AlertCircle, RefreshCw,
  Shield, Eye, EyeOff, Copy, Check, ArrowLeft, Lock, ExternalLink,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { getBuyerOrders } from '@/lib/api';
import type { OrderRow } from '@/lib/api';

type Credentials = {
  account_email: string | null;
  account_password: string | null;
  account_extra_info: string | null;
};

// How long buyer has to confirm delivery before auto-void warning triggers (72h)
const CONFIRM_WINDOW_MS = 72 * 60 * 60 * 1000;

function timeLeft(createdAt: string): string {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  const remaining = CONFIRM_WINDOW_MS - elapsed;
  if (remaining <= 0) return 'Expired';
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return `${hours}h ${minutes}m left`;
}

export default function OrdersPage() {
  const { user, authLoading } = useStore();
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === 'ar';

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [credentials, setCredentials] = useState<Record<string, Credentials>>({});
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState('');

  const load = useCallback(async (uid: string) => {
    setLoading(true);
    const data = await getBuyerOrders(uid);
    setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { router.push(`/${locale}/auth/sign-in`); return; }
    if (user) load(user.id);
  }, [user, authLoading, locale, router, load]);

  const handleRevealCredentials = async (order: OrderRow) => {
    if (!user) return;
    if (credentials[order.id]) {
      setRevealedIds((prev) => { const s = new Set(prev); s.add(order.id); return s; });
      return;
    }

    const res = await fetch(`/api/orders/credentials?orderId=${order.id}&buyerId=${user.id}`);
    const data = await res.json();

    if (res.ok) {
      setCredentials((prev) => ({ ...prev, [order.id]: data }));
      setRevealedIds((prev) => { const s = new Set(prev); s.add(order.id); return s; });
    } else {
      alert(data.error ?? 'Could not retrieve credentials');
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    if (!user || confirmingId) return;
    setConfirmingId(orderId);

    const res = await fetch('/api/payment/paymob/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, buyerId: user.id }),
    });

    if (res.ok) {
      setConfirmedIds((prev) => { const s = new Set(prev); s.add(orderId); return s; });
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, payment_status: 'delivered', status: 'completed' } : o)
      );
    } else {
      const { error } = await res.json();
      alert(error ?? 'Confirmation failed. Please contact support.');
    }
    setConfirmingId(null);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-surface border border-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link href={`/${locale}/profile`} className="inline-flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm mb-8">
        <ArrowLeft className={cn('w-4 h-4', isAr && 'rotate-180')} />
        {isAr ? 'رجوع' : 'Back'}
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-purple/10 border border-purple/20">
          <ShoppingBag className="w-5 h-5 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{isAr ? 'مشترياتي' : 'My Orders'}</h1>
          <p className="text-sm text-muted">{isAr ? 'تتبع طلباتك وأكد الاستلام' : 'Track your purchases and confirm delivery'}</p>
        </div>
      </div>

      {/* Escrow explanation banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 mb-8">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-400 mb-1">
            {isAr ? 'أموالك محمية بنظام الضمان' : 'Your money is protected by Escrow'}
          </p>
          <p className="text-xs text-muted leading-relaxed">
            {isAr
              ? 'دفعتك محجوزة ولن تصل للبائع حتى تضغط "تأكيد الاستلام". إذا لم يُسلّم البائع، افتح تذكرة دعم ونسترد لك المبلغ.'
              : "Your payment is held and won't reach the seller until you press \"Confirm Delivery\". If the seller doesn't deliver, open a support ticket and we'll refund you."}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">{isAr ? 'لا توجد مشتريات بعد' : 'No orders yet'}</p>
          <Link href={`/${locale}/browse`} className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-purple hover:bg-purple-light text-white text-sm font-medium transition-all">
            {isAr ? 'تصفح الإعلانات' : 'Browse Listings'}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isPaid = order.payment_status === 'paid' || order.payment_status === 'delivered' || order.status === 'completed';
            const isDelivered = order.payment_status === 'delivered' || order.status === 'completed';
            const isRefunded = order.payment_status === 'refunded' || order.status === 'refunded';
            const alreadyConfirmed = confirmedIds.has(order.id) || isDelivered;
            const creds = credentials[order.id];
            const revealed = revealedIds.has(order.id);

            return (
              <div key={order.id} className={cn(
                'rounded-2xl border bg-surface overflow-hidden',
                alreadyConfirmed ? 'border-emerald-500/20' : isRefunded ? 'border-border' : isPaid ? 'border-purple/30' : 'border-border'
              )}>
                {/* Order header */}
                <div className="flex items-center gap-4 p-5 border-b border-border/50">
                  {order.listing?.cover_image && (
                    <img
                      src={order.listing.cover_image}
                      alt={order.listing.title ?? ''}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{order.listing?.title ?? 'Listing'}</p>
                    <p className="text-xs text-muted mt-0.5">{order.listing?.game}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {isAr ? 'البائع:' : 'Seller:'} <span className="text-white/70">{order.seller?.username ?? '—'}</span>
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-sm font-bold text-white">{formatPrice(order.amount, locale)}</p>
                    <OrderStatusBadge order={order} isAr={isAr} />
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">

                  {/* Credentials section — only if paid and it's an account */}
                  {isPaid && !isRefunded && (
                    <div>
                      {!revealed ? (
                        <button
                          type="button"
                          onClick={() => handleRevealCredentials(order)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple/10 border border-purple/30 text-purple hover:bg-purple/20 transition-all text-sm font-medium"
                        >
                          <Lock className="w-4 h-4" />
                          {isAr ? 'عرض بيانات الدخول للحساب' : 'Reveal Account Credentials'}
                        </button>
                      ) : creds ? (
                        <div className="rounded-xl border border-purple/30 bg-purple/5 overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-purple/20 bg-purple/10">
                            <Lock className="w-3.5 h-3.5 text-purple" />
                            <span className="text-xs font-semibold text-purple uppercase tracking-wider">
                              {isAr ? 'بيانات الدخول — احتفظ بها في مكان آمن' : 'Account Credentials — Keep these safe'}
                            </span>
                          </div>
                          <div className="p-4 space-y-3">
                            <CredRow
                              label={isAr ? 'البريد الإلكتروني' : 'Email'}
                              value={creds.account_email ?? ''}
                              copyKey={`email-${order.id}`}
                              copied={copied}
                              onCopy={copyToClipboard}
                            />
                            <CredRow
                              label={isAr ? 'كلمة المرور' : 'Password'}
                              value={creds.account_password ?? ''}
                              copyKey={`pass-${order.id}`}
                              copied={copied}
                              onCopy={copyToClipboard}
                              isPassword
                              showPassword={showPass[order.id] ?? false}
                              onTogglePassword={() => setShowPass((p) => ({ ...p, [order.id]: !p[order.id] }))}
                            />
                            {creds.account_extra_info && (
                              <div>
                                <p className="text-xs text-muted mb-1">{isAr ? 'معلومات إضافية' : 'Extra Info'}</p>
                                <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{creds.account_extra_info}</p>
                              </div>
                            )}
                          </div>
                          <div className="px-4 pb-3">
                            <p className="text-[10px] text-muted/60">
                              {isAr
                                ? '⚠ لا تشارك هذه البيانات مع أي شخص آخر. تواصل مع البائع عبر الدردشة إذا احتجت مساعدة.'
                                : '⚠ Do not share these credentials with anyone. Chat the seller if you need help logging in.'}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Confirm delivery CTA */}
                  {isPaid && !alreadyConfirmed && !isRefunded && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>{isAr ? 'وقت التأكيد المتبقي:' : 'Confirmation window:'}</span>
                        <span className="text-amber-400 font-medium">{timeLeft(order.created_at)}</span>
                      </div>
                      <button
                        type="button"
                        disabled={!!confirmingId}
                        onClick={() => handleConfirmDelivery(order.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {confirmingId === order.id
                          ? (isAr ? 'جاري التأكيد...' : 'Confirming...')
                          : (isAr ? 'تأكيد الاستلام — دفع للبائع' : 'Confirm Delivery — Release Payment')}
                      </button>
                      <p className="text-[10px] text-muted text-center leading-relaxed">
                        {isAr
                          ? 'اضغط هذا الزر فقط بعد التحقق من أن الحساب يعمل بشكل صحيح.'
                          : 'Only press this after verifying the account works. This action releases payment to the seller.'}
                      </p>
                    </div>
                  )}

                  {/* Confirmed state */}
                  {alreadyConfirmed && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <p className="text-xs text-emerald-400">
                        {isAr ? 'تم تأكيد الاستلام. تم دفع البائع.' : 'Delivery confirmed. Seller has been paid.'}
                      </p>
                    </div>
                  )}

                  {/* Dispute option */}
                  {isPaid && !alreadyConfirmed && !isRefunded && (
                    <Link
                      href={`/${locale}/support`}
                      className="flex items-center justify-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      {isAr ? 'البائع لم يُسلّم — افتح تذكرة نزاع' : "Seller didn't deliver — Open a dispute"}
                    </Link>
                  )}

                  {/* Refunded state */}
                  {isRefunded && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <RefreshCw className="w-4 h-4 text-blue-400 shrink-0" />
                      <p className="text-xs text-blue-400">
                        {isAr ? 'تم إلغاء هذا الطلب وإعادة المبلغ.' : 'This order was cancelled and refunded.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderStatusBadge({ order, isAr }: { order: OrderRow; isAr: boolean }) {
  const status = order.payment_status ?? order.status;
  const map: Record<string, { label: string; labelAr: string; cls: string; icon: typeof Clock }> = {
    pending:   { label: 'Payment Pending', labelAr: 'بانتظار الدفع', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Clock },
    paid:      { label: 'Awaiting Delivery', labelAr: 'بانتظار التسليم', cls: 'text-purple bg-purple/10 border-purple/20', icon: Clock },
    delivered: { label: 'Completed', labelAr: 'مكتمل', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
    completed: { label: 'Completed', labelAr: 'مكتمل', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
    refunded:  { label: 'Refunded', labelAr: 'مُسترجع', cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: RefreshCw },
    failed:    { label: 'Failed', labelAr: 'فشل', cls: 'text-red-400 bg-red-500/10 border-red-500/20', icon: AlertCircle },
    disputed:  { label: 'Disputed', labelAr: 'نزاع', cls: 'text-red-400 bg-red-500/10 border-red-500/20', icon: AlertCircle },
  };
  const s = map[status] ?? map.pending;
  const Icon = s.icon;
  return (
    <span className={cn('mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border', s.cls)}>
      <Icon className="w-2.5 h-2.5" />
      {isAr ? s.labelAr : s.label}
    </span>
  );
}

function CredRow({
  label, value, copyKey, copied, onCopy, isPassword, showPassword, onTogglePassword,
}: {
  label: string; value: string; copyKey: string; copied: string;
  onCopy: (text: string, key: string) => void;
  isPassword?: boolean; showPassword?: boolean; onTogglePassword?: () => void;
}) {
  const display = isPassword && !showPassword ? '•'.repeat(Math.min(value.length, 16)) : value;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted mb-0.5">{label}</p>
        <p className="text-xs text-white font-mono break-all">{display}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isPassword && onTogglePassword && (
          <button type="button" onClick={onTogglePassword} className="p-1.5 rounded-lg text-muted hover:text-white transition-colors">
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          type="button"
          onClick={() => onCopy(value, copyKey)}
          className={cn('p-1.5 rounded-lg transition-colors', copied === copyKey ? 'text-emerald-400' : 'text-muted hover:text-white')}
        >
          {copied === copyKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
