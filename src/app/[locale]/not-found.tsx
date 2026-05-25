'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Search } from 'lucide-react';

export default function NotFound() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
      <p className="text-7xl font-black text-purple/20 mb-4">404</p>
      <h1 className="text-2xl font-bold text-white mb-2">
        {isAr ? 'الصفحة غير موجودة' : 'Page not found'}
      </h1>
      <p className="text-muted text-sm mb-8 max-w-sm">
        {isAr
          ? 'الصفحة التي تبحث عنها لا توجد أو تم حذفها.'
          : "The page you're looking for doesn't exist or has been removed."}
      </p>
      <Link
        href={`/${locale}/browse`}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple hover:bg-purple-light text-white text-sm font-medium transition-colors"
      >
        <Search className="w-4 h-4" />
        {isAr ? 'تصفح الإعلانات' : 'Browse Listings'}
      </Link>
    </div>
  );
}
