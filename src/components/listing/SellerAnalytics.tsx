'use client';

import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface SellerAnalyticsProps {
  sellerId: string;
  locale: string;
}

type Analytics = {
  completionRate: number | null;
  cancellationRate: number | null;
  totalOrders: number;
  avgResponseHours: number | null;
};

function StatPill({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-background/60 border border-border/60">
      <div className={cn('flex items-center gap-1.5 text-xs font-medium', color)}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-white font-bold text-sm">{value}</p>
    </div>
  );
}

export function SellerAnalytics({ sellerId, locale }: SellerAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: orders }, { data: profile }] = await Promise.all([
        supabase.from('orders').select('status').eq('seller_id', sellerId),
        supabase.from('profiles').select('avg_response_hours').eq('id', sellerId).single(),
      ]);

      const total = orders?.length ?? 0;
      const completed = orders?.filter((o) => o.status === 'completed').length ?? 0;
      const cancelled = orders?.filter((o) => o.status === 'refunded' || o.status === 'disputed').length ?? 0;

      // Compute live response time via DB function
      const { data: rtData } = await supabase.rpc('compute_seller_response_time', { seller_id_param: sellerId });

      setAnalytics({
        completionRate: total > 0 ? Math.round((completed / total) * 100) : null,
        cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : null,
        totalOrders: total,
        avgResponseHours: rtData ?? profile?.avg_response_hours ?? null,
      });
    }
    load().catch(() => {});
  }, [sellerId]);

  if (!analytics) return null;
  if (analytics.totalOrders === 0 && analytics.avgResponseHours === null) return null;

  const isAr = locale === 'ar';

  return (
    <div className="border-t border-border/50 pt-4 mt-4">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5" />
        {isAr ? 'أداء البائع' : 'Seller Performance'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {analytics.avgResponseHours !== null && (
          <StatPill
            icon={Clock}
            label={isAr ? 'وقت الرد' : 'Response Time'}
            value={
              analytics.avgResponseHours < 1
                ? (isAr ? 'أقل من ساعة' : '< 1 hr')
                : `~${analytics.avgResponseHours.toFixed(1)} ${isAr ? 'ساعة' : 'hrs'}`
            }
            color="text-purple"
          />
        )}
        {analytics.completionRate !== null && (
          <StatPill
            icon={CheckCircle}
            label={isAr ? 'معدل الإتمام' : 'Completion Rate'}
            value={`${analytics.completionRate}%`}
            color={analytics.completionRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}
          />
        )}
        {analytics.cancellationRate !== null && analytics.cancellationRate > 0 && (
          <StatPill
            icon={XCircle}
            label={isAr ? 'معدل الإلغاء' : 'Cancellation Rate'}
            value={`${analytics.cancellationRate}%`}
            color={analytics.cancellationRate <= 5 ? 'text-emerald-400' : 'text-red-400'}
          />
        )}
        {analytics.totalOrders > 0 && (
          <StatPill
            icon={TrendingUp}
            label={isAr ? 'إجمالي الطلبات' : 'Total Orders'}
            value={analytics.totalOrders.toString()}
            color="text-gold"
          />
        )}
      </div>
    </div>
  );
}
