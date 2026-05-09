'use client';

import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from '@/lib/motion-lite';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rounded?: 'default' | 'full' | 'none';
  glow?: boolean;
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading: _isLoading = false,
      loading,
      leftIcon,
      rightIcon,
      rounded = 'default',
      glow = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isLoading = _isLoading || !!loading;

    const variants = {
      primary:
        'bg-primary text-white hover:bg-primary-dark active:bg-primary-darker shadow-md hover:shadow-lg hover:shadow-primary/30',
      secondary:
        'bg-secondary text-white hover:bg-secondary-dark active:bg-secondary/80 shadow-md hover:shadow-lg hover:shadow-secondary/30',
      accent:
        'bg-accent text-white hover:bg-accent-dark active:bg-accent/80 shadow-md hover:shadow-lg hover:shadow-accent/30',
      outline:
        'border-2 border-primary text-primary hover:bg-primary hover:text-white bg-transparent',
      ghost:
        'text-foreground hover:bg-muted/80 active:bg-muted bg-transparent',
      danger:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 shadow-md hover:shadow-lg hover:shadow-destructive/30',
      success:
        'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-md hover:shadow-lg hover:shadow-emerald-600/30',
      gradient:
        'bg-gradient-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110',
    };

    const sizes = {
      xs: 'px-2.5 py-1 text-xs gap-1',
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2',
      xl: 'px-6 py-3 text-lg gap-2.5',
      icon: 'p-2',
    };

    const roundedVariants = {
      default: 'rounded-lg',
      full: 'rounded-full',
      none: 'rounded-none',
    };

    const iconSizes = {
      xs: 'h-3 w-3',
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-5 w-5',
      icon: 'h-4 w-4',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02, y: disabled || isLoading ? 0 : -1 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
          'relative overflow-hidden',
          variants[variant],
          sizes[size],
          roundedVariants[rounded],
          glow && variant === 'primary' && 'animate-glow',
          glow && variant === 'secondary' && 'shadow-secondary/50',
          glow && variant === 'accent' && 'shadow-accent/50',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Shimmer effect overlay for gradient button */}
        {variant === 'gradient' && !disabled && !isLoading && (
          <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}

        {isLoading ? (
          <Loader2 className={cn('animate-spin', iconSizes[size])} />
        ) : (
          leftIcon && <span className={iconSizes[size]}>{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className={iconSizes[size]}>{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// Icon Button Component
interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      icon,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-dark',
      secondary: 'bg-secondary text-white hover:bg-secondary-dark',
      accent: 'bg-accent text-white hover:bg-accent-dark',
      outline: 'border-2 border-border text-foreground hover:bg-muted',
      ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
      danger: 'text-error hover:bg-error/10',
    };

    const sizes = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
    };

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.1 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className={cn('animate-spin', iconSizes[size])} />
        ) : (
          <span className={iconSizes[size]}>{icon}</span>
        )}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Button Group Component
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ButtonGroup = ({ children, className }: ButtonGroupProps) => (
  <div className={cn('inline-flex rounded-lg overflow-hidden', className)}>
    {children}
  </div>
);

export default Button;

