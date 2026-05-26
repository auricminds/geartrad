import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  return (
    <footer className="border-t border-border/50 bg-surface/30 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/logo.png"
                alt="GearTrad"
                width={56}
                height={56}
                className="w-14 h-14 rounded-xl object-contain"
                unoptimized
              />
              <span className="font-bold text-lg">
                Gear<span className="text-gold">Trad</span>
              </span>
            </div>
            <p className="text-muted text-sm max-w-xs leading-relaxed">
              {t('tagline')}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://www.instagram.com/geartrad?igsh=MXJ1NDB2dGF1eGJvMA%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GearTrad on Instagram"
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-purple/10 hover:text-purple flex items-center justify-center text-muted transition-all duration-200"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">{t('links.company')}</h4>
            <ul className="space-y-2">
              {[
                { label: t('links.about'), href: `/${locale}/about` },
                { label: t('links.advertise'), href: `/${locale}/advertise` },
                { label: t('links.careers'), href: `/${locale}/careers` },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">{t('links.support')}</h4>
            <ul className="space-y-2">
              {[
                { label: t('links.help'), href: `/${locale}/help` },
                { label: t('links.safety'), href: `/${locale}/safety` },
                { label: t('links.terms'), href: `/${locale}/terms` },
                { label: t('links.privacy'), href: `/${locale}/privacy` },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} GearTrad. {t('rights')}
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted/50">
              Built by AuricMinds Group
            </p>
            <Link href={`/${locale}/mod/sign-in`} className="text-xs text-muted/60 hover:text-white transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
