'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  ShoppingCart, Bell, Menu, X, Globe,
  Heart, MessageCircle, LogOut, LayoutDashboard, Store, UserCircle, User, ShoppingBag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationsPanel } from '@/components/layout/NotificationsPanel';
import { useStore } from '@/components/providers/StoreProvider';
import { cn } from '@/lib/utils';

export function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const { cartItems, cartOpen, setCartOpen, notifOpen, setNotifOpen, unreadCount, likedIds, user, authLoading, signOut } = useStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);

  const otherLocale = locale === 'en' ? 'ar' : 'en';
  const otherLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  const navLinks = [
    { href: `/${locale}/browse`,       label: t('browse') },
    { href: `/${locale}/bestsellers`,  label: t('bestsellers') },
    { href: `/${locale}/top-accounts`, label: t('topAccounts') },
    { href: `/${locale}/advertise`,    label: t('advertise') },
  ];

  // Close dropdowns when tapping outside.
  // Uses 'pointerdown' (not 'mousedown') so it fires immediately on touch
  // devices — iOS Safari doesn't always fire mousedown for taps on
  // non-interactive elements, leaving panels stuck open and blocking other taps.
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => {
      document.removeEventListener('pointerdown', handler);
    };
  }, [setNotifOpen]);

  // Close mobile menu automatically on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCart  = () => { setCartOpen(!cartOpen); setNotifOpen(false); setUserMenuOpen(false); setMobileOpen(false); };
  const toggleNotif = () => { setNotifOpen(!notifOpen); setCartOpen(false); setUserMenuOpen(false); setMobileOpen(false); };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await signOut();
    router.push(`/${locale}`);
  };

  const closeMobileMenu = () => setMobileOpen(false);

  const displayName = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'User';
  const initials = displayName.charAt(0).toUpperCase();
  const isSeller = user?.user_metadata?.account_type === 'seller';

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border/50">
        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href={`/${locale}`} onClick={closeMobileMenu} className="flex items-center gap-2 shrink-0 group">
            <motion.div whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.05 }} transition={{ duration: 0.4 }}>
              <Image
                src="/logo.png"
                alt="GearTrad"
                width={52}
                height={52}
                className="w-12 h-12 rounded-xl object-contain"
                priority
                unoptimized
              />
            </motion.div>
            <span className="font-bold text-lg tracking-tight group-hover:text-white transition-colors">
              Gear<span className="text-gold">Trad</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === link.href ? 'bg-purple/10 text-purple' : 'text-muted hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {/* Language */}
            <Link
              href={otherLocalePath}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted hover:text-white hover:bg-white/5 transition-all"
            >
              <Globe className="w-4 h-4" />
              <span>{locale === 'en' ? 'عربي' : 'EN'}</span>
            </Link>

            {/* Messages */}
            <Link
              href={`/${locale}/chat`}
              className="hidden sm:flex p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
              aria-label="Messages"
            >
              <MessageCircle className="w-5 h-5" />
            </Link>

            {/* Wishlist */}
            <Link
              href={`/${locale}/wishlist`}
              className="relative hidden sm:flex p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {likedIds.length > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold border-2 border-background leading-none">
                  {likedIds.length > 9 ? '9+' : likedIds.length}
                </span>
              )}
            </Link>

            {/* Cart — hidden on mobile (bottom nav handles it) */}
            <button
              type="button"
              onClick={toggleCart}
              className="relative hidden md:flex p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 bg-purple rounded-full text-white text-[9px] flex items-center justify-center font-bold border-2 border-background leading-none">
                  {cartItems.length > 9 ? '9+' : cartItems.length}
                </span>
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <motion.button
                type="button"
                onClick={toggleNotif}
                whileTap={{ scale: 0.9 }}
                animate={unreadCount > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
                transition={unreadCount > 0 ? { duration: 0.5, delay: 0.3 } : {}}
                className="relative p-2.5 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 bg-purple rounded-full text-white text-[9px] flex items-center justify-center font-bold border-2 border-background leading-none"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </motion.button>
              <NotificationsPanel />
            </div>

            {/* Auth */}
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-surface border border-border animate-pulse" />
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); setCartOpen(false); setMobileOpen(false); }}
                  className={cn(
                    'flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border transition-all duration-200',
                    userMenuOpen ? 'bg-purple/10 border-purple' : 'border-border hover:border-purple/40 hover:bg-white/5'
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple to-purple-light flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-white max-w-[100px] truncate">{displayName}</span>
                </button>

                <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full mt-2 end-0 w-52 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                      <p className="text-xs text-muted truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="py-1.5">
                      <DropdownLink href={`/${locale}/profile`} icon={UserCircle} label={locale === 'ar' ? 'ملفي الشخصي' : 'My Profile'} onClick={() => setUserMenuOpen(false)} />
                      <DropdownLink href={`/${locale}/orders`}  icon={ShoppingBag} label={locale === 'ar' ? 'مشترياتي' : 'My Orders'} onClick={() => setUserMenuOpen(false)} />
                      <DropdownLink href={`/${locale}/wishlist`} icon={Heart} label={locale === 'ar' ? 'المفضلة' : 'Wishlist'} onClick={() => setUserMenuOpen(false)} />
                      <DropdownLink href={`/${locale}/chat`}    icon={MessageCircle} label={locale === 'ar' ? 'الرسائل' : 'Messages'} onClick={() => setUserMenuOpen(false)} />
                      {isSeller && (
                        <>
                          <DropdownLink href={`/${locale}/sell`} icon={Store} label={locale === 'ar' ? 'إضافة إعلان' : 'New Listing'} onClick={() => setUserMenuOpen(false)} />
                          <DropdownLink href={`/${locale}/dashboard`} icon={LayoutDashboard} label={locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'} onClick={() => setUserMenuOpen(false)} />
                        </>
                      )}
                    </div>
                    <div className="border-t border-border py-1.5">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        {locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                      </button>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                {/* Desktop: text buttons */}
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href={`/${locale}/auth/sign-in`}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-transparent hover:bg-white/5 text-white transition-all duration-200"
                  >
                    {t('signIn')}
                  </Link>
                  <Link
                    href={`/${locale}/auth/sign-up`}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg bg-purple hover:bg-purple-light text-white shadow-lg shadow-purple/25 transition-all duration-200"
                  >
                    {t('signUp')}
                  </Link>
                </div>
                {/* Mobile: icon link to profile/auth page */}
                <Link
                  href={`/${locale}/profile`}
                  className="sm:hidden p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
                  aria-label="Sign in"
                >
                  <User className="w-5 h-5" />
                </Link>
              </>
            )}

            {!user && (
              <Link
                href={`/${locale}/sell`}
                className="hidden lg:inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gold hover:bg-gold-light text-black shadow-lg shadow-gold/25 transition-all duration-200"
              >
                {t('sell')}
              </Link>
            )}

            {/* Burger — mobile only */}
            <motion.button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              whileTap={{ scale: 0.88 }}
              className="md:hidden p-2.5 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mobileOpen ? 'x' : 'menu'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </nav>
      </header>

      {/* ── Mobile menu overlay — rendered outside <header> ── */}
      <AnimatePresence>
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="md:hidden fixed inset-0 z-40"
          style={{ top: '64px' }}
        >
          {/* Tap backdrop to close */}
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 w-full bg-black/50 cursor-default"
            onClick={closeMobileMenu}
          />

          {/* Scrollable menu panel */}
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-background border-t border-border/50 overflow-y-auto"
            style={{ maxHeight: 'calc(100dvh - 64px - 56px)' }}
          >
            <div className="max-w-7xl mx-auto px-4 py-4 pb-6 flex flex-col gap-1">

              {/* Nav links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'flex items-center px-4 py-3.5 rounded-xl text-sm font-medium transition-all',
                    pathname === link.href
                      ? 'bg-purple/10 text-purple'
                      : 'text-muted hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {/* Auth section */}
              {user ? (
                <div className="border-t border-border/50 pt-3 mt-2 space-y-1">
                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-2 mb-1">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple to-purple-light flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                  </div>

                  <MobileMenuLink href={`/${locale}/profile`}    icon={UserCircle}    label={locale === 'ar' ? 'ملفي الشخصي' : 'My Profile'}    onClick={closeMobileMenu} />
                  <MobileMenuLink href={`/${locale}/orders`}     icon={ShoppingBag}   label={locale === 'ar' ? 'مشترياتي' : 'My Orders'}           onClick={closeMobileMenu} />
                  <MobileMenuLink href={`/${locale}/wishlist`}   icon={Heart}         label={locale === 'ar' ? 'المفضلة' : 'Wishlist'}            onClick={closeMobileMenu} />
                  {isSeller && (
                    <>
                      <MobileMenuLink href={`/${locale}/sell`}      icon={Store}          label={locale === 'ar' ? 'إضافة إعلان' : 'New Listing'} onClick={closeMobileMenu} />
                      <MobileMenuLink href={`/${locale}/dashboard`} icon={LayoutDashboard} label={locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}  onClick={closeMobileMenu} />
                    </>
                  )}

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      {locale === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-border/50 pt-3 mt-2 flex flex-col gap-2">
                  {/* Sign in / Sign up — pure <Link> elements, no nested <button> */}
                  <div className="flex gap-2">
                    <Link
                      href={`/${locale}/auth/sign-in`}
                      onClick={closeMobileMenu}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-surface border border-border rounded-xl text-sm font-medium text-white transition-all hover:border-purple/40 hover:bg-surface-light"
                    >
                      {t('signIn')}
                    </Link>
                    <Link
                      href={`/${locale}/auth/sign-up`}
                      onClick={closeMobileMenu}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-purple rounded-xl text-sm font-medium text-white transition-all hover:bg-purple-light shadow-lg shadow-purple/25"
                    >
                      {t('signUp')}
                    </Link>
                  </div>
                  <Link
                    href={`/${locale}/sell`}
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center px-4 py-3 bg-gold rounded-xl text-sm font-semibold text-black transition-all hover:bg-gold-light shadow-lg shadow-gold/25"
                  >
                    {t('sell')}
                  </Link>
                </div>
              )}

              {/* Language toggle */}
              <Link
                href={otherLocalePath}
                onClick={closeMobileMenu}
                className="flex items-center gap-2 px-4 py-3.5 rounded-xl text-sm text-muted hover:text-white hover:bg-white/5 transition-all mt-1"
              >
                <Globe className="w-4 h-4" />
                {locale === 'en' ? 'عربي' : 'English'}
              </Link>

            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}

function DropdownLink({ href, icon: Icon, label, onClick }: { href: string; icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted hover:text-white hover:bg-white/5 transition-colors">
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}

function MobileMenuLink({ href, icon: Icon, label, onClick }: { href: string; icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-sm text-muted hover:text-white hover:bg-white/5 transition-colors">
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}
