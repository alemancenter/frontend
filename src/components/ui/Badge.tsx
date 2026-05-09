'use client';

import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion-lite';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  dot?: boolean;
  animated?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

const variantClasses = {
  default: 'bg-muted text-muted-foreground border border-border',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  secondary: 'bg-secondary/10 text-secondary border border-secondary/20',
  accent: 'bg-accent/10 text-accent border border-accent/20',
  success: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-700 border-amber-500/20',
  error: 'bg-red-500/15 text-red-700 border-red-500/20',
  info: 'bg-blue-500/15 text-blue-700 border-blue-500/20',
  outline: 'bg-transparent border-2 border-border text-foreground',
  gradient: 'bg-gradient-to-r from-primary to-accent text-white border-0 shadow-sm',
};

const sizeClasses = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const dotColors = {
  default: 'bg-muted-foreground',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-primary',
  outline: 'bg-foreground',
  gradient: 'bg-white',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
  dot = false,
  animated = false,
  removable = false,
  onRemove,
}: BadgeProps) {
  return (
    <motion.span
      initial={animated ? { opacity: 0, scale: 0.8 } : false}
      animate={animated ? { opacity: 1, scale: 1 } : false}
      exit={animated ? { opacity: 0, scale: 0.8 } : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-all duration-200',
        variantClasses[variant],
        sizeClasses[size],
        removable && 'pr-1',
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant], animated && 'animate-pulse')} />
      )}
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'inline-flex items-center justify-center rounded-full w-4 h-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors',
            size === 'xs' && 'w-3 h-3',
            size === 'lg' && 'w-5 h-5'
          )}
        >
          <svg
            className={cn(
              'w-3 h-3',
              size === 'xs' && 'w-2 h-2',
              size === 'lg' && 'w-3.5 h-3.5'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.span>
  );
}

// Badge Group Component
interface BadgeGroupProps {
  children: React.ReactNode;
  className?: string;
  max?: number;
}

export function BadgeGroup({ children, className, max }: BadgeGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleBadges = max ? childArray.slice(0, max) : childArray;
  const remainingCount = max ? Math.max(0, childArray.length - max) : 0;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visibleBadges}
      {remainingCount > 0 && (
        <Badge variant="outline" size="sm">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

// Status Badge - Common pattern for status indicators
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'away' | 'busy' | 'active' | 'inactive' | 'pending' | 'completed' | 'failed';
  showDot?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const statusConfig = {
  online: { variant: 'success' as const, label: 'متصل' },
  offline: { variant: 'default' as const, label: 'غير متصل' },
  away: { variant: 'warning' as const, label: 'بعيد' },
  busy: { variant: 'error' as const, label: 'مشغول' },
  active: { variant: 'success' as const, label: 'نشط' },
  inactive: { variant: 'default' as const, label: 'غير نشط' },
  pending: { variant: 'warning' as const, label: 'قيد الانتظار' },
  completed: { variant: 'success' as const, label: 'مكتمل' },
  failed: { variant: 'error' as const, label: 'فشل' },
};

export function StatusBadge({ status, showDot = true, size = 'sm', className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={showDot}
      className={className}
    >
      {config.label}
    </Badge>
  );
}

// Notification Badge - For count indicators
interface NotificationBadgeProps {
  count: number;
  max?: number;
  className?: string;
  size?: 'xs' | 'sm';
  variant?: 'primary' | 'error' | 'secondary';
}

export function NotificationBadge({
  count,
  max = 99,
  className,
  size = 'xs',
  variant = 'error',
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold text-white min-w-[18px] h-[18px]',
        size === 'xs' && 'text-[10px] min-w-[16px] h-[16px]',
        size === 'sm' && 'text-xs min-w-[20px] h-[20px]',
        variant === 'primary' && 'bg-primary',
        variant === 'error' && 'bg-error',
        variant === 'secondary' && 'bg-secondary',
        className
      )}
    >
      {displayCount}
    </motion.span>
  );
}

