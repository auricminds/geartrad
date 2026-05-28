'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Smartphone, Building2, ArrowLeft, Wallet, Copy, Check,
  AlertCircle, Lock, Upload, CheckCircle2, Clock, X,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useStore } from '@/components/providers/StoreProvider';
import { supabase } from '@/lib/supabase';

interface CheckoutClientProps {
  locale: string;
  listingId: string;
  sellerId: string;
  total: number;
  sellerMethods: string[]; // IDs of payment methods the seller has configured
}

type PaymentMethod = 'instapay' | 'vodafone' | 'orange' | 'paypal' | 'usdt' | 'btc' | 'eth';
type Step = 'method' | 'details' | 'proof' | 'done';

const ALL_PAYMENT_METHODS: {
  id: PaymentMethod;
  icon: React.ElementType;
  labelEn: string;
  labelAr: string;
  group: 'local' | 'crypto';
  descEn: string;
  descAr: string;
}[] = [
  {
    id: 'instapay', icon: Building2,
    labelEn: 'InstaPay', labelAr: 'إنستاباي',
    group: 'local',
    descEn: 'Bank transfer via InstaPay', descAr: 'تحويل بنكي عبر إنستاباي',
  },
  {
    id: 'vodafone', icon: Smartphone,
    labelEn: 'Vodafone Cash', labelAr: 'فودافون كاش',
    group: 'local',
    descEn: 'Mobile wallet transfer', descAr: 'تحويل محفظة موبايل',
  },
  {
    id: 'orange', icon: Smartphone,
    labelEn: 'Orange Money', labelAr: 'أورانج موني',
    group: 'local',
    descEn: 'Mobile wallet transfer', descAr: 'تحويل محفظة موبايل',
  },
  {
    id: 'paypal', icon: Wallet,
    labelEn: 'PayPal', labelAr: 'باي بال',
    group: 'local',
    descEn: 'PayPal transfer', descAr: 'تحويل باي بال',
  },
  {
    id: 'usdt', icon: Wallet,
    labelEn: 'USDT (TRC20)', labelAr: 'USDT (TRC20)',
    group: 'crypto',
    descEn: 'Tron network — lowest fees', descAr: 'شبكة ترون — أقل رسوم',
  },
  {
    id: 'btc', icon: Wallet,
    labelEn: 'Bitcoin (BTC)', labelAr: 'بيتكوين (BTC)',
    group: 'crypto',
    descEn: 'Bitcoin network', descAr: 'شبكة بيتكوين',
  },
  {
    id: 'eth', icon: Wallet,
    labelEn: 'Ethereum (ETH)', labelAr: 'إيثيريوم (ETH)',
    group: 'crypto',
    descEn: 'Ethereum network', descAr: 'شبكة إيثيريوم',
  },
];

const METHOD_LABELS: Record<PaymentMethod, string> = {
  instapay: 'InstaPay', vodafone: 'Vodafone Cash', orange: 'Orange Money',
  paypal: 'PayPal', usdt: 'USDT (TRC20)', btc: 'Bitcoin (BTC)', eth: 'Ethereum (ETH)',
};

export function CheckoutClient({ locale, listingId, sellerId, total, sellerMethods }: CheckoutClientProps) {
  const router = useRouter();
  const { user } = useStore();
  const isAr = locale === 'ar';

  // Only show methods the seller has set up
  const PAYMENT_METHODS = ALL_PAYMENT_METHODS.filter((pm) => sellerMethods.includes(pm.id));
  const defaultMethod = (PAYMENT_METHODS[0]?.id ?? 'instapay') as PaymentMethod;

  const [step, setStep]             = useState<Step>('method');
  const [method, setMethod]         = useState<PaymentMethod>(defaultMethod);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [copied, setCopied]         = useState(false);

  // Order & seller details (returned from initiate)
  const [orderId, setOrderId]       = useState('');
  const [paymentAddress, setPaymentAddress] = useState('');
  const [orderTotal, setOrderTotal] = useState(total);

  // Proof submission
  const [reference, setReference]   = useState('');
  const [proofFile, setProofFile]   = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState('');
  const [uploading, setUploading]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isCrypto = ['usdt', 'btc', 'eth'].includes(method);

  if (PAYMENT_METHODS.length === 0) {
    return (
      <div className="bg-surface border border-amber-500/20 rounded-2xl p-6 text-center">
        <p className="text-amber-300 text-sm font-medium mb-1">
          {isAr ? 'البائع لم يُضف طرق دفع بعد' : 'Seller has not set up payment methods yet'}
        </p>
        <p className="text-muted text-xs">
          {isAr ? 'تواصل مع البائع عبر الدردشة لترتيب الدفع.' : 'Contact the seller via chat to arrange payment.'}
        </p>
      </div>
    );
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return token
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { 'Content-Type': 'application/json' };
  };

  // ── Step 1: Initiate order ───────────────────────────────────────────────────
  const handleInitiate = async () => {
    if (!user) { router.push(`/${locale}/auth/sign-in`); return; }
    setError('');
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ listingId, buyerId: user.id, paymentMethod: method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isAr ? 'فشل تهيئة الطلب' : 'Failed to initiate order'));
        return;
      }
      setOrderId(data.orderId);
      setPaymentAddress(data.paymentAddress);
      setOrderTotal(data.total);
      setStep('details');
    } catch {
      setError(isAr ? 'خطأ في الشبكة، حاول مرة أخرى' : 'Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Handle proof file selection ─────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  // ── Step 3: Submit proof ─────────────────────────────────────────────────────
  const handleSubmitProof = async () => {
    if (!user) return;
    if (!reference.trim() && !proofFile) {
      setError(isAr ? 'أضف رقم المرجع أو ارفع لقطة الشاشة' : 'Add a reference number or upload a screenshot');
      return;
    }
    setError('');
    setUploading(true);
    try {
      let proofUrl: string | undefined;

      // Upload screenshot to Supabase storage if provided
      if (proofFile) {
        const ext = proofFile.name.split('.').pop() ?? 'jpg';
        const path = `payment-proofs/${orderId}-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('listing-images')
          .upload(path, proofFile, { upsert: false });

        if (uploadErr) {
          setError(isAr ? 'فشل رفع الصورة، حاول مرة أخرى' : 'Upload failed. Try again.');
          return;
        }
        const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path);
        proofUrl = urlData.publicUrl;
      }

      const headers = await getAuthHeaders();
      const res = await fetch('/api/payment/submit-proof', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId,
          buyerId: user.id,
          proofUrl,
          reference: reference.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? (isAr ? 'فشل إرسال الإثبات' : 'Failed to submit proof'));
        return;
      }
      setStep('done');
    } catch {
      setError(isAr ? 'خطأ في الشبكة، حاول مرة أخرى' : 'Network error. Try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Cancel order ─────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!user || !orderId) { setStep('method'); return; }
    const headers = await getAuthHeaders();
    await fetch('/api/payment/cancel', {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderId, userId: user.id }),
    });
    setOrderId('');
    setPaymentAddress('');
    setStep('method');
  };

  // ── DONE state ───────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="bg-surface border border-emerald-500/20 rounded-2xl p-8 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            {isAr ? 'تم إرسال الإثبات!' : 'Proof Submitted!'}
          </h2>
          <p className="text-muted text-sm leading-relaxed max-w-sm">
            {isAr
              ? 'تم إرسال إثبات الدفع للبائع. بعد تأكيده، ستجد بيانات الدخول في صفحة طلباتي.'
              : "Payment proof sent to the seller. Once they confirm receipt, your credentials will appear in My Orders."}
          </p>
        </div>
        <div className="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-start">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            {isAr
              ? 'إذا لم يؤكد البائع خلال 24 ساعة، يمكنك فتح تذكرة نزاع من صفحة طلباتي.'
              : "If the seller doesn't confirm within 24 hours, you can open a dispute from My Orders."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <Link
            href={`/${locale}/orders`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-purple hover:bg-purple-light text-white shadow-lg shadow-purple/25 transition-all"
          >
            {isAr ? 'مشترياتي' : 'My Orders'}
          </Link>
          <Link
            href={`/${locale}/browse`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-surface hover:bg-white/5 text-white border border-border transition-all"
          >
            {isAr ? 'متابعة التسوق' : 'Browse More'}
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
            {isAr ? 'يجب تسجيل الدخول أولاً. ' : 'You must sign in first. '}
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

      {/* ── STEP: method selection ─────────────────────────────────────── */}
      {step === 'method' && (
        <>
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                {isAr ? 'طريقة الدفع' : 'Payment Method'}
              </h2>
              <div className="flex items-center gap-1 text-emerald-400 text-xs">
                <Lock className="w-3 h-3" />
                <span>{isAr ? 'نظام ضمان آمن' : 'Escrow Protected'}</span>
              </div>
            </div>

            {localMethods.length > 0 && (
              <div>
                <p className="text-xs text-muted mb-2 uppercase tracking-wider">
                  {isAr ? 'محافظ محلية' : 'Local Payments'}
                </p>
                <div className="space-y-2">
                  {localMethods.map((pm) => (
                    <MethodRow key={pm.id} pm={pm} selected={method === pm.id} locale={locale} onSelect={() => setMethod(pm.id)} />
                  ))}
                </div>
              </div>
            )}

            {cryptoMethods.length > 0 && (
              <div>
                <p className="text-xs text-muted mb-2 uppercase tracking-wider">
                  {isAr ? 'عملات رقمية' : 'Crypto'}
                </p>
                <div className="space-y-2">
                  {cryptoMethods.map((pm) => (
                    <MethodRow key={pm.id} pm={pm} selected={method === pm.id} locale={locale} onSelect={() => setMethod(pm.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Escrow explanation */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-purple/5 border border-purple/20">
            <Lock className="w-4 h-4 text-purple shrink-0 mt-0.5" />
            <p className="text-xs text-muted leading-relaxed">
              {isAr
                ? 'بيانات حسابك محجوزة ولن تُسلَّم إلا بعد تأكيد البائع استلام الدفع. إذا لم يُسلَّم، افتح تذكرة دعم.'
                : "Account credentials are locked and only released after the seller confirms payment receipt. If anything goes wrong, open a dispute."}
            </p>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleInitiate}
            disabled={loading || !user}
          >
            {loading
              ? (isAr ? 'جاري المعالجة...' : 'Processing...')
              : (isAr ? `متابعة — الدفع عبر ${METHOD_LABELS[method]}` : `Continue with ${METHOD_LABELS[method]}`)}
          </Button>
        </>
      )}

      {/* ── STEP: payment details (show seller address) ────────────────── */}
      {step === 'details' && (
        <>
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                {isAr ? 'تفاصيل الدفع' : 'Payment Details'}
              </h2>
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs text-muted hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

            {/* Amount to send */}
            <div className="p-3 rounded-xl bg-purple/10 border border-purple/20 flex items-center justify-between">
              <span className="text-sm text-muted">
                {isAr ? 'المبلغ المطلوب إرساله:' : 'Amount to send:'}
              </span>
              <span className="text-base font-bold text-white">{formatPrice(orderTotal, locale)}</span>
            </div>

            {/* Seller address */}
            <div>
              <p className="text-xs text-muted mb-2">
                {isCrypto
                  ? (isAr ? `أرسل ${METHOD_LABELS[method]} إلى هذا العنوان:` : `Send ${METHOD_LABELS[method]} to this address:`)
                  : (isAr ? `أرسل المبلغ إلى هذا الحساب عبر ${METHOD_LABELS[method]}:` : `Send the amount to this account via ${METHOD_LABELS[method]}:`)}
              </p>

              {isCrypto && (
                <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300 leading-relaxed">
                    {isAr
                      ? `تأكد من إرسال ${METHOD_LABELS[method]} فقط. إرسال عملة مختلفة قد يؤدي لضياع الأموال نهائياً.`
                      : `Only send ${METHOD_LABELS[method]}. Sending a different coin may permanently lose your funds.`}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-border min-w-0">
                  <p className="text-xs text-white font-mono break-all leading-relaxed">{paymentAddress}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(paymentAddress)}
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
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => setStep('proof')}
          >
            {isAr ? 'أرسلت الدفع — إضافة إثبات' : "I've Sent the Payment — Add Proof"}
          </Button>
        </>
      )}

      {/* ── STEP: upload proof ─────────────────────────────────────────── */}
      {step === 'proof' && (
        <>
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                {isAr ? 'إثبات الدفع' : 'Payment Proof'}
              </h2>
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs text-muted hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>

            {/* Reference / TX hash */}
            <div>
              <label className="block text-xs text-muted mb-2">
                {isCrypto
                  ? (isAr ? 'رقم المعاملة (TX Hash)' : 'Transaction Hash (TX ID)')
                  : (isAr ? 'رقم المرجع أو رمز التحويل' : 'Reference number or transfer ID')}
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={isCrypto ? '0x... or TXhash...' : isAr ? 'أدخل رقم المرجع' : 'Enter reference number'}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all font-mono"
              />
            </div>

            {/* Screenshot upload */}
            <div>
              <label className="block text-xs text-muted mb-2">
                {isAr ? 'لقطة شاشة الإيصال (اختياري إذا أضفت رقم المرجع)' : 'Receipt screenshot (optional if reference added)'}
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {proofPreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proofPreview}
                    alt="Payment proof"
                    className="w-full max-h-48 object-contain rounded-xl border border-border bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => { setProofFile(null); setProofPreview(''); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500/80 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 px-4 py-6 rounded-xl border border-dashed border-border hover:border-purple/50 hover:bg-purple/5 transition-all text-muted"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">{isAr ? 'اضغط لرفع لقطة الشاشة' : 'Tap to upload screenshot'}</span>
                  <span className="text-xs text-muted/60">{isAr ? 'PNG, JPG, WEBP — بحد أقصى 10MB' : 'PNG, JPG, WEBP — max 10MB'}</span>
                </button>
              )}
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmitProof}
            disabled={uploading || (!reference.trim() && !proofFile)}
          >
            {uploading
              ? (isAr ? 'جاري الإرسال...' : 'Submitting...')
              : (isAr ? 'إرسال إثبات الدفع' : 'Submit Payment Proof')}
          </Button>
        </>
      )}
    </div>
  );
}

function MethodRow({
  pm, selected, locale, onSelect,
}: {
  pm: (typeof ALL_PAYMENT_METHODS)[number];
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
        <span className="text-[10px] text-muted block mt-0.5">{isAr ? pm.descAr : pm.descEn}</span>
      </div>
      <span className={cn('w-4 h-4 rounded-full border-2 shrink-0 transition-all', selected ? 'border-purple bg-purple' : 'border-border')} />
    </button>
  );
}
