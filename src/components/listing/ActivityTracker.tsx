'use client';

import { useEffect } from 'react';
import { trackGameActivity } from '@/components/home/RecommendationsSection';

export function ActivityTracker({ game }: { game: string }) {
  useEffect(() => {
    trackGameActivity(game);
  }, [game]);
  return null;
}
