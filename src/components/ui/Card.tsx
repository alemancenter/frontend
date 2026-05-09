'use client';

import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from '@/lib/motion-lite';
import { forwardRef } from 'react';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: 'default' | 'outlined' | 'elevated' | 'glass' | 'gradient' | 'highlight';
  hover?: boolean;
  glow?: boolean;
  noPadding?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, glow = false, noPadding = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-card border border-border shadow-card',
      outlined: 'bg-transparent border-2 border-border',
      elevated: 'bg-card shadow-elevated',
      glass: 'glass border border-white/10',
      gradient: 'bg-gradient-card border border-border/50',
      highlight: 'bg-card border-2 border-primary/20 shadow-primary',
    };

    const hoverEffects: HTMLMotionProps<'div'>['whileHover'] = hover
      ? {
          y: -5,
          boxShadow: '0 25px 50px -12px rgba(8, 145, 178, 0.15)',
          transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
        }
      : undefined;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        whileHover={hoverEffects}
        className={cn(
          'rounded-2xl transition-all duration-300',
          !noPadding && 'p-6',
          variants[variant],
          glow && 'shadow-glow',
          hover && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

// Card Title
export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-bold tracking-tight text-card-foreground leading-none', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

// Card Description
export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground leading-relaxed', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

// Card Content
export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

// Card Footer
export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-3 pt-4 border-t border-border/50', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

// Feature Card - for showcasing features
interface FeatureCardProps extends Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ className, icon, title, description, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card border border-border p-6 transition-all duration-300',
        'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        className
      )}
      {...props}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        {icon && (
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
        <h4 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  )
);
FeatureCard.displayName = 'FeatureCard';

// Stat Card - for displaying statistics
interface StatCardProps extends Omit<HTMLMotionProps<'div'>, 'ref' | 'children'> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
}

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, icon, trend, color = 'primary', ...props }, ref) => {
    const iconBgVariants = {
      primary: 'bg-gradient-to-br from-primary to-primary-light',
      secondary: 'bg-gradient-to-br from-secondary to-secondary-light',
      accent: 'bg-gradient-to-br from-accent to-accent-light',
      success: 'bg-gradient-to-br from-success to-success/70',
      warning: 'bg-gradient-to-br from-warning to-warning/70',
      error: 'bg-gradient-to-br from-error to-error/70',
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'relative overflow-hidden rounded-2xl bg-card border border-border p-6 shadow-card',
          'hover:shadow-elevated transition-shadow duration-300',
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <div
                className={cn(
                  'inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full',
                  trend.direction === 'up' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                )}
              >
                <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg',
                iconBgVariants[color]
              )}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Decorative corner */}
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
      </motion.div>
    );
  }
);
StatCard.displayName = 'StatCard';

export default Card;

