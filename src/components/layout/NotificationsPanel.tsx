'use client';

import { useStore } from '@/components/providers/StoreProvider';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, ShoppingBag, MessageCircle, Info, Check, ArrowRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/components/providers/StoreProvider';

const typeIcons: Record<Notification['type'], typeof Bell> = {
  sale: ShoppingBag,
  message: MessageCircle,
  system: Info,
  mod: Shield,
};

const typeColors: Record<Notification['type'], string> = {
  sale: 'text-gold bg-gold/10',
  message: 'text-purple bg-purple/10',
  system: 'text-emerald-400 bg-emerald-400/10',
  mod: 'text-amber-400 bg-amber-400/10',
};

function getNotificationHref(n: Notification, locale: string, userRole: string): string {
  if (n.type === 'message' && n.related_id) return `/${locale}/chat?listing=${n.related_id}`;
  if (n.type === 'sale') {
    return userRole === 'seller' ? `/${locale}/dashboard` : `/${locale}/orders`;
  }
  if (n.type === 'mod' && n.related_id) return `/${locale}/mod/tickets/${n.related_id}`;
  return `/${locale}/support`;
}

function formatNotifTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch {
    return '';
  }
}

export function NotificationsPanel({ userRole }: { userRole?: string }) {
  const { notifications, notifOpen, setNotifOpen, markOneRead, markAllRead, unreadCount } = useStore();
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';

  if (!notifOpen) return null;

  const handleClick = (n: Notification) => {
    markOneRead(n.id);
    setNotifOpen(false);
    const href = getNotificationHref(n, locale, userRole ?? 'user');
    router.push(href);
  };

  return (
    <div
      className={cn(
        'fixed top-[68px] w-80 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden',
        isRTL ? 'left-4' : 'right-4'
      )}
    >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple" />
            <span className="font-semibold text-white text-sm">
              {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
            </span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-purple hover:text-purple-light transition-colors"
            >
              <Check className="w-3 h-3" />
              {locale === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
            </button>
          )}
        </div>

        {/* Notification list */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-muted text-sm">
              {locale === 'ar' ? 'لا توجد إشعارات' : 'No notifications yet'}
            </div>
          ) : (
            notifications.slice(0, 8).map((n) => {
              const Icon = typeIcons[n.type];
              return (
                <button
                  type="button"
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'w-full flex gap-3 p-4 text-start transition-colors cursor-pointer',
                    !n.read ? 'bg-purple/5 hover:bg-purple/10' : 'hover:bg-white/5'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                      typeColors[n.type]
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white leading-tight">{n.title}</p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-purple shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5 leading-relaxed">{n.body}</p>
                    <p className="text-xs text-muted/50 mt-1">{formatNotifTime(n.time)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer — See all link */}
        <div className="border-t border-border">
          <Link
            href={`/${locale}/notifications`}
            onClick={() => setNotifOpen(false)}
            className="flex items-center justify-center gap-1.5 py-3 text-xs text-purple hover:text-purple-light transition-colors font-medium"
          >
            {locale === 'ar' ? 'عرض كل الإشعارات' : 'See all notifications'}
            <ArrowRight className={cn('w-3 h-3', isRTL && 'rotate-180')} />
          </Link>
        </div>
    </div>
  );
}
