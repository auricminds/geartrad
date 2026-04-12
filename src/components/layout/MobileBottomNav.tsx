'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, MessageCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const iconVariants = {
    active: { scale: 1.15, y: -2, transition: { type: 'spring' as const, stiffness: 500, damping: 18 } },
    inactive: { scale: 1, y: 0, transition: { duration: 0.15 } },
  };

  const tabItems = [
    {
      href: `/${locale}`,
      icon: Home,
      label: locale === 'ar' ? 'الرئيسية' : 'Home',
      isActive: active(`/${locale}`, true),
      isLink: true,
    },
    {
      href: `/${locale}/browse`,
      icon: Search,
      label: locale === 'ar' ? 'تصفح' : 'Browse',
      isActive: active(`/${locale}/browse`),
      isLink: true,
    },
    {
      href: `/${locale}/chat`,
      icon: MessageCircle,
      label: locale === 'ar' ? 'رسائل' : 'Chat',
      isActive: active(`/${locale}/chat`),
      isLink: true,
    },
    {
      href: `/${locale}/profile`,
      icon: User,
      label: locale === 'ar' ? 'حسابي' : 'Profile',
      isActive: active(`/${locale}/profile`) || active(`/${locale}/auth`),
      isLink: true,
    },
  ];

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
            <motion.span
              layoutId="nav-indicator"
              className="absolute top-0 inset-x-0 h-0.5 bg-purple rounded-b-full"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <motion.div
            variants={iconVariants}
            animate={active(`/${locale}`, true) ? 'active' : 'inactive'}
          >
            <Home className="w-[22px] h-[22px]" />
          </motion.div>
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
            <motion.span
              layoutId="nav-indicator"
              className="absolute top-0 inset-x-0 h-0.5 bg-purple rounded-b-full"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <motion.div
            variants={iconVariants}
            animate={active(`/${locale}/browse`) ? 'active' : 'inactive'}
          >
            <Search className="w-[22px] h-[22px]" />
          </motion.div>
          <span className="text-[9px] font-medium leading-none">
            {locale === 'ar' ? 'تصفح' : 'Browse'}
          </span>
        </Link>

        {/* Cart — opens drawer */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={() => { setCartOpen(true); setNotifOpen(false); }}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-muted relative"
        >
          <div className="relative">
            <ShoppingCart className="w-[22px] h-[22px]" />
            {cartItems.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="absolute -top-1.5 -end-1.5 min-w-[15px] h-[15px] px-0.5 bg-purple rounded-full text-white text-[8px] flex items-center justify-center font-bold leading-none border border-surface"
              >
                {cartItems.length > 9 ? '9+' : cartItems.length}
              </motion.span>
            )}
          </div>
          <span className="text-[9px] font-medium leading-none">
            {locale === 'ar' ? 'السلة' : 'Cart'}
          </span>
        </motion.button>

        {/* Chat */}
        <Link
          href={`/${locale}/chat`}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 relative',
            active(`/${locale}/chat`) ? 'text-purple' : 'text-muted'
          )}
        >
          {active(`/${locale}/chat`) && (
            <motion.span
              layoutId="nav-indicator"
              className="absolute top-0 inset-x-0 h-0.5 bg-purple rounded-b-full"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <motion.div
            variants={iconVariants}
            animate={active(`/${locale}/chat`) ? 'active' : 'inactive'}
          >
            <MessageCircle className="w-[22px] h-[22px]" />
          </motion.div>
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
            <motion.span
              layoutId="nav-indicator"
              className="absolute top-0 inset-x-0 h-0.5 bg-purple rounded-b-full"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <motion.div
            variants={iconVariants}
            animate={(active(`/${locale}/profile`) || active(`/${locale}/auth`)) ? 'active' : 'inactive'}
          >
            <User className="w-[22px] h-[22px]" />
          </motion.div>
          <span className="text-[9px] font-medium leading-none">
            {locale === 'ar' ? 'حسابي' : 'Profile'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
