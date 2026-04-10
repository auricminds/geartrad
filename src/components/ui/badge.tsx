import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'gold' | 'purple' | 'green' | 'red' | 'outline';
  className?: string;
}

const variants = {
  default: 'bg-white/10 text-white border border-white/10',
  gold: 'bg-gold/10 text-gold border border-gold/30',
  purple: 'bg-purple/10 text-purple border border-purple/30',
  green: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
  red: 'bg-red-500/10 text-red-400 border border-red-500/30',
  outline: 'bg-transparent text-white border border-white/20',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
