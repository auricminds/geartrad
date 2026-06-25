'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckSquare, Square, ChevronDown, Zap, ArrowLeft, Upload, AlertCircle, X, Lock, Eye, EyeOff, ShieldAlert, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createListing, uploadListingImage, getSellerPaymentDetails, updateSellerPaymentDetails } from '@/lib/api';
import { useStore } from '@/components/providers/StoreProvider';

const PAYMENT_METHODS = [
  { id: 'vodafone', key: 'vodafone_number' as const, label: 'Vodafone Cash', labelAr: 'فودافون كاش', placeholder: '01XXXXXXXXX', color: 'border-red-500/40 bg-red-500/5 text-red-400' },
  { id: 'orange',   key: 'orange_number'   as const, label: 'Orange Money',  labelAr: 'أورنج موني',  placeholder: '01XXXXXXXXX', color: 'border-orange-500/40 bg-orange-500/5 text-orange-400' },
  { id: 'instapay', key: 'instapay_id'     as const, label: 'InstaPay',      labelAr: 'إنستاباي',    placeholder: 'InstaPay ID or phone', color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400' },
  { id: 'paypal',   key: 'paypal_email'    as const, label: 'PayPal',        labelAr: 'باي بال',     placeholder: 'your@paypal.com', color: 'border-blue-500/40 bg-blue-500/5 text-blue-400' },
  { id: 'usdt',     key: 'crypto_wallet_usdt' as const, label: 'USDT (TRC20)', labelAr: 'يو إس دي تي (TRC20)', placeholder: 'TRC20 wallet address', color: 'border-green-500/40 bg-green-500/5 text-green-400' },
  { id: 'btc',      key: 'crypto_wallet_btc'  as const, label: 'Bitcoin (BTC)', labelAr: 'بيتكوين',      placeholder: 'BTC wallet address', color: 'border-yellow-500/40 bg-yellow-500/5 text-yellow-400' },
] as const;

const GAMES = ['Valorant', 'Fortnite', 'CS2', 'League of Legends', 'PUBG Mobile', 'Apex Legends', 'FIFA', 'Call of Duty', 'Brawl Stars', 'Other'];
const TYPES = ['Account', 'Skin', 'Weapon', 'Bundle', 'Ticket'];

const GAME_RANKS: Record<string, string[]> = {
  'Valorant': ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
  'Fortnite': ['Open League', 'Contender League', 'Champion League', 'Unreal'],
  'CS2': ['Silver I', 'Silver II', 'Silver III', 'Silver IV', 'Silver Elite', 'Silver Elite Master', 'Gold Nova I', 'Gold Nova II', 'Gold Nova III', 'Gold Nova Master', 'Master Guardian I', 'Master Guardian II', 'Master Guardian Elite', 'Distinguished Master Guardian', 'Legendary Eagle', 'Legendary Eagle Master', 'Supreme Master First Class', 'Global Elite'],
  'League of Legends': ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
  'PUBG Mobile': ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Conqueror'],
  'Apex Legends': ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Predator'],
  'FIFA': ['Division 10', 'Division 9', 'Division 8', 'Division 7', 'Division 6', 'Division 5', 'Division 4', 'Division 3', 'Division 2', 'Division 1', 'Elite'],
  'Call of Duty': ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crimson', 'Iridescent', 'Top 250'],
  'Brawl Stars': ['Bronze', 'Silver', 'Gold', 'Diamond', 'Mythic', 'Legendary', 'Masters'],
  'Other': [],
};

type BoostOption = 'none' | 'weekly' | 'monthly';

const inputCls = 'w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple transition-all';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-muted">{label}</label>
      {children}
    </div>
  );
}

export default function SellPage() {
  const locale  = useLocale();
  const router  = useRouter();
  const { user, userRole, authLoading } = useStore();
  const isRTL = locale === 'ar';

  const [agreed, setAgreed]           = useState(false);
  const [boostType, setBoostType]     = useState<BoostOption>('none');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [title, setTitle]               = useState('');
  const [titleAr, setTitleAr]           = useState('');
  const [game, setGame]                 = useState('');
  const [customGame, setCustomGame]     = useState('');
  const [type, setType]                 = useState('');
  const [rank, setRank]                 = useState('');
  const [price, setPrice]               = useState('');
  const [description, setDescription]   = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [imageFiles, setImageFiles]     = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [level, setLevel]               = useState('');
  const [hoursPlayed, setHoursPlayed]   = useState('');
  const [winRate, setWinRate]           = useState('');
  const [achievements, setAchievements] = useState('');
  const fileInputRef                    = useRef<HTMLInputElement>(null);
  const paymentSectionRef               = useRef<HTMLDivElement>(null);

  // Account credentials — required when type === 'Account'
  const [credEmail, setCredEmail]       = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credExtra, setCredExtra]       = useState('');

  // Payment methods
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set());
  const [paymentValues, setPaymentValues]     = useState<Record<string, string>>({});
  const [paymentLoaded, setPaymentLoaded]     = useState(false);

  useEffect(() => {
    if (!user) return;
    getSellerPaymentDetails(user.id).then((details) => {
      setPaymentLoaded(true);
      if (!details) return;
      const pre: Record<string, string> = {};
      const active = new Set<string>();
      for (const m of PAYMENT_METHODS) {
        const val = details[m.key];
        if (val) { pre[m.id] = val; active.add(m.id); }
      }
      setPaymentValues(pre);
      setSelectedMethods(active);
    }).catch(() => setPaymentLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggleMethod = (id: string) => {
    setSelectedMethods((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isAccountType = type === 'Account';

  const availableRanks = game ? (GAME_RANKS[game] ?? []) : [];

  const handleGameChange = (newGame: string) => {
    setGame(newGame);
    setRank(''); // reset rank when game changes
    setCustomGame('');
  };

  const MAX_IMAGES = 5;

  const handleImageFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const toAdd = Array.from(newFiles).slice(0, MAX_IMAGES - imageFiles.length);
    if (toAdd.length === 0) return;
    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  if (authLoading) return null;

  // Must be logged in as a seller
  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-white font-semibold text-lg mb-4">
          {isRTL ? 'يجب تسجيل الدخول للبيع' : 'You must be signed in to sell'}
        </p>
        <Link
          href={`/${locale}/auth/sign-in`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple hover:bg-purple-light text-white font-semibold transition-all"
        >
          {isRTL ? 'تسجيل الدخول' : 'Sign In'}
        </Link>
      </div>
    );
  }

  const isAdmin = userRole === 'admin' || userRole === 'moderator';

  if (user.user_metadata?.account_type !== 'seller' && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-white font-semibold text-lg mb-2">
          {isRTL ? 'هذا الحساب للمشترين فقط' : 'This is a buyer account'}
        </p>
        <p className="text-muted text-sm mb-6">
          {isRTL ? 'أنشئ حساب بائع للنشر' : 'Create a seller account to post listings'}
        </p>
        <Link
          href={`/${locale}/auth/sign-up?type=seller`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold hover:bg-gold-light text-black font-semibold transition-all"
        >
          {isRTL ? 'أصبح بائعاً' : 'Become a Seller'}
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
          <CheckSquare className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          {locale === 'ar' ? 'تم نشر إعلانك!' : 'Listing Published!'}
        </h1>
        <p className="text-muted text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          {locale === 'ar'
            ? 'إعلانك الآن مباشر ويمكن للمشترين رؤيته.'
            : 'Your listing is now live and buyers can see it.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/${locale}/browse`} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-surface hover:bg-surface-light text-white border border-border transition-all">
            {locale === 'ar' ? 'تصفح الإعلانات' : 'Browse Listings'}
          </Link>
          <Link href={`/${locale}/sell`} onClick={() => setSubmitted(false)} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-purple hover:bg-purple-light text-white shadow-lg shadow-purple/25 transition-all">
            {locale === 'ar' ? 'إضافة إعلان آخر' : 'Add Another Listing'}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;

    setError('');

    const finalGame = game === 'Other' ? customGame.trim() : game;
    if (!title.trim() || !finalGame || !type || !price || !description.trim()) {
      setError(locale === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }
    if (game === 'Other' && !customGame.trim()) {
      setError(locale === 'ar' ? 'يرجى كتابة اسم اللعبة' : 'Please enter the game name');
      return;
    }
    if (isAccountType && (!credEmail.trim() || !credPassword.trim())) {
      setError(locale === 'ar' ? 'يجب إدخال بريد الحساب وكلمة المرور — هذه بيانات إلزامية لبيع الحسابات' : 'Account email and password are required when selling an account');
      return;
    }

    if (selectedMethods.size === 0) {
      setError(locale === 'ar' ? 'يجب اختيار طريقة دفع واحدة على الأقل لكي يعرف المشتري كيف يدفع لك' : 'Please select at least one payment method so buyers know how to pay you — scroll down to the payment section below');
      paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    for (const m of PAYMENT_METHODS) {
      if (selectedMethods.has(m.id) && !paymentValues[m.id]?.trim()) {
        setError(locale === 'ar' ? `يرجى إدخال بيانات ${m.labelAr}` : `Please enter your ${m.label} details`);
        paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    const priceNum = parseInt(price, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError(locale === 'ar' ? 'السعر يجب أن يكون رقماً موجباً' : 'Price must be a positive number');
      return;
    }

    setLoading(true);
    try {
      // Save payment methods to seller profile
      const paymentUpdate: Record<string, string | null> = {};
      for (const m of PAYMENT_METHODS) {
        paymentUpdate[m.key] = selectedMethods.has(m.id) ? (paymentValues[m.id]?.trim() || null) : null;
      }
      await updateSellerPaymentDetails(user.id, paymentUpdate);

      // Upload images (first = cover, rest = gallery)
      const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80';
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadListingImage(file, user.id);
        if (url) uploadedUrls.push(url);
      }
      const coverImageUrl = uploadedUrls[0] ?? DEFAULT_IMAGE;
      const extraImages = uploadedUrls.slice(1);

      await createListing(
        {
          title: title.trim(),
          title_ar: titleAr.trim() || undefined,
          description: description.trim(),
          description_ar: descriptionAr.trim() || undefined,
          price: priceNum,
          game: finalGame,
          type,
          cover_image: coverImageUrl,
          images: extraImages.length > 0 ? extraImages : undefined,
          rank: rank || undefined,
          boost_type: boostType,
          level: level ? parseInt(level, 10) : null,
          hours_played: hoursPlayed ? parseInt(hoursPlayed, 10) : null,
          win_rate: winRate ? parseInt(winRate, 10) : null,
          achievements: achievements ? parseInt(achievements, 10) : null,
          account_email: isAccountType ? credEmail.trim() : undefined,
          account_password: isAccountType ? credPassword : undefined,
          account_extra_info: isAccountType && credExtra.trim() ? credExtra.trim() : undefined,
        },
        user.id
      );

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e instanceof Error ? e.message : (locale === 'ar' ? 'خطأ في الشبكة، تحقق من اتصالك وحاول مرة أخرى' : 'Network error. Check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm mb-8">
        <ArrowLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
        {locale === 'ar' ? 'رجوع' : 'Back'}
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">
        {locale === 'ar' ? 'إضافة إعلان جديد' : 'Create New Listing'}
      </h1>
      <p className="text-muted text-sm mb-8">
        {locale === 'ar' ? 'أضف تفاصيل حسابك أو عنصرك للبيع' : 'Fill in the details of the account or item you want to sell'}
      </p>

      {/* Risk Warning */}
      <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
            {locale === 'ar' ? 'تحذير مهم — اقرأ قبل المتابعة' : 'Important Warning — Read Before Continuing'}
          </h2>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm text-amber-200/80 leading-relaxed">
          <ul className="space-y-2 list-none">
            {(locale === 'ar' ? [
              'جميع عمليات البيع والشراء تتم على مسؤوليتك الشخصية الكاملة.',
              'GearTrad ليست مسؤولة عن أي حظر أو إيقاف للحساب بعد البيع.',
              'أنت تضمن أن هذا الحساب أو العنصر ملكك الكاملة وتملك الحق في بيعه.',
              'أي بيانات كاذبة أو مضللة قد تؤدي إلى حذف الحساب وحظره.',
              'GearTrad تحتجز المبلغ كضمان للمشتري حتى يتم تأكيد الاستلام.',
            ] : [
              'All sales are conducted entirely at your own risk.',
              'GearTrad is not responsible for any account bans or suspensions following the sale.',
              'You confirm this account or item is fully yours and you have the right to sell it.',
              'False or misleading information may result in account removal and ban.',
              'GearTrad holds payment in escrow to protect the buyer until delivery is confirmed.',
            ]).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setAgreed(!agreed)}
            className="flex items-center gap-3 mt-4 pt-4 border-t border-amber-500/20 w-full text-start"
          >
            {agreed
              ? <CheckSquare className="w-5 h-5 text-amber-400 shrink-0" />
              : <Square className="w-5 h-5 text-amber-400/50 shrink-0" />}
            <span className={cn('text-sm font-medium transition-colors', agreed ? 'text-amber-300' : 'text-amber-400/70')}>
              {locale === 'ar' ? 'أقر بأنني قرأت وأوافق على جميع ما ذكر أعلاه' : 'I have read, understood, and agree to all of the above'}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={cn('space-y-6 transition-opacity duration-300', !agreed && 'opacity-40 pointer-events-none')}>
        {/* Listing Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            {locale === 'ar' ? 'تفاصيل الإعلان' : 'Listing Details'}
          </h3>

          <Field label={locale === 'ar' ? 'عنوان الإعلان (إنجليزي) *' : 'Listing Title (English) *'}>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={locale === 'ar' ? 'مثال: Valorant Immortal Account' : 'e.g. Valorant Immortal Account — 200+ Skins'}
              className={inputCls} maxLength={120} />
          </Field>

          <Field label={locale === 'ar' ? 'عنوان الإعلان (عربي — اختياري)' : 'Listing Title (Arabic — optional)'}>
            <input type="text" value={titleAr} onChange={(e) => setTitleAr(e.target.value)}
              placeholder="مثال: حساب فالورانت إيموورتال — ٢٠٠+ سكن"
              className={inputCls} maxLength={120} dir="rtl" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label={locale === 'ar' ? 'اللعبة *' : 'Game *'}>
              <div className="relative">
                <select required value={game} onChange={(e) => handleGameChange(e.target.value)} className={cn(inputCls, 'appearance-none')}>
                  <option value="">{locale === 'ar' ? 'اختر...' : 'Select...'}</option>
                  {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
              {game === 'Other' && (
                <input
                  type="text"
                  required
                  value={customGame}
                  onChange={(e) => setCustomGame(e.target.value)}
                  placeholder={locale === 'ar' ? 'اكتب اسم اللعبة...' : 'Type the game name...'}
                  className={cn(inputCls, 'mt-2')}
                  maxLength={60}
                />
              )}
            </Field>
            <Field label={locale === 'ar' ? 'النوع *' : 'Type *'}>
              <div className="relative">
                <select required value={type} onChange={(e) => setType(e.target.value)} className={cn(inputCls, 'appearance-none')}>
                  <option value="">{locale === 'ar' ? 'اختر...' : 'Select...'}</option>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={locale === 'ar' ? 'التصنيف (اختياري)' : 'Rank (optional)'}>
              {availableRanks.length > 0 ? (
                <div className="relative">
                  <select value={rank} onChange={(e) => setRank(e.target.value)} className={cn(inputCls, 'appearance-none')}>
                    <option value="">{locale === 'ar' ? 'لا يوجد' : 'None'}</option>
                    {availableRanks.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                </div>
              ) : (
                <div className={cn(inputCls, 'text-muted/50 cursor-not-allowed select-none')}>
                  {game ? (locale === 'ar' ? 'لا يوجد تصنيف لهذه اللعبة' : 'No ranks for this game') : (locale === 'ar' ? 'اختر لعبة أولاً' : 'Select a game first')}
                </div>
              )}
            </Field>
            <Field label={locale === 'ar' ? 'السعر (جنيه مصري) *' : 'Price (EGP) *'}>
              <input type="number" required min={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className={inputCls} />
            </Field>
          </div>

          <Field label={locale === 'ar' ? 'الوصف (إنجليزي) *' : 'Description (English) *'}>
            <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={locale === 'ar' ? 'اذكر كل التفاصيل: المستوى، الساعات، السكنات، سبب البيع...' : 'Include all details: level, hours, skins, reason for selling...'}
              className={cn(inputCls, 'resize-none')} maxLength={2000} />
          </Field>

          <Field label={locale === 'ar' ? 'الوصف (عربي — اختياري)' : 'Description (Arabic — optional)'}>
            <textarea rows={3} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)}
              placeholder="اكتب الوصف بالعربية هنا..."
              className={cn(inputCls, 'resize-none')} maxLength={2000} dir="rtl" />
          </Field>

        {/* ── Account Credentials — required for Account type ───────────── */}
        {isAccountType && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-red-500/20">
              <Lock className="w-4 h-4 text-red-400 shrink-0" />
              <h3 className="text-sm font-bold text-red-300 uppercase tracking-wider">
                {locale === 'ar' ? 'بيانات الدخول للحساب — إلزامي' : 'Account Login Credentials — Required'}
              </h3>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Privacy notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-muted leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-purple shrink-0 mt-0.5" />
                <span>
                  {locale === 'ar'
                    ? 'هذه البيانات مشفرة ومحمية ولن تظهر للعامة. يتم الكشف عنها للمشتري فقط بعد تأكيد الدفع، وللمشرفين في حالة النزاعات فقط. أي بيانات مزيفة تعني حظراً فورياً واسترداد المبلغ للمشتري.'
                    : 'These credentials are encrypted and never shown publicly. They are revealed to the buyer only after payment is confirmed, and to moderators in disputes only. Providing fake credentials = immediate ban + full refund to buyer.'}
                </span>
              </div>

              <Field label={locale === 'ar' ? 'البريد الإلكتروني للحساب *' : 'Account Email *'}>
                <input
                  type="email"
                  required
                  value={credEmail}
                  onChange={(e) => setCredEmail(e.target.value)}
                  placeholder={locale === 'ar' ? 'البريد المسجل على الحساب' : 'Email registered on the account'}
                  className={inputCls}
                  autoComplete="off"
                />
              </Field>

              <Field label={locale === 'ar' ? 'كلمة المرور *' : 'Password *'}>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={credPassword}
                    onChange={(e) => setCredPassword(e.target.value)}
                    placeholder={locale === 'ar' ? 'كلمة مرور الحساب' : 'Account password'}
                    className={cn(inputCls, 'pe-11')}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <Field label={locale === 'ar' ? 'معلومات إضافية للدخول (اختياري)' : 'Additional Login Info (optional)'}>
                <textarea
                  rows={3}
                  value={credExtra}
                  onChange={(e) => setCredExtra(e.target.value)}
                  placeholder={locale === 'ar'
                    ? 'مثال: رقم الهاتف المرتبط، رمز 2FA الاحتياطي، حساب Steam، أي بيانات إضافية يحتاجها المشتري للدخول...'
                    : 'e.g. Linked phone number, 2FA backup code, linked Steam account, recovery email, or any other info the buyer needs to access the account...'}
                  className={cn(inputCls, 'resize-none')}
                  maxLength={1000}
                />
              </Field>

              {/* Violation warning */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {locale === 'ar'
                    ? 'تحذير: إذا قدمت بيانات خاطئة أو تصرفت بسوء نية، سيتدخل فريق الإشراف لدينا، وفي 99% من الحالات يسترد المشتري ماله كاملاً. هذا انتهاك مباشر للشروط وقد يؤدي لإجراءات قانونية.'
                    : 'Warning: If you provide false credentials or act in bad faith, our moderation team steps in. In 99% of cases the buyer gets a full refund. This is a direct Terms violation and may result in legal action.'}
                </span>
              </div>
            </div>
          </div>
        )}

          <Field label={locale === 'ar' ? `صور الإعلان — حتى ${MAX_IMAGES} صور (اختياري)` : `Listing Photos — up to ${MAX_IMAGES} (optional)`}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => {
                handleImageFiles(e.target.files);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                  <img src={preview} alt={`photo ${idx + 1}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-1 start-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white">
                      {locale === 'ar' ? 'غلاف' : 'Cover'}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 end-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {imagePreviews.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-purple/50 hover:bg-purple/5 flex flex-col items-center justify-center gap-1.5 text-muted hover:text-white transition-all"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs text-center leading-tight px-1">
                    {imagePreviews.length === 0
                      ? (locale === 'ar' ? 'أضف صور' : 'Add photos')
                      : (locale === 'ar' ? 'أضف المزيد' : 'Add more')}
                  </span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted">
              {locale === 'ar'
                ? 'الصورة الأولى ستكون صورة الغلاف. اتركه فارغاً لاستخدام صورة افتراضية.'
                : 'First photo will be the cover image. Leave empty to use a default image.'}
            </p>
          </Field>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            {locale === 'ar' ? 'إحصائيات الحساب (اختياري)' : 'Account Stats (optional)'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label={locale === 'ar' ? 'المستوى' : 'Level'}>
              <input type="number" min={1} value={level} onChange={(e) => setLevel(e.target.value)} placeholder="—" className={inputCls} />
            </Field>
            <Field label={locale === 'ar' ? 'ساعات اللعب' : 'Hours Played'}>
              <input type="number" min={0} value={hoursPlayed} onChange={(e) => setHoursPlayed(e.target.value)} placeholder="—" className={inputCls} />
            </Field>
            <Field label={locale === 'ar' ? 'معدل الفوز (%)' : 'Win Rate (%)'}>
              <input type="number" min={0} max={100} value={winRate} onChange={(e) => setWinRate(e.target.value)} placeholder="—" className={inputCls} />
            </Field>
            <Field label={locale === 'ar' ? 'الإنجازات' : 'Achievements'}>
              <input type="number" min={0} value={achievements} onChange={(e) => setAchievements(e.target.value)} placeholder="—" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Boost */}
        <div className="space-y-3 p-5 rounded-2xl border border-gold/20 bg-gold/5">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold text-white">
              {locale === 'ar' ? 'رفع الإعلان — بيع أسرع' : 'Boost Your Listing — Sell Faster'}
            </h3>
          </div>
          <p className="text-xs text-muted">
            {locale === 'ar' ? 'يظهر إعلانك أولاً في نتائج البحث والصفحة الرئيسية' : 'Your listing appears first in search results and the homepage'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'none',    labelEn: 'No Boost', labelAr: 'بدون رفع',  priceEn: 'Free',     priceAr: 'مجاناً' },
              { id: 'weekly',  labelEn: '1 Week',   labelAr: 'أسبوع',     priceEn: '50 EGP',   priceAr: '٥٠ ج.م' },
              { id: 'monthly', labelEn: '1 Month',  labelAr: 'شهر',       priceEn: '150 EGP',  priceAr: '١٥٠ ج.م', save: true },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setBoostType(opt.id as BoostOption)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all',
                  boostType === opt.id
                    ? opt.id === 'monthly' ? 'border-gold bg-gold/10' : opt.id === 'weekly' ? 'border-purple bg-purple/10' : 'border-border bg-white/5'
                    : 'border-border/50 hover:border-border'
                )}
              >
                {opt.id !== 'none' && <Zap className="w-3.5 h-3.5 text-gold" />}
                <span className="text-xs font-medium text-white">{locale === 'ar' ? opt.labelAr : opt.labelEn}</span>
                <span className="text-xs font-bold text-gold">{locale === 'ar' ? opt.priceAr : opt.priceEn}</span>
                {'save' in opt && opt.save && (
                  <span className="text-[10px] text-emerald-400">{locale === 'ar' ? 'وفر ٢٥٪' : 'Save 25%'}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div ref={paymentSectionRef} className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple" />
            <h3 className="text-sm font-semibold text-white">
              {locale === 'ar' ? 'طرق الدفع المقبولة *' : 'Accepted Payment Methods *'}
            </h3>
          </div>
          <p className="text-xs text-muted -mt-2">
            {locale === 'ar'
              ? 'اختر طريقة دفع واحدة أو أكثر وأدخل بياناتك — ستظهر للمشترين على ملفك وإعلاناتك'
              : 'Select one or more methods and enter your details — buyers will see these on your profile and listings'}
          </p>

          {paymentLoaded && selectedMethods.size === 0 && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {locale === 'ar'
                  ? 'لم تُضف طريقة دفع بعد — يجب إضافة واحدة على الأقل قبل نشر الإعلان'
                  : 'No payment method set up yet — you must add at least one before publishing'}
              </span>
            </div>
          )}

          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => {
              const active = selectedMethods.has(m.id);
              return (
                <div key={m.id} className={cn('rounded-xl border transition-all overflow-hidden', active ? m.color : 'border-border/50')}>
                  <button
                    type="button"
                    onClick={() => toggleMethod(m.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-start"
                  >
                    {active
                      ? <CheckSquare className="w-4 h-4 shrink-0" />
                      : <Square className="w-4 h-4 shrink-0 text-muted/40" />}
                    <span className={cn('text-sm font-medium', active ? '' : 'text-muted')}>
                      {locale === 'ar' ? m.labelAr : m.label}
                    </span>
                  </button>
                  {active && (
                    <div className="px-4 pb-3">
                      <input
                        type="text"
                        value={paymentValues[m.id] ?? ''}
                        onChange={(e) => setPaymentValues((prev) => ({ ...prev, [m.id]: e.target.value }))}
                        placeholder={m.placeholder}
                        className={inputCls}
                        autoComplete="off"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!agreed || loading}>
          {locale === 'ar' ? 'نشر الإعلان' : 'Publish Listing'}
        </Button>
      </form>
    </div>
  );
}
