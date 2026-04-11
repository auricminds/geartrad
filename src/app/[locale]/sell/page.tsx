'use client';

import { useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckSquare, Square, ChevronDown, Zap, ArrowLeft, Upload, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createListing, uploadListingImage } from '@/lib/api';
import { useStore } from '@/components/providers/StoreProvider';

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
  const { user, authLoading } = useStore();
  const isRTL = locale === 'ar';

  const [agreed, setAgreed]           = useState(false);
  const [boostType, setBoostType]     = useState<BoostOption>('none');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [submitted, setSubmitted]     = useState(false);

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
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [level, setLevel]               = useState('');
  const [hoursPlayed, setHoursPlayed]   = useState('');
  const [winRate, setWinRate]           = useState('');
  const [achievements, setAchievements] = useState('');
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  const availableRanks = game ? (GAME_RANKS[game] ?? []) : [];

  const handleGameChange = (newGame: string) => {
    setGame(newGame);
    setRank(''); // reset rank when game changes
    setCustomGame('');
  };

  const handleImageFile = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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

  if (user.user_metadata?.account_type !== 'seller') {
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

    const priceNum = parseInt(price, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError(locale === 'ar' ? 'السعر يجب أن يكون رقماً موجباً' : 'Price must be a positive number');
      return;
    }

    setLoading(true);
    try {
      // Upload image if a file was chosen
      let coverImageUrl = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80';
      if (imageFile) {
        const uploaded = await uploadListingImage(imageFile, user.id);
        if (uploaded) coverImageUrl = uploaded;
      }

      const result = await createListing(
        {
          title: title.trim(),
          title_ar: titleAr.trim() || undefined,
          description: description.trim(),
          description_ar: descriptionAr.trim() || undefined,
          price: priceNum,
          game: finalGame,
          type,
          cover_image: coverImageUrl,
          rank: rank || undefined,
          boost_type: boostType,
          level: level ? parseInt(level, 10) : null,
          hours_played: hoursPlayed ? parseInt(hoursPlayed, 10) : null,
          win_rate: winRate ? parseInt(winRate, 10) : null,
          achievements: achievements ? parseInt(achievements, 10) : null,
        },
        user.id
      );

      if (!result) {
        setError(locale === 'ar' ? 'حدث خطأ أثناء النشر، حاول مرة أخرى' : 'Failed to publish listing. Try again.');
        return;
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError(locale === 'ar' ? 'خطأ في الشبكة، تحقق من اتصالك وحاول مرة أخرى' : 'Network error. Check your connection and try again.');
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

          <Field label={locale === 'ar' ? 'صورة الغلاف (اختياري)' : 'Cover Image (optional)'}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
              }}
            />
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-2 end-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-purple/50 hover:bg-purple/5 flex flex-col items-center justify-center gap-2 text-muted hover:text-white transition-all"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm">{locale === 'ar' ? 'انقر لاختيار صورة من جهازك' : 'Click to choose an image from your device'}</span>
                <span className="text-xs text-muted/50">JPG, PNG, WEBP — max 5MB</span>
              </button>
            )}
            <p className="text-[11px] text-muted">{locale === 'ar' ? 'اتركه فارغاً لاستخدام صورة افتراضية' : 'Leave empty to use a default image'}</p>
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

        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!agreed || loading}>
          {locale === 'ar' ? 'نشر الإعلان' : 'Publish Listing'}
        </Button>
      </form>
    </div>
  );
}
