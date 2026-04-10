'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/components/providers/StoreProvider';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { X, ShoppingCart, Trash2 } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CartDrawer() {
  const { cartItems, removeFromCart, cartOpen, setCartOpen } = useStore();
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const total = cartItems.reduce((sum, item) => sum + item.listing.price, 0);

  // Don't render until client-side (portal needs document.body)
  if (!mounted || !cartOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close cart"
        className="fixed inset-0 w-full bg-black/60 cursor-default"
        style={{ zIndex: 9998 }}
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 bottom-0 w-full max-w-sm bg-surface flex flex-col shadow-2xl',
          isRTL ? 'left-0 border-r border-border' : 'right-0 border-l border-border'
        )}
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-purple" />
            <h2 className="font-bold text-white text-lg">
              {locale === 'ar' ? 'سلة التسوق' : 'Your Cart'}
            </h2>
            {cartItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-purple/20 text-purple text-xs font-medium">
                {cartItems.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
              <ShoppingCart className="w-14 h-14 text-muted/20" />
              <div>
                <p className="text-white font-medium mb-1">
                  {locale === 'ar' ? 'سلتك فارغة' : 'Your cart is empty'}
                </p>
                <p className="text-muted text-sm">
                  {locale === 'ar' ? 'أضف حسابات لتبدأ' : 'Add listings to get started'}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setCartOpen(false)}>
                {locale === 'ar' ? 'تصفح الإعلانات' : 'Browse Listings'}
              </Button>
            </div>
          ) : (
            cartItems.map((item) => {
              const title =
                locale === 'ar' && item.listing.titleAr
                  ? item.listing.titleAr
                  : item.listing.title;
              return (
                <div
                  key={item.listing.id}
                  className="flex gap-3 p-3 rounded-xl bg-background border border-border group"
                >
                  <img
                    src={item.listing.coverImage}
                    alt={title}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/${locale}/listing/${item.listing.id}`}
                      onClick={() => setCartOpen(false)}
                      className="text-sm font-medium text-white hover:text-purple transition-colors line-clamp-2 leading-snug"
                    >
                      {title}
                    </Link>
                    <p className="text-xs text-muted mt-1">{item.listing.game}</p>
                    <p className="text-sm font-bold text-white mt-1.5">
                      {formatPrice(item.listing.price, locale)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.listing.id)}
                    className="text-muted hover:text-red-400 transition-colors shrink-0 p-1 self-start mt-0.5"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted text-sm">
                {locale === 'ar' ? 'الإجمالي' : 'Total'}
              </span>
              <span className="text-xl font-bold text-white">{formatPrice(total, locale)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                setCartOpen(false);
                // Each listing is unique — navigate to the first item's checkout
                if (cartItems.length === 1) {
                  router.push(`/${locale}/checkout/${cartItems[0].listing.id}`);
                } else {
                  // Multiple items: go to first item checkout (marketplace pattern)
                  router.push(`/${locale}/checkout/${cartItems[0].listing.id}`);
                }
              }}
            >
              {locale === 'ar' ? 'إتمام الشراء' : 'Checkout'}
            </Button>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="w-full text-sm text-muted hover:text-white transition-colors py-1"
            >
              {locale === 'ar' ? 'متابعة التسوق' : 'Continue Shopping'}
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
