'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, Check, Search } from 'lucide-react';
import { forwardRef, SelectHTMLAttributes, useId, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion-lite';

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  options: Option[];
  placeholder?: string;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  selectSize?: 'sm' | 'md' | 'lg';
  rounded?: 'default' | 'full' | 'none';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      options,
      placeholder,
      rightIcon,
      variant = 'default',
      selectSize = 'md',
      rounded = 'default',
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const selectId = props.id ?? autoId;

    const variantClasses = {
      default: 'bg-card border border-border focus:border-primary',
      filled: 'bg-muted/50 border border-transparent focus:border-primary focus:bg-card',
      outlined: 'bg-transparent border-2 border-border focus:border-primary',
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-5 py-3 text-base',
    };

    const roundedClasses = {
      default: 'rounded-xl',
      full: 'rounded-full',
      none: 'rounded-none',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
              {rightIcon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full text-foreground appearance-none cursor-pointer transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
              variantClasses[variant],
              sizeClasses[selectSize],
              roundedClasses[rounded],
              'pl-10',
              rightIcon ? 'pr-10' : 'pr-4',
              error && 'border-error focus:border-error focus:ring-error/20',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-muted-foreground">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground transition-colors',
              'group-focus-within:text-primary',
              selectSize === 'sm' && 'w-4 h-4',
              selectSize === 'md' && 'w-5 h-5',
              selectSize === 'lg' && 'w-5 h-5'
            )}
          />
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

Select.displayName = 'Select';

// Custom Dropdown Select Component (more stylish)
interface CustomSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  options: Option[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect({
  label,
  error,
  hint,
  options,
  value,
  onChange,
  placeholder = 'اختر...',
  searchable = false,
  disabled = false,
  className,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uniqueId = useId();
  const searchInputId = `custom-select-search-${uniqueId}`;

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-xl',
            'bg-card border border-border transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
            isOpen && 'border-primary ring-2 ring-primary/20',
            error && 'border-error focus:border-error focus:ring-error/20'
          )}
        >
          <span className={cn(!selectedOption && 'text-muted-foreground')}>
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.icon}
                {selectedOption.label}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute z-50 w-full mt-2 py-2 rounded-xl',
                'bg-card border border-border shadow-elevated',
                'max-h-60 overflow-auto'
              )}
            >
              {searchable && (
                <div className="px-3 pb-2 border-b border-border mb-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      ref={inputRef}
                      id={searchInputId}
                      name="custom-select-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث..."
                      className="w-full pr-10 pl-4 py-2 text-sm bg-muted/50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                  لا توجد نتائج
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (!option.disabled) {
                        onChange?.(option.value);
                        setIsOpen(false);
                        setSearchQuery('');
                      }
                    }}
                    disabled={option.disabled}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-2.5 text-sm text-right',
                      'hover:bg-muted/50 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      value === option.value && 'bg-primary/10 text-primary'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </span>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
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

// Multi Select Component
interface MultiSelectProps {
  label?: string;
  error?: string;
  options: Option[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  placeholder?: string;
  max?: number;
  className?: string;
}

export function MultiSelect({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = 'اختر...',
  max,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string | number) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else if (!max || value.length < max) {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-xl',
            'bg-card border border-border transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            isOpen && 'border-primary ring-2 ring-primary/20',
            error && 'border-error focus:border-error focus:ring-error/20'
          )}
        >
          <span className={cn(selectedOptions.length === 0 && 'text-muted-foreground')}>
            {selectedOptions.length > 0 ? (
              <span className="flex items-center gap-2 flex-wrap">
                {selectedOptions.slice(0, 3).map((opt) => (
                  <span
                    key={opt.value}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {opt.label}
                  </span>
                ))}
                {selectedOptions.length > 3 && (
                  <span className="text-muted-foreground text-xs">
                    +{selectedOptions.length - 3}
                  </span>
                )}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown
            className={cn(
              'w-5 h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute z-50 w-full mt-2 py-2 rounded-xl',
                'bg-card border border-border shadow-elevated',
                'max-h-60 overflow-auto'
              )}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 text-sm text-right',
                    'hover:bg-muted/50 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    value.includes(option.value) && 'bg-primary/10'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                        value.includes(option.value)
                          ? 'bg-primary border-primary'
                          : 'border-border'
                      )}
                    >
                      {value.includes(option.value) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </span>
                    {option.icon}
                    {option.label}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}

export default Select;

