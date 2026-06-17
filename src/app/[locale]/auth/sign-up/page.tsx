'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2, Mail, Lock, User, ShoppingBag, Store, Zap, AlertCircle,
  CheckCircle2, Phone, Globe, Upload, ChevronLeft, ChevronRight,
  IdCard, FileText, X, Eye, EyeOff, UserCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────
type BoostType   = 'none' | 'weekly' | 'monthly';
type AccountType = 'buyer' | 'seller';
type Gender      = 'male' | 'female' | 'prefer_not_to_say';
type IdDocType   = 'national_id' | 'passport' | 'birth_certificate';

// ─── Country list (MENA first) ───────────────────────────────────────────────
const MENA_CODES = new Set(['EG','SA','AE','KW','QA','BH','OM','JO','LB','IQ','MA','TN','DZ','LY','SD','YE','SY','PS']);

const COUNTRIES = [
  // MENA
  { code: 'EG', en: 'Egypt', ar: 'مصر' },
  { code: 'SA', en: 'Saudi Arabia', ar: 'السعودية' },
  { code: 'AE', en: 'UAE', ar: 'الإمارات' },
  { code: 'KW', en: 'Kuwait', ar: 'الكويت' },
  { code: 'QA', en: 'Qatar', ar: 'قطر' },
  { code: 'BH', en: 'Bahrain', ar: 'البحرين' },
  { code: 'OM', en: 'Oman', ar: 'عُمان' },
  { code: 'JO', en: 'Jordan', ar: 'الأردن' },
  { code: 'LB', en: 'Lebanon', ar: 'لبنان' },
  { code: 'IQ', en: 'Iraq', ar: 'العراق' },
  { code: 'MA', en: 'Morocco', ar: 'المغرب' },
  { code: 'TN', en: 'Tunisia', ar: 'تونس' },
  { code: 'DZ', en: 'Algeria', ar: 'الجزائر' },
  { code: 'LY', en: 'Libya', ar: 'ليبيا' },
  { code: 'SD', en: 'Sudan', ar: 'السودان' },
  { code: 'YE', en: 'Yemen', ar: 'اليمن' },
  { code: 'SY', en: 'Syria', ar: 'سوريا' },
  { code: 'PS', en: 'Palestine', ar: 'فلسطين' },
  // Global
  { code: 'US', en: 'United States', ar: 'الولايات المتحدة' },
  { code: 'GB', en: 'United Kingdom', ar: 'المملكة المتحدة' },
  { code: 'CA', en: 'Canada', ar: 'كندا' },
  { code: 'AU', en: 'Australia', ar: 'أستراليا' },
  { code: 'DE', en: 'Germany', ar: 'ألمانيا' },
  { code: 'FR', en: 'France', ar: 'فرنسا' },
  { code: 'TR', en: 'Turkey', ar: 'تركيا' },
  { code: 'PK', en: 'Pakistan', ar: 'باكستان' },
  { code: 'IN', en: 'India', ar: 'الهند' },
  { code: 'NG', en: 'Nigeria', ar: 'نيجيريا' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcAge(dob: string): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function maxDob(): string {
  // must be at least 13
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d.toISOString().split('T')[0];
}

function minDob(): string {
  // max age 100
  const d = new Date();
  d.setFullYear(d.getFullYear() - 100);
  return d.toISOString().split('T')[0];
}

// ─── Slide animation ──────────────────────────────────────────────────────────
const slideVariants = {
  enter:  (dir: number) => ({ x: dir > 0 ?  60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? -60 :  60, opacity: 0 }),
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SignUpPage() {
  const locale = useLocale();
  const isAr   = locale === 'ar';

  // Step state
  const [step, setStep]         = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1 — Account type
  const [accountType, setAccountType] = useState<AccountType>('buyer');
  const [boostType, setBoostType]     = useState<BoostType>('none');

  // Step 2 — Personal details
  const [fullName,  setFullName]  = useState('');
  const [username,  setUsername]  = useState('');
  const [dob,       setDob]       = useState('');
  const [gender,    setGender]    = useState<Gender | ''>('');
  const [country,   setCountry]   = useState('');
  const [phone,     setPhone]     = useState('');

  // Step 3 — ID + credentials
  const [idDocType, setIdDocType] = useState<IdDocType | ''>('');
  const [idNumber,  setIdNumber]  = useState('');
  const [idFile,    setIdFile]    = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [showCf,    setShowCf]    = useState(false);
  const [agreed,    setAgreed]    = useState(false);

  // Shared
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Navigation ──────────────────────────────────────────────────────────────
  function go(next: number) {
    setDirection(next > step ? 1 : -1);
    setError('');
    setStep(next);
  }

  function validateStep2(): string {
    if (!fullName.trim())  return isAr ? 'الاسم الكامل مطلوب' : 'Full name is required';
    if (!username.trim())  return isAr ? 'اسم المستخدم مطلوب' : 'Username is required';
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim()))
      return isAr ? 'اسم المستخدم: 3-20 حرف، أرقام أو _ فقط' : 'Username: 3-20 chars, letters/numbers/_ only';
    if (!dob)              return isAr ? 'تاريخ الميلاد مطلوب' : 'Date of birth is required';
    if (calcAge(dob) < 13) return isAr ? 'يجب أن يكون عمرك 13 سنة أو أكثر' : 'You must be at least 13 years old';
    if (!gender)           return isAr ? 'يرجى تحديد الجنس' : 'Please select a gender';
    if (!country)          return isAr ? 'يرجى تحديد البلد' : 'Please select your country';
    if (!phone.trim())     return isAr ? 'رقم الهاتف مطلوب' : 'Phone number is required';
    return '';
  }

  function validateStep3(): string {
    if (!idDocType)        return isAr ? 'يرجى تحديد نوع المستند' : 'Please select your ID document type';
    if (!idNumber.trim())  return isAr ? 'يرجى إدخال رقم المستند' : 'Please enter your document number';
    if (!idFile)           return isAr ? 'يرجى رفع صورة المستند' : 'Please upload your ID document';
    if (!email.trim())     return isAr ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    if (!email.includes('@')) return isAr ? 'بريد إلكتروني غير صالح' : 'Invalid email address';
    if (password.length < 8)  return isAr ? 'كلمة المرور 8 أحرف على الأقل' : 'Password must be at least 8 characters';
    if (password !== confirm)  return isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
    if (!agreed)               return isAr ? 'يجب الموافقة على الشروط' : 'You must agree to the terms';
    return '';
  }

  // ── File pick ───────────────────────────────────────────────────────────────
  const onFilePick = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError(isAr ? 'الحجم الأقصى للملف 10 ميغابايت' : 'Max file size is 10 MB');
      return;
    }
    setIdFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setIdPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setIdPreview(null); // PDF — no preview
    }
  }, [isAr]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const err = validateStep3();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');

    try {
      // 1. Create auth account (Supabase sends confirmation email)
      const { data, error: authErr } = await supabase.auth.signUp({
        email:    email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username:      username.trim(),
            account_type:  accountType,
            full_name:     fullName.trim(),
            phone:         phone.trim(),
            country,
            gender,
            date_of_birth: dob,
            boost_type:    boostType !== 'none' ? boostType : null,
          },
        },
      });

      if (authErr) {
        if (authErr.message.toLowerCase().includes('already registered') ||
            authErr.message.toLowerCase().includes('already been registered')) {
          setError(isAr ? 'هذا البريد الإلكتروني مسجل بالفعل' : 'This email is already registered');
        } else {
          setError(authErr.message);
        }
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setError(isAr ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'Something went wrong. Please try again.');
        return;
      }

      // 2. Upload ID document to private storage
      const form = new FormData();
      form.append('user_id',    userId);
      form.append('id_doc_type', idDocType);
      form.append('id_number',   idNumber.trim());
      form.append('id_doc',      idFile!);

      const uploadRes = await fetch('/api/auth/upload-id', { method: 'POST', body: form });
      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        // Don't block registration for upload failures — show warning
        console.warn('[sign-up] ID upload failed:', body.error);
      }

      setDone(true);
    } catch {
      setError(isAr ? 'خطأ في الشبكة. تحقق من اتصالك وحاول مجدداً' : 'Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              {isAr ? 'تم إنشاء حسابك!' : 'Account Created!'}
            </h1>
            <p className="text-muted text-sm leading-relaxed mb-2">
              {isAr
                ? 'أرسلنا رسالة تأكيد إلى بريدك الإلكتروني. انقر على الرابط لتفعيل حسابك.'
                : 'We sent a confirmation email to your inbox. Click the link inside to activate your account.'}
            </p>
            <p className="text-muted/70 text-xs mb-6">
              {isAr
                ? 'سيتم مراجعة وثيقتك من قِبل فريقنا خلال 24 ساعة.'
                : 'Your ID document will be reviewed by our team within 24 hours.'}
            </p>
            <Link
              href={`/${locale}/auth/sign-in`}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-xl bg-purple hover:bg-purple-light text-white shadow-lg shadow-purple/25 transition-all duration-200"
            >
              {isAr ? 'تسجيل الدخول' : 'Go to Sign In'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Progress bar ─────────────────────────────────────────────────────────────
  const STEP_LABELS = isAr
    ? ['نوع الحساب', 'بياناتك', 'التحقق والأمان']
    : ['Account Type', 'Your Details', 'Verify & Secure'];

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-8">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-surface border border-border rounded-2xl p-5 sm:p-8 shadow-2xl">

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-9 h-9 bg-gradient-to-br from-purple to-purple-light rounded-xl flex items-center justify-center shadow-lg shadow-purple/30">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Gear<span className="text-gold">Trad</span></span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1.5 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1">
                <div className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  s < step  ? 'bg-purple' :
                  s === step ? 'bg-purple/60' :
                  'bg-white/10'
                )} />
                <p className={cn(
                  'text-[10px] mt-1 text-center transition-colors',
                  s === step ? 'text-purple' : 'text-muted/50'
                )}>
                  {STEP_LABELS[s - 1]}
                </p>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 mb-4 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Animated step content */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div key="step1" custom={direction}
                  variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                >
                  <Step1
                    isAr={isAr}
                    accountType={accountType} setAccountType={setAccountType}
                    boostType={boostType} setBoostType={setBoostType}
                    onNext={() => go(2)}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" custom={direction}
                  variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                >
                  <Step2
                    isAr={isAr}
                    fullName={fullName}   setFullName={setFullName}
                    username={username}   setUsername={setUsername}
                    dob={dob}             setDob={setDob}
                    gender={gender}       setGender={setGender}
                    country={country}     setCountry={setCountry}
                    phone={phone}         setPhone={setPhone}
                    onBack={() => go(1)}
                    onNext={() => {
                      const e = validateStep2();
                      if (e) { setError(e); return; }
                      go(3);
                    }}
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" custom={direction}
                  variants={slideVariants} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                >
                  <Step3
                    isAr={isAr}
                    dob={dob}
                    idDocType={idDocType}   setIdDocType={setIdDocType}
                    idNumber={idNumber}     setIdNumber={setIdNumber}
                    idFile={idFile}
                    idPreview={idPreview}
                    onFilePick={onFilePick}
                    clearFile={() => { setIdFile(null); setIdPreview(null); }}
                    fileRef={fileRef}
                    email={email}         setEmail={setEmail}
                    password={password}   setPassword={setPassword}
                    confirm={confirm}     setConfirm={setConfirm}
                    showPw={showPw}       setShowPw={setShowPw}
                    showCf={showCf}       setShowCf={setShowCf}
                    agreed={agreed}       setAgreed={setAgreed}
                    locale={locale}
                    onBack={() => go(2)}
                    onSubmit={handleSubmit}
                    loading={loading}
                    accountType={accountType}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-xs text-muted/60 text-center mt-5">
            {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
            <Link href={`/${locale}/auth/sign-in`} className="text-purple hover:text-purple-light transition-colors">
              {isAr ? 'تسجيل الدخول' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Account Type ─────────────────────────────────────────────────────
function Step1({ isAr, accountType, setAccountType, boostType, setBoostType, onNext }: {
  isAr: boolean;
  accountType: AccountType; setAccountType: (v: AccountType) => void;
  boostType: BoostType; setBoostType: (v: BoostType) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white mb-0.5">
          {isAr ? 'ما الذي تريده؟' : 'What brings you here?'}
        </h2>
        <p className="text-muted text-xs">{isAr ? 'اختر نوع حسابك' : 'Choose your account type'}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {([
          { type: 'buyer' as AccountType,
            icon: <ShoppingBag className="w-7 h-7" />,
            labelEn: 'Buyer', labelAr: 'مشتري',
            descEn: 'Browse & buy gaming accounts, skins and weapons',
            descAr: 'تصفح وشراء حسابات الألعاب والسكنات والأسلحة',
          },
          { type: 'seller' as AccountType,
            icon: <Store className="w-7 h-7" />,
            labelEn: 'Seller', labelAr: 'بائع',
            descEn: 'List your gaming accounts, skins and weapons for sale',
            descAr: 'اعرض حساباتك وسكناتك وأسلحتك للبيع',
          },
        ] as const).map((opt) => (
          <button key={opt.type} type="button"
            onClick={() => setAccountType(opt.type)}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 text-center',
              accountType === opt.type
                ? opt.type === 'seller'
                  ? 'bg-gold/10 border-gold text-gold'
                  : 'bg-purple/10 border-purple text-purple'
                : 'border-border text-muted hover:border-white/20 hover:text-white'
            )}>
            {opt.icon}
            <div>
              <p className="text-sm font-bold">{isAr ? opt.labelAr : opt.labelEn}</p>
              <p className="text-[11px] opacity-70 mt-0.5 leading-snug">{isAr ? opt.descAr : opt.descEn}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Boost upsell for sellers */}
      {accountType === 'seller' && (
        <div className="p-4 rounded-xl border border-gold/20 bg-gold/5">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-gold" />
            <p className="text-sm font-semibold text-white">{isAr ? 'رفع الإعلانات' : 'Boost Your Listings'}</p>
          </div>
          <p className="text-xs text-muted mb-3">
            {isAr ? 'ارفع إعلاناتك للأعلى وزِد مبيعاتك' : 'Get your listings seen first and sell faster'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'none',    en: 'No Boost',  ar: 'بدون رفع',  priceEn: 'Free',     priceAr: 'مجاناً' },
              { id: 'weekly',  en: '1 Week',    ar: 'أسبوع',     priceEn: '50 EGP',   priceAr: '٥٠ ج.م' },
              { id: 'monthly', en: '1 Month',   ar: 'شهر',       priceEn: '150 EGP',  priceAr: '١٥٠ ج.م', save: true },
            ] as const).map((opt) => (
              <button key={opt.id} type="button" onClick={() => setBoostType(opt.id as BoostType)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all',
                  boostType === opt.id
                    ? opt.id === 'monthly' ? 'border-gold bg-gold/10' :
                      opt.id === 'weekly'  ? 'border-purple bg-purple/10' :
                      'border-white/20 bg-white/5'
                    : 'border-border/50 text-muted hover:border-border'
                )}>
                {opt.id !== 'none' && <Zap className="w-3 h-3 text-gold" />}
                <span className="text-[11px] font-medium text-white">{isAr ? opt.ar : opt.en}</span>
                <span className="text-[11px] font-bold text-gold">{isAr ? opt.priceAr : opt.priceEn}</span>
                {'save' in opt && opt.save && (
                  <span className="text-[10px] text-emerald-400">{isAr ? 'وفّر' : 'Save'}</span>
                )}
              </button>
            ))}
          </div>
          {boostType !== 'none' && (
            <p className="text-[11px] text-muted mt-2 text-center">
              {isAr ? 'سيتم محاسبتك عند نشر إعلانك الأول' : 'Charged when you publish your first listing'}
            </p>
          )}
        </div>
      )}

      <button type="button" onClick={onNext}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple hover:bg-purple-light text-white font-semibold text-sm shadow-lg shadow-purple/25 transition-all">
        {isAr ? 'التالي' : 'Next'}
        {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── Step 2: Personal Details ─────────────────────────────────────────────────
function Step2({ isAr, fullName, setFullName, username, setUsername, dob, setDob,
  gender, setGender, country, setCountry, phone, setPhone, onBack, onNext }: {
  isAr: boolean;
  fullName: string; setFullName: (v: string) => void;
  username: string; setUsername: (v: string) => void;
  dob: string; setDob: (v: string) => void;
  gender: Gender | ''; setGender: (v: Gender) => void;
  country: string; setCountry: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  onBack: () => void; onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white mb-0.5">
          {isAr ? 'أخبرنا عنك' : 'Tell us about yourself'}
        </h2>
        <p className="text-muted text-xs">
          {isAr ? 'معلوماتك الشخصية — تُستخدم للتحقق فقط' : 'Your personal info — used for verification only'}
        </p>
      </div>

      {/* Full name */}
      <div>
        <label className="block text-xs text-muted mb-1.5">
          {isAr ? 'الاسم الكامل' : 'Full Legal Name'}
          <span className="text-muted/50 ms-1">{isAr ? '(كما في الوثيقة)' : '(as on your ID)'}</span>
        </label>
        <div className="relative">
          <UserCheck className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder={isAr ? 'محمد أحمد علي' : 'John Michael Smith'}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-white/5 border border-border text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-purple/50 transition-colors" />
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-xs text-muted mb-1.5">
          {isAr ? 'اسم المستخدم (Gamer Tag)' : 'Username / Gamer Tag'}
        </label>
        <div className="relative">
          <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
            placeholder="GamerTag123"
            maxLength={20}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-white/5 border border-border text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-purple/50 transition-colors" />
        </div>
        <p className="text-[10px] text-muted/50 mt-1">{isAr ? '3-20 حرف، أرقام وشرطة سفلية مسموح' : '3-20 chars, letters, numbers, underscore'}</p>
      </div>

      {/* Date of birth */}
      <div>
        <label className="block text-xs text-muted mb-1.5">
          {isAr ? 'تاريخ الميلاد' : 'Date of Birth'}
          <span className="text-muted/50 ms-1">{isAr ? '(يجب أن تكون +13 سنة)' : '(must be 13+)'}</span>
        </label>
        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
          min={minDob()} max={maxDob()}
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-border text-sm text-white focus:outline-none focus:border-purple/50 transition-colors [color-scheme:dark]" />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-xs text-muted mb-1.5">{isAr ? 'النوع الاجتماعي' : 'Gender'}</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { val: 'male',             en: 'Male',              ar: 'ذكر' },
            { val: 'female',           en: 'Female',            ar: 'أنثى' },
            { val: 'prefer_not_to_say',en: 'Prefer not to say', ar: 'لا أفضّل التحديد' },
          ] as const).map((opt) => (
            <button key={opt.val} type="button" onClick={() => setGender(opt.val)}
              className={cn(
                'py-2 rounded-xl border text-xs font-medium transition-all',
                gender === opt.val ? 'bg-purple/15 border-purple text-purple' : 'border-border text-muted hover:border-white/20 hover:text-white'
              )}>
              {isAr ? opt.ar : opt.en}
            </button>
          ))}
        </div>
      </div>

      {/* Country */}
      <div>
        <label className="block text-xs text-muted mb-1.5">{isAr ? 'الدولة' : 'Country'}</label>
        <div className="relative">
          <Globe className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <select value={country} onChange={(e) => setCountry(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-white/5 border border-border text-sm text-white focus:outline-none focus:border-purple/50 transition-colors appearance-none [color-scheme:dark]">
            <option value="" disabled>{isAr ? 'اختر دولتك' : 'Select your country'}</option>
            <optgroup label={isAr ? 'الشرق الأوسط وشمال أفريقيا' : 'Middle East & North Africa'}>
              {COUNTRIES.filter((c) => MENA_CODES.has(c.code)).map((c) => (
                <option key={c.code} value={c.code}>{isAr ? c.ar : c.en}</option>
              ))}
            </optgroup>
            <optgroup label={isAr ? 'دول أخرى' : 'Other Countries'}>
              {COUNTRIES.filter((c) => !MENA_CODES.has(c.code)).map((c) => (
                <option key={c.code} value={c.code}>{isAr ? c.ar : c.en}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs text-muted mb-1.5">
          {isAr ? 'رقم الهاتف' : 'Phone Number'}
        </label>
        <div className="relative">
          <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            type="tel"
            placeholder={isAr ? 'مثال: +201012345678' : 'e.g. +201012345678'}
            className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-white/5 border border-border text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-purple/50 transition-colors" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:text-white hover:border-white/30 transition-all">
          {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {isAr ? 'رجوع' : 'Back'}
        </button>
        <button type="button" onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple hover:bg-purple-light text-white font-semibold text-sm shadow-lg shadow-purple/25 transition-all">
          {isAr ? 'التالي' : 'Next'}
          {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: ID + Credentials ─────────────────────────────────────────────────
function Step3({ isAr, dob, idDocType, setIdDocType, idNumber, setIdNumber,
  idFile, idPreview, onFilePick,
  clearFile, fileRef, email, setEmail, password, setPassword, confirm, setConfirm,
  showPw, setShowPw, showCf, setShowCf, agreed, setAgreed,
  locale, onBack, onSubmit, loading, accountType }: {
  isAr: boolean; dob: string;
  idDocType: IdDocType | ''; setIdDocType: (v: IdDocType) => void;
  idNumber: string; setIdNumber: (v: string) => void;
  idFile: File | null; idPreview: string | null;
  onFilePick: (f: File) => void; clearFile: () => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  confirm: string; setConfirm: (v: string) => void;
  showPw: boolean; setShowPw: (v: boolean) => void;
  showCf: boolean; setShowCf: (v: boolean) => void;
  agreed: boolean; setAgreed: (v: boolean) => void;
  locale: string; onBack: () => void; onSubmit: () => void;
  loading: boolean; accountType: AccountType;
}) {
  const age = calcAge(dob);
  const showBirthCert = age < 18;

  const DOC_TYPES = [
    { val: 'national_id'       as IdDocType, en: 'National ID',        ar: 'بطاقة هوية وطنية', icon: <IdCard className="w-4 h-4" /> },
    { val: 'passport'          as IdDocType, en: 'Passport',           ar: 'جواز سفر',          icon: <FileText className="w-4 h-4" /> },
    ...(showBirthCert
      ? [{ val: 'birth_certificate' as IdDocType, en: 'Birth Certificate', ar: 'شهادة ميلاد', icon: <FileText className="w-4 h-4" /> }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white mb-0.5">
          {isAr ? 'التحقق من الهوية' : 'Verify Your Identity'}
        </h2>
        <p className="text-muted text-xs">
          {isAr
            ? 'نحتاج مستنداً للتحقق منك وحماية جميع المستخدمين من الاحتيال'
            : 'We verify every user to keep the community safe from scammers'}
        </p>
      </div>

      {/* ID document type */}
      <div>
        <label className="block text-xs text-muted mb-2">
          {isAr ? 'نوع المستند' : 'ID Document Type'}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DOC_TYPES.map((opt) => (
            <button key={opt.val} type="button" onClick={() => setIdDocType(opt.val)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all',
                idDocType === opt.val
                  ? 'bg-purple/15 border-purple text-purple'
                  : 'border-border text-muted hover:border-white/20 hover:text-white'
              )}>
              {opt.icon}
              {isAr ? opt.ar : opt.en}
            </button>
          ))}
        </div>
        {showBirthCert && (
          <p className="text-[10px] text-amber-400/80 mt-1.5">
            {isAr
              ? 'الأشخاص دون 18 سنة: يُنصح برفع شهادة الميلاد'
              : 'Under 18: birth certificate is recommended'}
          </p>
        )}
      </div>

      {/* ID number */}
      {idDocType && (
        <div>
          <label className="block text-xs text-muted mb-1.5">
            {idDocType === 'national_id'
              ? isAr ? 'الرقم القومي' : 'National ID Number'
              : idDocType === 'passport'
              ? isAr ? 'رقم جواز السفر' : 'Passport Number'
              : isAr ? 'رقم شهادة الميلاد' : 'Birth Certificate No.'}
            <span className="text-red-400 ms-0.5">*</span>
          </label>
          <div className="relative">
            <IdCard className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder={idDocType === 'national_id' ? (isAr ? 'مثال: 30001011234567' : 'e.g. 30001011234567') : (isAr ? 'أدخل رقم المستند' : 'Enter document number')}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-white/5 border border-border text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-purple/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* File upload */}
      <div>
        <label className="block text-xs text-muted mb-2">
          {isAr ? 'صورة المستند' : 'Upload Document'}
          <span className="text-muted/50 ms-1">{isAr ? '(JPG, PNG أو PDF — 10 ميغابايت كحد أقصى)' : '(JPG, PNG or PDF — max 10 MB)'}</span>
        </label>

        {idFile ? (
          <div className="relative rounded-xl border border-purple/30 bg-purple/5 overflow-hidden">
            {idPreview ? (
              <img src={idPreview} alt="ID preview"
                className="w-full max-h-40 object-contain" />
            ) : (
              <div className="flex items-center gap-3 p-4">
                <FileText className="w-8 h-8 text-purple" />
                <div>
                  <p className="text-sm text-white font-medium truncate max-w-[200px]">{idFile.name}</p>
                  <p className="text-xs text-muted">{(idFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}
            <button type="button" onClick={clearFile}
              className="absolute top-2 end-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500/80 transition-all">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 py-7 rounded-xl border-2 border-dashed border-border hover:border-purple/40 hover:bg-purple/5 transition-all group">
            <Upload className="w-6 h-6 text-muted group-hover:text-purple transition-colors" />
            <p className="text-sm text-muted group-hover:text-white transition-colors">
              {isAr ? 'انقر لرفع الملف' : 'Click to upload'}
            </p>
            <p className="text-[10px] text-muted/50">{isAr ? 'أو اسحب الملف هنا' : 'or drag and drop'}</p>
          </button>
        )}

        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFilePick(f); e.target.value = ''; }} />
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs text-muted mb-1.5">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
        <div className="relative">
          <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            type="email" placeholder="you@example.com"
            autoComplete="email"
            className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-white/5 border border-border text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-purple/50 transition-colors" />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-xs text-muted mb-1.5">{isAr ? 'كلمة المرور' : 'Password'}</label>
        <div className="relative">
          <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input value={password} onChange={(e) => setPassword(e.target.value)}
            type={showPw ? 'text' : 'password'} placeholder="••••••••"
            autoComplete="new-password"
            className="w-full ps-10 pe-10 py-2.5 rounded-xl bg-white/5 border border-border text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-purple/50 transition-colors" />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {/* Strength bar */}
        <div className="flex gap-1 mt-1.5">
          {[8, 10, 12].map((len, i) => (
            <div key={i} className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              password.length >= len
                ? i === 0 ? 'bg-red-400' : i === 1 ? 'bg-amber-400' : 'bg-emerald-400'
                : 'bg-white/10'
            )} />
          ))}
        </div>
        <p className="text-[10px] text-muted/50 mt-0.5">
          {isAr ? '8 أحرف على الأقل' : 'At least 8 characters'}
        </p>
      </div>

      {/* Confirm password */}
      <div>
        <label className="block text-xs text-muted mb-1.5">{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</label>
        <div className="relative">
          <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)}
            type={showCf ? 'text' : 'password'} placeholder="••••••••"
            autoComplete="new-password"
            className={cn(
              'w-full ps-10 pe-10 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder:text-muted/50 focus:outline-none transition-colors',
              confirm && confirm !== password ? 'border-red-500/50 focus:border-red-500/70' : 'border-border focus:border-purple/50'
            )} />
          <button type="button" onClick={() => setShowCf(!showCf)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
            {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-start gap-2.5 cursor-pointer group">
        <div className={cn(
          'w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
          agreed ? 'bg-purple border-purple' : 'border-border group-hover:border-purple/50'
        )}
          onClick={() => setAgreed(!agreed)}>
          {agreed && <CheckCircle2 className="w-3 h-3 text-white" />}
        </div>
        <span className="text-xs text-muted leading-relaxed">
          {isAr ? 'أوافق على' : 'I agree to the'}{' '}
          <Link href={`/${locale}/terms`} target="_blank" className="text-purple hover:underline">
            {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
          </Link>
          {' '}{isAr ? 'و' : 'and'}{' '}
          <Link href={`/${locale}/privacy`} target="_blank" className="text-purple hover:underline">
            {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </Link>
        </span>
      </label>

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-muted text-sm hover:text-white hover:border-white/30 transition-all">
          {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {isAr ? 'رجوع' : 'Back'}
        </button>
        <button type="button" onClick={onSubmit} disabled={loading}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg transition-all',
            loading ? 'opacity-60 cursor-not-allowed' : '',
            accountType === 'seller'
              ? 'bg-gold hover:bg-gold-light text-black shadow-gold/25'
              : 'bg-purple hover:bg-purple-light text-white shadow-purple/25'
          )}>
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : null}
          {isAr ? 'إنشاء الحساب' : 'Create Account'}
        </button>
      </div>
    </div>
  );
}
