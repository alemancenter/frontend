'use client';

import { motion } from '@/lib/motion-lite';
import { ChevronUp, ChevronDown, Loader2, ChevronLeft, ChevronRight, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';
import { useState, isValidElement } from 'react';

interface Column<T> {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: T) => React.ReactNode;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: Pagination;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectRow?: (item: T) => void;
  onSelectAll?: (items: T[]) => void;
  variant?: 'default' | 'striped' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  stickyHeader?: boolean;
  rowActions?: (item: T) => React.ReactNode;
}

export default function DataTable<T extends Record<string, any>>({
  data = [],
  columns,
  loading = false,
  pagination,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  emptyMessage = 'لا توجد بيانات',
  emptyIcon,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  variant = 'default',
  size = 'md',
  stickyHeader = false,
  rowActions,
}: DataTableProps<T>) {
  const renderValue = (item: T, column: Column<T>) => {
    const value: unknown = column.key.split('.').reduce((obj: any, key) => obj?.[key], item as any);
    if (column.render) {
      return column.render(value as any, item);
    }
    if (value === null || value === undefined) return '-';
    if (isValidElement(value)) return value;
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Date) return value.toLocaleString();
    return String(value);
  };

  const isAllSelected = data.length > 0 && selectedRows.length === data.length;
  const isSomeSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  const sizeClasses = {
    sm: { cell: 'py-2 px-3 text-xs', header: 'py-2 px-3 text-xs' },
    md: { cell: 'py-3.5 px-4 text-sm', header: 'py-3 px-4 text-sm' },
    lg: { cell: 'py-4 px-5 text-base', header: 'py-4 px-5 text-sm' },
  };

  const variantClasses = {
    default: '',
    striped: '[&>tbody>tr:nth-child(even)]:bg-muted/30',
    bordered: '[&>tbody>tr]:border [&>thead>tr]:border',
  };

  const computedFrom =
    pagination && pagination.total > 0 ? (pagination.current_page - 1) * pagination.per_page + 1 : 0;
  const computedTo =
    pagination && pagination.total > 0
      ? Math.min(pagination.current_page * pagination.per_page, pagination.total)
      : 0;

  return (
    <div className="w-full">
      <div className={cn('overflow-x-auto rounded-xl border border-border bg-card', stickyHeader && 'max-h-[600px]')}>
        <table className={cn('w-full', variantClasses[variant])}>
          <thead className={cn('bg-muted/50', stickyHeader && 'sticky top-0 z-10')}>
            <tr className="border-b border-border">
              {selectable && (
                <th className={cn('w-12', sizeClasses[size].header)}>
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => onSelectAll?.(isAllSelected ? [] : data)}
                      className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200',
                        isAllSelected || isSomeSelected
                          ? 'bg-primary border-primary'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {isAllSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {isSomeSelected && (
                        <span className="w-2 h-0.5 bg-white rounded" />
                      )}
                    </button>
                  </div>
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width }}
                  className={cn(
                    sizeClasses[size].header,
                    'font-semibold text-muted-foreground',
                    column.align === 'center' && 'text-center',
                    column.align === 'left' && 'text-left',
                    column.align === 'right' || !column.align ? 'text-right' : '',
                    column.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors group'
                  )}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className={cn(
                    'flex items-center gap-2',
                    column.align === 'center' && 'justify-center',
                    column.align === 'left' && 'justify-start',
                    (column.align === 'right' || !column.align) && 'justify-start'
                  )}>
                    {column.title}
                    {column.sortable && (
                      <span className="flex flex-col">
                        {sortBy === column.key ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="w-4 h-4 text-primary" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {rowActions && (
                <th className={cn('w-16', sizeClasses[size].header, 'text-center')}>
                  <span className="sr-only">الإجراءات</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-primary/20" />
                      <Loader2 className="w-12 h-12 animate-spin text-primary absolute inset-0" />
                    </div>
                    <span className="text-muted-foreground font-medium">جاري التحميل...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    {emptyIcon || (
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                    )}
                    <span className="text-muted-foreground">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const isSelected = selectedRows.some((row) => row.id === item.id);
                return (
                  <motion.tr
                    key={item.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors',
                      'hover:bg-muted/30',
                      isSelected && 'bg-primary/5 hover:bg-primary/10'
                    )}
                  >
                    {selectable && (
                      <td className={cn('w-12', sizeClasses[size].cell)}>
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onSelectRow?.(item)}
                            className={cn(
                              'w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200',
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'border-border hover:border-primary/50'
                            )}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          sizeClasses[size].cell,
                          column.align === 'center' && 'text-center',
                          column.align === 'left' && 'text-left',
                          column.align === 'right' || !column.align ? 'text-right' : ''
                        )}
                      >
                        {renderValue(item, column)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className={cn('w-16', sizeClasses[size].cell, 'text-center')}>
                        {rowActions(item)}
                      </td>
                    )}
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-muted/30 rounded-xl border border-border">
          <p className="text-sm text-muted-foreground text-center sm:text-right">
            عرض <span className="font-medium text-foreground">{pagination.from ?? computedFrom}</span> إلى{' '}
            <span className="font-medium text-foreground">{pagination.to ?? computedTo}</span> من{' '}
            <span className="font-medium text-foreground">{pagination.total}</span> نتيجة
          </p>
          
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current_page === 1}
              onClick={() => onPageChange?.(pagination.current_page - 1)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-border hover:bg-accent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1">
              {generatePaginationNumbers(pagination.current_page, pagination.last_page).map((page, idx) => (
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => onPageChange?.(page as number)}
                    className={cn(
                      'flex items-center justify-center min-w-[40px] h-9 rounded-md text-sm font-medium transition-all duration-200',
                      pagination.current_page === page
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current_page === pagination.last_page}
              onClick={() => onPageChange?.(pagination.current_page + 1)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border-border hover:bg-accent transition-colors"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to generate pagination numbers
function generatePaginationNumbers(current: number, total: number): (number | string)[] {
  const pages: (number | string)[] = [];
  const delta = 2;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (current > delta + 2) {
      pages.push('...');
    }

    const start = Math.max(2, current - delta);
    const end = Math.min(total - 1, current + delta);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - delta - 1) {
      pages.push('...');
    }

    pages.push(total);
  }

  return pages;
}

// Table Actions Component
interface TableActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function TableActions({ children, className }: TableActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 p-0"
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'absolute left-0 top-full mt-1 z-50 min-w-[160px]',
              'bg-card border border-border rounded-xl shadow-elevated py-1',
              className
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </div>
  );
}

// Table Action Item Component
interface TableActionItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
}

export function TableActionItem({ children, onClick, variant = 'default', icon }: TableActionItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-4 py-2 text-sm text-right transition-colors',
        variant === 'default' && 'text-foreground hover:bg-muted/50',
        variant === 'danger' && 'text-error hover:bg-error/10'
      )}
    >
      {icon}
      {children}
    </button>
  );
}

