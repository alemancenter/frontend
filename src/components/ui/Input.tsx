'use client';

import { cn } from '@/lib/utils';
import { forwardRef, InputHTMLAttributes, useId, useState } from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion-lite';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined' | 'ghost';
  inputSize?: 'sm' | 'md' | 'lg';
  rounded?: 'default' | 'full' | 'none';
  clearable?: boolean;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      inputSize = 'md',
      rounded = 'default',
      clearable = false,
      onClear,
      type,
      value,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = props.id ?? autoId;
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const hasValue = value && String(value).length > 0;

    const variantClasses = {
      default: 'bg-card border border-border focus:border-primary',
      filled: 'bg-muted/50 border border-transparent focus:border-primary focus:bg-card',
      outlined: 'bg-transparent border-2 border-border focus:border-primary',
      ghost: 'bg-transparent border-b border-border rounded-none focus:border-primary',
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-5 py-3 text-base',
    };

    const roundedClasses = {
      default: variant === 'ghost' ? 'rounded-none' : 'rounded-xl',
      full: 'rounded-full',
      none: 'rounded-none',
    };

    const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-5 h-5',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary',
                iconSizeClasses[inputSize]
              )}
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            value={value}
            className={cn(
              'w-full text-foreground placeholder:text-muted-foreground/60 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
              variantClasses[variant],
              sizeClasses[inputSize],
              roundedClasses[rounded],
              leftIcon && 'pr-10',
              (rightIcon || isPassword || (clearable && hasValue)) && 'pl-10',
              error && 'border-error focus:border-error focus:ring-error/20',
              className
            )}
            {...props}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {clearable && hasValue && !isPassword && (
              <button
                type="button"
                onClick={onClear}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className={iconSizeClasses[inputSize]} />
              </button>
            )}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className={iconSizeClasses[inputSize]} />
                ) : (
                  <Eye className={iconSizeClasses[inputSize]} />
                )}
              </button>
            )}
            {rightIcon && !isPassword && (
              <div className={cn('text-muted-foreground', iconSizeClasses[inputSize])}>
                {rightIcon}
              </div>
            )}
          </div>
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-1.5 text-sm text-error flex items-center gap-1"
            >
              <span className="w-1 h-1 rounded-full bg-error" />
              {error}
            </motion.p>
          )}
          {(hint || helperText) && !error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1.5 text-sm text-muted-foreground"
            >
              {hint || helperText}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

// Search Input Component
type SearchInputProps = Omit<InputProps, 'leftIcon' | 'type'>;

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Search className="w-4 h-4" />}
        clearable
        onClear={onClear}
        rounded="full"
        variant="filled"
        placeholder="بحث..."
        className={className}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: 'default' | 'filled' | 'outlined';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      variant = 'default',
      resize = 'vertical',
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = props.id ?? autoId;

    const variantClasses = {
      default: 'bg-card border border-border focus:border-primary',
      filled: 'bg-muted/50 border border-transparent focus:border-primary focus:bg-card',
      outlined: 'bg-transparent border-2 border-border focus:border-primary',
    };

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 rounded-xl transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
            'min-h-[100px]',
            variantClasses[variant],
            resizeClasses[resize],
            error && 'border-error focus:border-error focus:ring-error/20',
            className
          )}
          {...props}
        />
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-1.5 text-sm text-error flex items-center gap-1"
            >
              <span className="w-1 h-1 rounded-full bg-error" />
              {error}
            </motion.p>
          )}
          {hint && !error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-1.5 text-sm text-muted-foreground"
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Input Group Component
interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const InputGroup = ({ children, className }: InputGroupProps) => (
  <div className={cn('flex', className)}>
    {children}
  </div>
);

// Input Addon Component
interface InputAddonProps {
  children: React.ReactNode;
  position?: 'left' | 'right';
  className?: string;
}

export const InputAddon = ({ children, position = 'left', className }: InputAddonProps) => (
  <div
    className={cn(
      'flex items-center px-4 bg-muted border border-border text-muted-foreground text-sm',
      position === 'left' ? 'border-l-0 rounded-l-xl' : 'border-r-0 rounded-r-xl',
      className
    )}
  >
    {children}
  </div>
);

export default Input;

