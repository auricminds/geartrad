'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: { en: 'Is GearTrad safe to use?', ar: 'هل GearTrad آمن للاستخدام؟' },
    a: {
      en: 'Yes. Every transaction is protected by escrow — your money is held by GearTrad and only released to the seller after you confirm you\'ve received your item. You\'re never at risk of paying and getting nothing.',
      ar: 'نعم. كل معاملة محمية بنظام الضمان — يتم الاحتفاظ بأموالك لدى GearTrad ولن تُحوَّل للبائع إلا بعد تأكيدك استلام العنصر.',
    },
  },
  {
    q: { en: 'How does payment work?', ar: 'كيف تعمل المدفوعات؟' },
    a: {
      en: 'We support Vodafone Cash, InstaPay, Bitcoin (BTC), USDT, and Ethereum. All payments go directly from buyer to seller — GearTrad charges no platform fees.',
      ar: 'ندعم فودافون كاش، إنستاباي، بيتكوين، USDT، والإيثريوم. تذهب المدفوعات مباشرة من المشتري إلى البائع — لا رسوم على المنصة.',
    },
  },
  {
    q: { en: 'What if the seller doesn\'t deliver?', ar: 'ماذا لو لم يُسلّم البائع؟' },
    a: {
      en: 'If the seller doesn\'t deliver, do NOT confirm delivery. Open a support ticket or ping a moderator in chat. Our team investigates and issues a refund if the seller is at fault.',
      ar: 'إذا لم يُسلّم البائع، لا تؤكد الاستلام. افتح تذكرة دعم أو استدعِ مشرفاً في الدردشة. فريقنا يحقق في المسألة ويعيد المبلغ إن ثبت تقصير البائع.',
    },
  },
  {
    q: { en: 'What games are supported?', ar: 'ما هي الألعاب المدعومة؟' },
    a: {
      en: 'Valorant, Fortnite, CS2, League of Legends, PUBG Mobile, Apex Legends, FIFA, Call of Duty, Brawl Stars, and more. Any game works — just choose "Other" when posting.',
      ar: 'فالورانت، فورتنايت، CS2، ليغ أوف ليجندز، PUBG Mobile، أبيكس ليجندز، فيفا، كول أوف ديوتي، براول ستارز، وغيرها. أي لعبة تعمل — اختر "أخرى" عند النشر.',
    },
  },
  {
    q: { en: 'How do I get a Verified badge?', ar: 'كيف أحصل على شارة التحقق؟' },
    a: {
      en: 'Go to your profile and click "Get Verified". Upload a photo of your government ID and a selfie holding it. Our moderators review within 24–48 hours.',
      ar: 'اذهب إلى ملفك الشخصي واضغط "التحقق من الهوية". ارفع صورة هويتك وسيلفي أنت تمسكها. يراجع مشرفونا الطلب خلال 24-48 ساعة.',
    },
  },
  {
    q: { en: 'Can I sell any account type?', ar: 'هل يمكنني بيع أي نوع حساب؟' },
    a: {
      en: 'Yes — accounts, skins, weapons, bundles, and tickets are all supported. You must own the item you\'re selling and accurately describe it. False listings result in an immediate ban.',
      ar: 'نعم — الحسابات، السكنات، الأسلحة، الحزم، والتذاكر كلها مدعومة. يجب أن تكون مالك العنصر وتصفه بدقة. الإعلانات الكاذبة تؤدي لحظر فوري.',
    },
  },
  {
    q: { en: 'How long does delivery usually take?', ar: 'كم يستغرق التسليم عادةً؟' },
    a: {
      en: 'Most sellers deliver within a few hours after payment. You can chat directly with the seller to coordinate. Always confirm delivery only after you\'ve tested the account.',
      ar: 'معظم البائعين يُسلّمون خلال ساعات قليلة بعد الدفع. يمكنك الدردشة مع البائع مباشرة للتنسيق. دائماً أكّد الاستلام فقط بعد اختبار الحساب.',
    },
  },
  {
    q: { en: 'Are there any fees?', ar: 'هل هناك أي رسوم؟' },
    a: {
      en: 'No fees at all — for buyers or sellers. You pay or receive exactly the listed price. 100% of every sale goes to the seller.',
      ar: 'لا رسوم إطلاقاً — لا للمشترين ولا للبائعين. تدفع أو تستلم السعر المعلن بالضبط. 100% من كل عملية بيع تذهب للبائع.',
    },
  },
];

function FAQItem({ q, a, isOpen, onToggle }: {
  q: { en: string; ar: string };
  a: { en: string; ar: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <motion.div
      layout
      className={cn(
        'rounded-2xl border transition-all duration-300 overflow-hidden relative',
        isOpen
          ? 'border-purple/40 bg-gradient-to-b from-purple/8 to-surface/80 shadow-lg shadow-purple/10'
          : 'border-border bg-surface/40 hover:border-purple/20 hover:bg-surface/60'
      )}
    >
      {/* Purple left accent bar */}
      {isOpen && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          exit={{ scaleY: 0 }}
          className="absolute start-0 top-0 bottom-0 w-0.5 bg-purple rounded-full origin-top"
        />
      )}

      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-start"
      >
        <span className={cn('text-sm font-semibold transition-colors duration-200', isOpen ? 'text-white' : 'text-white/80')}>
          {isAr ? q.ar : q.en}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={cn('shrink-0 p-0.5 rounded-full transition-colors duration-200', isOpen ? 'text-purple' : 'text-muted')}
        >
          <Plus className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-5 pb-5">
              <p className="text-sm text-muted leading-relaxed">{isAr ? a.ar : a.en}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">
          {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </h2>
        <p className="text-muted text-sm">
          {isAr ? 'كل ما تحتاج معرفته عن GearTrad' : 'Everything you need to know about GearTrad'}
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-2">
        {FAQS.map((item, i) => (
          <FAQItem
            key={i}
            q={item.q}
            a={item.a}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>
    </section>
  );
}
