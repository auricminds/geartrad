'use client';

import { useStore } from '@/components/providers/StoreProvider';
import { useLocale } from 'next-intl';
import { Bell, ShoppingBag, MessageCircle, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/components/providers/StoreProvider';

const typeIcons: Record<Notification['type'], typeof Bell> = {
  sale: ShoppingBag,
  message: MessageCircle,
  system: Info,
};

const typeColors: Record<Notification['type'], string> = {
  sale: 'text-gold bg-gold/10',
  message: 'text-purple bg-purple/10',
  system: 'text-emerald-400 bg-emerald-400/10',
};

export function NotificationsPanel() {
  const { notifications, notifOpen, setNotifOpen, markOneRead, markAllRead, unreadCount } = useStore();
  const locale = useLocale();
  const isRTL = locale === 'ar';

  if (!notifOpen) return null;

  return (
    // Uses fixed positioning anchored to the viewport so the panel never goes
    // off-screen on small mobile displays (absolute right-0 relative to the
    // small bell-button div would push the panel partially off the left edge).
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
            notifications.map((n) => {
              const Icon = typeIcons[n.type];
              return (
                <button
                  type="button"
                  key={n.id}
                  onClick={() => markOneRead(n.id)}
                  className={cn(
                    'w-full flex gap-3 p-4 text-start transition-colors',
                    !n.read ? 'bg-purple/5 hover:bg-purple/10 cursor-pointer' : 'hover:bg-white/5 cursor-default'
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
                    <p className="text-xs text-muted/50 mt-1">{n.time}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
    </div>
  );
}
