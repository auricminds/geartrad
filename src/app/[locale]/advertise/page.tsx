'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useRef } from 'react';
import { Monitor, Star, TrendingUp, Mail, Phone, Building2, User, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { submitAdInquiry } from '@/lib/api';

export default function AdvertisePage() {
  const t = useTranslations('advertise');
  const locale = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const packages = [
    {
      key: 'banner',
      icon: Monitor,
      color: 'border-purple/30 from-purple/10',
      iconColor: 'text-purple',
      iconBg: 'bg-purple/10',
    },
    {
      key: 'featured',
      icon: Star,
      color: 'border-gold/30 from-gold/10',
      iconColor: 'text-gold',
      iconBg: 'bg-gold/10',
    },
    {
      key: 'sponsored',
      icon: TrendingUp,
      color: 'border-emerald-500/30 from-emerald-500/10',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium mb-4">
          <TrendingUp className="w-3.5 h-3.5" />
          {locale === 'ar' ? 'شركاء الإعلانات' : 'Advertising Partners'}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{t('title')}</h1>
        <p className="text-muted max-w-xl mx-auto">{t('subtitle')}</p>
      </div>

      {/* Ad Packages */}
      <section className="mb-14">
        <h2 className="text-xl font-bold text-white mb-2 text-center">{t('packages.title')}</h2>
        <p className="text-muted text-sm text-center mb-8">
          {locale === 'ar'
            ? 'تواصل معنا للحصول على عرض سعر مخصص لحملتك'
            : 'Contact us for a custom quote tailored to your campaign'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <button
              key={pkg.key}
              type="button"
              onClick={scrollToForm}
              className={`p-6 rounded-2xl bg-gradient-to-b ${pkg.color} to-surface border transition-all hover:-translate-y-1 duration-200 text-start cursor-pointer w-full`}
            >
              <div
                className={`w-12 h-12 rounded-2xl ${pkg.iconBg} flex items-center justify-center mb-4`}
              >
                <pkg.icon className={`w-6 h-6 ${pkg.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {t(`packages.${pkg.key}.title`)}
              </h3>
              <p className="text-sm text-muted mb-4">{t(`packages.${pkg.key}.desc`)}</p>
              <p className={`text-xs font-medium ${pkg.iconColor} opacity-80`}>
                {locale === 'ar' ? 'السعر حسب الطلب' : 'Pricing on request'}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-14">
        {[
          {
            value: '12K+',
            label: locale === 'ar' ? 'مستخدم نشط شهرياً' : 'Monthly Active Users',
          },
          {
            value: '85%',
            label: locale === 'ar' ? 'معدل التفاعل مع الإعلانات' : 'Ad Engagement Rate',
          },
          {
            value: '18-35',
            label: locale === 'ar' ? 'الفئة العمرية الأساسية' : 'Core Age Demographic',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="text-center p-4 rounded-2xl bg-surface border border-border"
          >
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <div ref={formRef} className="bg-surface border border-border rounded-2xl p-5 sm:p-8">
        <h2 className="text-xl font-bold text-white mb-2">{t('submit')}</h2>
        <p className="text-muted text-sm mb-6">
          {locale === 'ar'
            ? 'أرسل لنا تفاصيل حملتك وسنرد عليك بعرض سعر خلال 24 ساعة'
            : "Send us your campaign details and we'll reply with a custom quote within 24 hours"}
        </p>

        {submitted ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">
              {locale === 'ar' ? 'تم الإرسال!' : 'Message Sent!'}
            </h3>
            <p className="text-muted text-sm">
              {locale === 'ar'
                ? 'سنتواصل معك قريباً بعرض سعر مخصص'
                : "We'll reach out with a custom quote soon"}
            </p>
          </div>
        ) : (
          <FormBody
            locale={locale}
            t={t}
            submitting={submitting}
            formError={formError}
            onSubmit={async (fields) => {
              setFormError('');
              setSubmitting(true);
              const ok = await submitAdInquiry(fields);
              setSubmitting(false);
              if (ok) {
                setSubmitted(true);
              } else {
                setFormError(
                  locale === 'ar'
                    ? 'حدث خطأ أثناء الإرسال، حاول مرة أخرى'
                    : 'Failed to send. Please try again.'
                );
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Controlled form extracted to avoid re-renders on parent state ─────────────
const inputCls = 'w-full bg-background border border-border rounded-xl ps-10 pe-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple transition-all';

function FormBody({
  locale,
  t,
  submitting,
  formError,
  onSubmit,
}: {
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  submitting: boolean;
  formError: string;
  onSubmit: (fields: { name: string; company: string; email: string; phone: string; message: string }) => void;
}) {
  const [name, setName]       = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [message, setMessage] = useState('');

  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, company, email, phone, message });
      }}
    >
      {formError && (
        <div className="sm:col-span-2 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {formError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">{t('name')}</label>
        <div className="relative">
          <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className={inputCls} placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Your full name'} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">{t('company')}</label>
        <div className="relative">
          <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
            className={inputCls} placeholder={locale === 'ar' ? 'اسم شركتك' : 'Company name'} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">{t('email')}</label>
        <div className="relative">
          <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className={inputCls} placeholder="contact@company.com" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted">{t('phone')}</label>
        <div className="relative">
          <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            className={inputCls} placeholder="+20 10 0000 0000" />
        </div>
      </div>

      <div className="sm:col-span-2 flex flex-col gap-1.5">
        <label className="text-sm text-muted">{t('message')}</label>
        <div className="relative">
          <MessageSquare className="absolute start-3 top-3 w-4 h-4 text-muted pointer-events-none" />
          <textarea rows={4} required value={message} onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-background border border-border rounded-xl ps-10 pe-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple transition-all resize-none"
            placeholder={locale === 'ar'
              ? 'أخبرنا عن حملتك الإعلانية، ميزانيتك، والفئة المستهدفة...'
              : 'Tell us about your campaign, budget, and target audience...'} />
        </div>
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gold hover:bg-yellow-400 disabled:opacity-60 text-black font-semibold transition-all shadow-lg shadow-gold/30"
        >
          {submitting
            ? (locale === 'ar' ? 'جاري الإرسال...' : 'Sending...')
            : t('submit')}
        </button>
      </div>
    </form>
  );
}
