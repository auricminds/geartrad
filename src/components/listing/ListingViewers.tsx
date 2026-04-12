'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ListingViewersProps {
  listingId: string;
}

export function ListingViewers({ listingId }: ListingViewersProps) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    // Give each browser session a unique presence key
    const myKey = Math.random().toString(36).slice(2);

    const channel = supabase.channel(`listing-presence:${listingId}`, {
      config: { presence: { key: myKey } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [listingId]);

  if (count < 2) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium animate-pulse">
      <Eye className="w-3 h-3" />
      {count} people viewing this
    </span>
  );
}
