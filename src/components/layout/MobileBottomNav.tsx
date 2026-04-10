'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, MessageCircle, User } from 'lucide-react';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const locale = useLocale();
  const pathname = usePathname();
  const { cartItems, setCartOpen, setNotifOpen } = useStore();

  // On listing pages, the dedicated ListingMobileBar shows instead
  if (pathname.includes('/listing/')) return null;

  const active = (path: string, exact = false) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(path + '/');

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-14">
        {/* Home */}
        <Link
          href={`/${locale}`}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 relative',
            active(`/${locale}`, true) ? 'text-purple' : 'text-muted'
          )}
        >
          {active(`/${locale}`, true) && (
            <span className="absolute top-0 inset-x-0 h-0.5 bg-purple rounded-b-full" />
          )}
          <Home className="w-[22px] h-[22px]" />
          <span className="text-[9px] font-medium leading-none">
            {locale === 'ar' ? 'الرئيسية' : 'Home'}
          </span>
        </Link>

        {/* Browse */}
        <Link
          href={`/${locale}/browse`}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 relative',
            active(`/${locale}/browse`) ? 'text-purple' : 'text-muted'
          )}
        >
          {active(`/${locale}/browse`) && (
            <span className="absolute top-0 inset-x-0 h-0.5 bg-purple rounded-b-full" />
          )}
          <Search className="w-[22px] h-[22px]" />
          <span className="text-[9px] font-medium leading-none">
            {locale === 'ar' ? 'تصفح' : 'Browse'}
          </span>
        </Link>

        {/* Cart — opens drawer */}
        <button
          type="button"
          onClick={() => { setCartOpen(true); setNotifOpen(false); }}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-muted relative"
        >
          <div className="relative">
            <ShoppingCart className="w-[22px] h-[22px]" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1.5 -end-1.5 min-w-[15px] h-[15px] px-0.5 bg-purple rounded-full text-white text-[8px] flex items-center justify-center font-bold leading-none border border-surface">
                {cartItems.length > 9 ? '9+' : cartItems.length}
              </span>
            )}
          </div>
          <span className="text-[9px] font-medium leading-none">
            {locale === 'ar' ? 'السلة' : 'Cart'}
          </span>
        </button>

        {/* Chat */}
        <Link
          href={`/${locale}/chat`}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 relative',
            active(`/${locale}/chat`) ? 'text-purple' : 'text-muted'
          )}
        >
          {active(`/${locale}/chat`) && (
            <span className="absolute top-0 inset-x-0 h-0.5 bg-purple rounded-b-full" />
          )}
          <MessageCircle className="w-[22px] h-[22px]" />
          <span className="text-[9px] font-medium leading-none">
            {locale === 'ar' ? 'رسائل' : 'Chat'}
          </span>
        </Link>

        {/* Profile */}
        <Link
          href={`/${locale}/profile`}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 relative',
            (active(`/${locale}/profile`) || active(`/${locale}/auth`)) ? 'text-purple' : 'text-muted'
          )}
        >
          {(active(`/${locale}/profile`) || active(`/${locale}/auth`)) && (
            <span className="absolute top-0 inset-x-0 h-0.5 bg-purple rounded-b-full" />
          )}
          <User className="w-[22px] h-[22px]" />
          <span className="text-[9px] font-medium leading-none">
            {locale === 'ar' ? 'حسابي' : 'Profile'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
