'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Smartphone, Building2, CheckCircle2, ArrowLeft, Wallet, Copy, Check, AlertCircle } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createOrder } from '@/lib/api';
import { useStore } from '@/components/providers/StoreProvider';

interface CheckoutClientProps {
  locale: string;
  listingId: string;
  sellerId: string;
  total: number;
  platformFee: number;
}

type PaymentMethod = 'card' | 'vodafone' | 'instapay' | 'btc' | 'usdt' | 'eth';

const PAYMENT_METHODS: { id: PaymentMethod; icon: React.ElementType; labelEn: string; labelAr: string; group: 'local' | 'crypto' }[] = [
  { id: 'card',     icon: CreditCard, labelEn: 'Credit / Debit Card', labelAr: 'بطاقة ائتمان / خصم', group: 'local'  },
  { id: 'vodafone', icon: Smartphone, labelEn: 'Vodafone Cash',       labelAr: 'فودافون كاش',         group: 'local'  },
  { id: 'instapay', icon: Building2,  labelEn: 'InstaPay',            labelAr: 'إنستاباي',            group: 'local'  },
  { id: 'btc',      icon: Wallet,     labelEn: 'Bitcoin (BTC)',       labelAr: 'بيتكوين (BTC)',       group: 'crypto' },
  { id: 'usdt',     icon: Wallet,     labelEn: 'USDT (TRC20)',        labelAr: 'USDT (TRC20)',         group: 'crypto' },
  { id: 'eth',      icon: Wallet,     labelEn: 'Ethereum (ETH)',      labelAr: 'إيثيريوم (ETH)',      group: 'crypto' },
];

// Replace with your actual wallet addresses
const CRYPTO_ADDRESSES: Record<string, string> = {
  btc:  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  usdt: 'TRx7NnHwk3AeBhXZ9u9fWvNkTKkS9bTzXX',
  eth:  '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
};

const CRYPTO_LABELS: Record<string, string> = { btc: 'BTC', usdt: 'USDT (TRC20)', eth: 'ETH' };

export function CheckoutClient({ locale, listingId, sellerId, total, platformFee }: CheckoutClientProps) {
  const router = useRouter();
  const { user } = useStore();

  const [method, setMethod]   = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [copied, setCopied]   = useState(false);
  const [error, setError]     = useState('');
  const isRTL = locale === 'ar';

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
      const result = await createOrder({
        listing_id:     listingId,
        buyer_id:       user.id,
        seller_id:      sellerId,
        amount:         total,
        platform_fee:   platformFee,
        payment_method: method,
      });

      if (!result) {
        setError(locale === 'ar' ? 'حدث خطأ أثناء معالجة الطلب. حاول مرة أخرى.' : 'Order failed. Please try again.');
        return;
      }

      setDone(true);
    } catch {
      setError(locale === 'ar' ? 'خطأ في الشبكة، تحقق من اتصالك وحاول مرة أخرى' : 'Network error. Check your connection and try again.');
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
            {locale === 'ar' ? 'تم الشراء بنجاح!' : 'Purchase Successful!'}
          </h2>
          <p className="text-muted text-sm leading-relaxed max-w-sm">
            {locale === 'ar'
              ? 'سيتواصل معك البائع خلال 24 ساعة لنقل بيانات الحساب. المبلغ محمي حتى تؤكد الاستلام.'
              : 'The seller will contact you within 24 hours to transfer account details. Your payment is held securely until you confirm delivery.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <Link
            href={`/${locale}/chat?listing=${listingId}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-surface hover:bg-surface-light text-white border border-border transition-all"
          >
            {locale === 'ar' ? 'تواصل مع البائع' : 'Message Seller'}
          </Link>
          <Link
            href={`/${locale}/browse`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-purple hover:bg-purple-light text-white shadow-lg shadow-purple/25 transition-all"
          >
            {locale === 'ar' ? 'متابعة التسوق' : 'Continue Browsing'}
          </Link>
        </div>
      </div>
    );
  }

  const localMethods  = PAYMENT_METHODS.filter((p) => p.group === 'local');
  const cryptoMethods = PAYMENT_METHODS.filter((p) => p.group === 'crypto');
  const isCrypto      = ['btc', 'usdt', 'eth'].includes(method);

  return (
    <div className="space-y-5">
      <Link
        href={`/${locale}/listing/${listingId}`}
        className="inline-flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
        {locale === 'ar' ? 'رجوع للإعلان' : 'Back to listing'}
      </Link>

      {/* Must be logged in */}
      {!user && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {locale === 'ar' ? 'يجب تسجيل الدخول أولاً للإتمام الشراء. ' : 'You must sign in before completing your purchase. '}
            <Link href={`/${locale}/auth/sign-in`} className="underline font-medium">
              {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
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
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          {locale === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
        </h2>
        <div>
          <p className="text-xs text-muted mb-2 uppercase tracking-wider">{locale === 'ar' ? 'دفع محلي' : 'Local Payments'}</p>
          <div className="space-y-2">
            {localMethods.map((pm) => (
              <MethodRow key={pm.id} pm={pm} selected={method === pm.id} locale={locale} onSelect={() => setMethod(pm.id)} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted mb-2 uppercase tracking-wider">{locale === 'ar' ? 'عملات رقمية' : 'Crypto'}</p>
          <div className="space-y-2">
            {cryptoMethods.map((pm) => (
              <MethodRow key={pm.id} pm={pm} selected={method === pm.id} locale={locale} onSelect={() => setMethod(pm.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* Card details */}
      {method === 'card' && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            {locale === 'ar' ? 'تفاصيل البطاقة' : 'Card Details'}
          </h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">{locale === 'ar' ? 'رقم البطاقة' : 'Card Number'}</label>
            <input type="text" maxLength={19} placeholder="1234 5678 9012 3456"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">{locale === 'ar' ? 'تاريخ الانتهاء' : 'Expiry'}</label>
              <input type="text" placeholder="MM / YY" maxLength={7}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">CVV</label>
              <input type="text" placeholder="•••" maxLength={4}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all" />
            </div>
          </div>
        </div>
      )}

      {/* Vodafone / InstaPay */}
      {(method === 'vodafone' || method === 'instapay') && (
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-sm text-muted leading-relaxed">
            {method === 'vodafone'
              ? (locale === 'ar' ? 'أرسل المبلغ إلى رقم فودافون كاش الخاص بنا، ثم أرسل لنا لقطة شاشة تأكيداً للدفع.' : 'Send the amount to our Vodafone Cash number, then send us a screenshot as payment confirmation.')
              : (locale === 'ar' ? 'اضغط تأكيد وسيُرسل طلب InstaPay إلى رقمك المسجل.' : 'Press confirm and an InstaPay request will be sent to your registered number.')}
          </p>
        </div>
      )}

      {/* Crypto address */}
      {isCrypto && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            {locale === 'ar' ? `عنوان المحفظة — ${CRYPTO_LABELS[method]}` : `${CRYPTO_LABELS[method]} Wallet Address`}
          </h2>
          <div className="flex gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-400 text-base shrink-0 mt-0.5">⚠</span>
            <p className="text-xs text-amber-300 leading-relaxed">
              {locale === 'ar'
                ? `تأكد من إرسال ${CRYPTO_LABELS[method]} فقط إلى هذا العنوان.`
                : `Send only ${CRYPTO_LABELS[method]} to this address. Sending a different coin may result in permanent loss of funds.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-border">
              <p className="text-xs text-muted mb-1">{locale === 'ar' ? 'العنوان' : 'Address'}</p>
              <p className="text-xs text-white font-mono break-all leading-relaxed">{CRYPTO_ADDRESSES[method]}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(CRYPTO_ADDRESSES[method])}
              className={cn(
                'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all border',
                copied ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-border text-muted hover:text-white hover:bg-white/10'
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <Button className="w-full" size="lg" onClick={handleConfirm} loading={loading} disabled={loading}>
        {loading
          ? (locale === 'ar' ? 'جاري المعالجة...' : 'Processing...')
          : (locale === 'ar' ? `تأكيد الدفع — ${formatPrice(total, locale)}` : `Confirm Payment — ${formatPrice(total, locale)}`)}
      </Button>
    </div>
  );
}

function MethodRow({ pm, selected, locale, onSelect }: { pm: (typeof PAYMENT_METHODS)[number]; selected: boolean; locale: string; onSelect: () => void }) {
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
      <span className="text-sm font-medium flex-1">{locale === 'ar' ? pm.labelAr : pm.labelEn}</span>
      <span className={cn('w-4 h-4 rounded-full border-2 shrink-0 transition-all', selected ? 'border-purple bg-purple' : 'border-border')} />
    </button>
  );
}
