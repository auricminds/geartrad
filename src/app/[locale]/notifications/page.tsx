'use client';

import { useStore } from '@/components/providers/StoreProvider';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, ShoppingBag, MessageCircle, Info, Check, ArrowLeft, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/components/providers/StoreProvider';
import { useEffect } from 'react';

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

const typeLabels: Record<Notification['type'], { en: string; ar: string }> = {
  sale: { en: 'Order', ar: 'طلب' },
  message: { en: 'Message', ar: 'رسالة' },
  system: { en: 'System', ar: 'نظام' },
  mod: { en: 'Mod', ar: 'إشراف' },
};

function getNotificationHref(n: Notification, locale: string, userRole: string): string {
  if (n.type === 'message' && n.related_id) return `/${locale}/chat?listing=${n.related_id}`;
  if (n.type === 'sale') {
    return userRole === 'seller' ? `/${locale}/dashboard` : `/${locale}/orders`;
  }
  if (n.type === 'mod' && n.related_id) return `/${locale}/mod/tickets/${n.related_id}`;
  return `/${locale}/support`;
}

function formatTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function NotificationsPage() {
  const { user, userRole, authLoading, notifications, markOneRead, markAllRead, unreadCount } = useStore();
  const locale = useLocale();
  const router = useRouter();
  const isAr = locale === 'ar';

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/auth/sign-in`);
  }, [user, authLoading, locale, router]);

  const handleClick = (n: Notification) => {
    markOneRead(n.id);
    router.push(getNotificationHref(n, locale, userRole));
  };

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-surface border border-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href={`/${locale}/profile`}
        className="inline-flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm mb-8"
      >
        <ArrowLeft className={cn('w-4 h-4', isAr && 'rotate-180')} />
        {isAr ? 'رجوع' : 'Back'}
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple/10 border border-purple/20">
            <Bell className="w-5 h-5 text-purple" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isAr ? 'الإشعارات' : 'Notifications'}
            </h1>
            <p className="text-sm text-muted">
              {unreadCount > 0
                ? isAr ? `${unreadCount} غير مقروء` : `${unreadCount} unread`
                : isAr ? 'كل شيء مقروء' : 'All caught up'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple/10 border border-purple/20 text-purple hover:bg-purple/20 text-sm font-medium transition-all"
          >
            <Check className="w-4 h-4" />
            {isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
            <Bell className="w-7 h-7 text-muted" />
          </div>
          <p className="text-muted text-sm">{isAr ? 'لا توجد إشعارات بعد' : 'No notifications yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type];
            const label = typeLabels[n.type][isAr ? 'ar' : 'en'];
            return (
              <button
                type="button"
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  'w-full flex gap-4 p-4 rounded-2xl border text-start transition-all',
                  !n.read
                    ? 'bg-purple/5 border-purple/20 hover:bg-purple/10'
                    : 'bg-surface border-border hover:bg-white/5'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', typeColors[n.type])}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md', typeColors[n.type])}>
                          {label}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-purple shrink-0" />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white leading-tight">{n.title}</p>
                      <p className="text-xs text-muted mt-1 leading-relaxed">{n.body}</p>
                    </div>
                    <p className="text-[10px] text-muted/60 shrink-0 mt-1">{formatTime(n.time, locale)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
