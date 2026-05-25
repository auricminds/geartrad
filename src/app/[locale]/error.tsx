'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
      <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-muted text-sm mb-8 max-w-sm">
        An unexpected error occurred. Please try again or go back to the homepage.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-purple hover:bg-purple-light text-white text-sm font-medium transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-surface border border-border text-white text-sm font-medium hover:border-purple/40 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
