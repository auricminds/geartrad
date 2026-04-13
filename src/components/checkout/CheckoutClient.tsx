'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, Smartphone, Building2, CheckCircle2, ArrowLeft,
  Wallet, Copy, Check, AlertCircle, Lock, ExternalLink,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useStore } from '@/components/providers/StoreProvider';

interface CheckoutClientProps {
  locale: string;
  listingId: string;
  sellerId: string;
  total: number;
  platformFee: number;
}

type PaymentMethod = 'card' | 'vodafone' | 'instapay' | 'btc' | 'usdt' | 'eth';

const PAYMENT_METHODS: {
  id: PaymentMethod;
  icon: React.ElementType;
  labelEn: string;
  labelAr: string;
  group: 'local' | 'crypto';
  badgeEn?: string;
  badgeAr?: string;
}[] = [
  {
    id: 'card', icon: CreditCard,
    labelEn: 'Credit / Debit Card', labelAr: 'بطاقة ائتمان / خصم',
    group: 'local',
    badgeEn: 'Visa · Mastercard · International', badgeAr: 'فيزا · ماستركارد · دولي',
  },
  {
    id: 'vodafone', icon: Smartphone,
    labelEn: 'Vodafone Cash', labelAr: 'فودافون كاش',
    group: 'local',
  },
  {
    id: 'instapay', icon: Building2,
    labelEn: 'InstaPay', labelAr: 'إنستاباي',
    group: 'local',
  },
  { id: 'btc',  icon: Wallet, labelEn: 'Bitcoin (BTC)',    labelAr: 'بيتكوين (BTC)',   group: 'crypto' },
  { id: 'usdt', icon: Wallet, labelEn: 'USDT (TRC20)',     labelAr: 'USDT (TRC20)',      group: 'crypto' },
  { id: 'eth',  icon: Wallet, labelEn: 'Ethereum (ETH)',   labelAr: 'إيثيريوم (ETH)',   group: 'crypto' },
];

const CRYPTO_ADDRESSES: Record<string, string> = {
  btc:  process.env.NEXT_PUBLIC_WALLET_BTC  ?? 'bc1qYOURBITCOINADDRESS',
  usdt: process.env.NEXT_PUBLIC_WALLET_USDT ?? 'TYOURUSDTTRC20ADDRESS',
  eth:  process.env.NEXT_PUBLIC_WALLET_ETH  ?? '0xYOUREthereumAddress',
};

const CRYPTO_LABELS: Record<string, string> = { btc: 'BTC', usdt: 'USDT (TRC20)', eth: 'ETH' };

export function CheckoutClient({ locale, listingId, sellerId, total, platformFee }: CheckoutClientProps) {
  const router = useRouter();
  const { user } = useStore();

  const [method, setMethod]         = useState<PaymentMethod>('card');
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [copied, setCopied]         = useState(false);
  const [error, setError]           = useState('');
  const [phone, setPhone]           = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const isAr    = locale === 'ar';
  const isCrypto = ['btc', 'usdt', 'eth'].includes(method);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    if (!user) {
      router.push(`/${locale}/auth/sign-in`);
      return;
    }

    setError('');
    setLoading(true);

    try {
      // ── Crypto: just show the address (already visible), mark order ───────
      if (isCrypto) {
        const res = await fetch('/api/payment/paymob/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId,
            buyerId: user.id,
            paymentMethod: method,
            amount: total,
            platformFee,
            buyerEmail: user.email ?? '',
          }),
        });
        if (!res.ok) throw new Error('order_failed');
        setDone(true);
        return;
      }

      // ── InstaPay: manual confirmation ─────────────────────────────────────
      if (method === 'instapay') {
        setDone(true);
        return;
      }

      // ── Paymob (card or vodafone) ─────────────────────────────────────────
      if (method === 'vodafone' && !phone.trim()) {
        setError(isAr ? 'أدخل رقم الهاتف أولاً' : 'Enter your phone number first');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/payment/paymob/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          buyerId: user.id,
          paymentMethod: method === 'vodafone' ? 'vodafone' : 'card',
          amount: total,
          platformFee,
          buyerEmail: user.email ?? '',
          buyerPhone: phone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? (isAr ? 'فشل الدفع، حاول مرة أخرى' : 'Payment failed. Try again.'));
        return;
      }

      // Redirect to Paymob's secure hosted checkout page
      setRedirecting(true);
      window.location.href = data.checkoutUrl;
    } catch {
      setError(isAr ? 'خطأ في الشبكة، تحقق من اتصالك وحاول مرة أخرى' : 'Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            {isAr ? 'تم تسجيل طلبك!' : 'Order Registered!'}
          </h2>
          <p className="text-muted text-sm leading-relaxed max-w-sm">
            {isCrypto
              ? (isAr ? 'أرسل المبلغ إلى العنوان أدناه وأرسل لنا إثبات الدفع عبر الدردشة.' : 'Send the amount to the address shown and send us payment proof via chat.')
              : (isAr ? 'سيتواصل معك البائع خلال 24 ساعة. المبلغ محمي حتى تؤكد الاستلام.' : 'The seller will contact you within 24 hours. Your payment is held securely until you confirm delivery.')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <Link
            href={`/${locale}/chat?listing=${listingId}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-surface hover:bg-surface-light text-white border border-border transition-all"
          >
            {isAr ? 'تواصل مع البائع' : 'Message Seller'}
          </Link>
          <Link
            href={`/${locale}/browse`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-purple hover:bg-purple-light text-white shadow-lg shadow-purple/25 transition-all"
          >
            {isAr ? 'متابعة التسوق' : 'Continue Browsing'}
          </Link>
        </div>
      </div>
    );
  }

  const localMethods  = PAYMENT_METHODS.filter((p) => p.group === 'local');
  const cryptoMethods = PAYMENT_METHODS.filter((p) => p.group === 'crypto');

  return (
    <div className="space-y-5">
      <Link
        href={`/${locale}/listing/${listingId}`}
        className="inline-flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className={cn('w-4 h-4', isAr && 'rotate-180')} />
        {isAr ? 'رجوع للإعلان' : 'Back to listing'}
      </Link>

      {!user && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {isAr ? 'يجب تسجيل الدخول أولاً للإتمام الشراء. ' : 'You must sign in before completing your purchase. '}
            <Link href={`/${locale}/auth/sign-in`} className="underline font-medium">
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Payment method */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            {isAr ? 'طريقة الدفع' : 'Payment Method'}
          </h2>
          <div className="flex items-center gap-1 text-emerald-400 text-xs">
            <Lock className="w-3 h-3" />
            <span>{isAr ? 'آمن ومشفر' : 'Secure & Encrypted'}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted mb-2 uppercase tracking-wider">{isAr ? 'دفع محلي' : 'Local Payments'}</p>
          <div className="space-y-2">
            {localMethods.map((pm) => (
              <MethodRow key={pm.id} pm={pm} selected={method === pm.id} locale={locale} onSelect={() => setMethod(pm.id)} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted mb-2 uppercase tracking-wider">{isAr ? 'عملات رقمية' : 'Crypto'}</p>
          <div className="space-y-2">
            {cryptoMethods.map((pm) => (
              <MethodRow key={pm.id} pm={pm} selected={method === pm.id} locale={locale} onSelect={() => setMethod(pm.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* Vodafone phone input */}
      {method === 'vodafone' && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">{isAr ? 'رقم فودافون كاش' : 'Vodafone Cash Number'}</h2>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            maxLength={11}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all"
          />
          <p className="text-xs text-muted">
            {isAr ? 'سيتم إرسال طلب الدفع لهذا الرقم عبر Paymob.' : 'A payment request will be sent to this number via Paymob.'}
          </p>
        </div>
      )}

      {/* InstaPay instructions */}
      {method === 'instapay' && (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-sm text-muted leading-relaxed">
            {isAr
              ? 'اضغط تأكيد ثم أرسل المبلغ عبر InstaPay إلى حساب GearTrad وأرسل لقطة شاشة تأكيداً عبر الدردشة.'
              : 'Press confirm, then send the amount via InstaPay to GearTrad\'s account and send a screenshot as confirmation via chat.'}
          </p>
        </div>
      )}

      {/* Crypto address */}
      {isCrypto && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            {isAr ? `عنوان المحفظة — ${CRYPTO_LABELS[method]}` : `${CRYPTO_LABELS[method]} Wallet Address`}
          </h2>
          <div className="flex gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-400 text-base shrink-0 mt-0.5">⚠</span>
            <p className="text-xs text-amber-300 leading-relaxed">
              {isAr
                ? `تأكد من إرسال ${CRYPTO_LABELS[method]} فقط إلى هذا العنوان. إرسال عملة مختلفة قد يؤدي لضياع الأموال نهائياً.`
                : `Send only ${CRYPTO_LABELS[method]} to this address. Sending a different coin may result in permanent loss of funds.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-border">
              <p className="text-xs text-muted mb-1">{isAr ? 'العنوان' : 'Address'}</p>
              <p className="text-xs text-white font-mono break-all leading-relaxed">{CRYPTO_ADDRESSES[method]}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(CRYPTO_ADDRESSES[method])}
              className={cn(
                'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all border',
                copied
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border-border text-muted hover:text-white hover:bg-white/10'
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Card redirect note */}
      {method === 'card' && (
        <div className="flex items-center gap-2 text-xs text-muted px-1">
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isAr
              ? 'سيتم تحويلك لصفحة Paymob الآمنة لإدخال بيانات البطاقة.'
              : "You'll be redirected to Paymob's secure page to enter your card details."}
          </span>
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handleConfirm}
        loading={loading || redirecting}
        disabled={loading || redirecting || !user}
      >
        {redirecting
          ? (isAr ? 'جاري التحويل...' : 'Redirecting to Paymob...')
          : loading
            ? (isAr ? 'جاري المعالجة...' : 'Processing...')
            : (isAr ? `تأكيد الدفع — ${formatPrice(total, locale)}` : `Confirm Payment — ${formatPrice(total, locale)}`)}
      </Button>

      {/* Paymob powered by badge */}
      <p className="text-center text-xs text-muted/60">
        {isAr ? 'المدفوعات المحلية مدعومة من' : 'Local payments powered by'}{' '}
        <span className="text-white/40 font-medium">Paymob</span>
        {' '}· {isAr ? 'مرخص من البنك المركزي المصري' : 'Licensed by the Central Bank of Egypt'}
      </p>
    </div>
  );
}

function MethodRow({
  pm, selected, locale, onSelect,
}: {
  pm: (typeof PAYMENT_METHODS)[number];
  selected: boolean;
  locale: string;
  onSelect: () => void;
}) {
  const isAr = locale === 'ar';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-start',
        selected ? 'bg-purple/10 border-purple text-white' : 'border-border text-muted hover:border-purple/30 hover:text-white'
      )}
    >
      <pm.icon className="w-4 h-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium block">{isAr ? pm.labelAr : pm.labelEn}</span>
        {pm.badgeEn && (
          <span className="text-[10px] text-muted block mt-0.5">{isAr ? pm.badgeAr : pm.badgeEn}</span>
        )}
      </div>
      <span className={cn('w-4 h-4 rounded-full border-2 shrink-0 transition-all', selected ? 'border-purple bg-purple' : 'border-border')} />
    </button>
  );
}
