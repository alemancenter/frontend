'use client';

import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: LucideIcon;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  trend?: { value: number; label: string };
  subtitle?: string;
  variant?: 'default' | 'gradient' | 'outlined';
}

const colorConfig = {
  primary: {
    iconBg: 'bg-gradient-to-br from-primary to-primary-light',
    shadowColor: 'shadow-primary/20',
    textColor: 'text-primary',
    lightBg: 'bg-primary/10',
  },
  secondary: {
    iconBg: 'bg-gradient-to-br from-secondary to-secondary-light',
    shadowColor: 'shadow-secondary/20',
    textColor: 'text-secondary',
    lightBg: 'bg-secondary/10',
  },
  accent: {
    iconBg: 'bg-gradient-to-br from-accent to-accent-light',
    shadowColor: 'shadow-accent/20',
    textColor: 'text-accent',
    lightBg: 'bg-accent/10',
  },
  success: {
    iconBg: 'bg-gradient-to-br from-success to-success/70',
    shadowColor: 'shadow-success/20',
    textColor: 'text-success',
    lightBg: 'bg-success/10',
  },
  warning: {
    iconBg: 'bg-gradient-to-br from-warning to-warning/70',
    shadowColor: 'shadow-warning/20',
    textColor: 'text-warning',
    lightBg: 'bg-warning/10',
  },
  error: {
    iconBg: 'bg-gradient-to-br from-error to-error/70',
    shadowColor: 'shadow-error/20',
    textColor: 'text-error',
    lightBg: 'bg-error/10',
  },
};

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'increase',
  icon: Icon,
  color = 'primary',
  trend,
  subtitle,
  variant = 'default',
}: StatsCardProps) {
  const config = colorConfig[color];

  const variantClasses = {
    default: 'bg-card border border-border shadow-card',
    gradient: `bg-gradient-to-br from-card to-muted/30 border border-border/50 ${config.shadowColor}`,
    outlined: `bg-transparent border-2 border-border hover:border-${color}/30`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 transition-all duration-300',
        'hover:shadow-lg',
        variantClasses[variant]
      )}
    >
      {/* Background decoration */}
      <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-tl from-accent/5 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
              {subtitle && (
                <span className="text-sm text-muted-foreground">{subtitle}</span>
              )}
            </div>

            {(change !== undefined || trend) && (
              <div className="flex items-center gap-2 flex-wrap">
                {change !== undefined && (
                  <div
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
                      changeType === 'increase'
                        ? 'bg-success/10 text-success'
                        : 'bg-error/10 text-error'
                    )}
                  >
                    {changeType === 'increase' ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    <span>{Math.abs(change)}%</span>
                  </div>
                )}
                {trend && (
                  <span className="text-xs text-muted-foreground">{trend.label}</span>
                )}
                {!trend && change !== undefined && (
                  <span className="text-xs text-muted-foreground">من الشهر الماضي</span>
                )}
              </div>
            )}
          </div>

          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
              config.iconBg,
              config.shadowColor
            )}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Mini Stats Card - Compact version
interface MiniStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  change?: number;
}

export function MiniStatsCard({ title, value, icon: Icon, color = 'primary', change }: MiniStatsCardProps) {
  const config = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.lightBg)}>
          <Icon className={cn('w-5 h-5', config.textColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-bold">{value}</p>
            {change !== undefined && (
              <span
                className={cn(
                  'text-xs font-medium',
                  change >= 0 ? 'text-success' : 'text-error'
                )}
              >
                {change >= 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Stats Card with Chart Preview
interface StatsCardWithChartProps extends StatsCardProps {
  chartData?: number[];
}

export function StatsCardWithChart({
  title,
  value,
  change,
  changeType = 'increase',
  icon: Icon,
  color = 'primary',
  chartData = [],
}: StatsCardWithChartProps) {
  const config = colorConfig[color];
  const maxValue = Math.max(...chartData, 1);
  const normalizedData = chartData.map((v) => (v / maxValue) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-card border border-border rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold',
                  changeType === 'increase' ? 'text-success' : 'text-error'
                )}
              >
                {changeType === 'increase' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(change)}%
              </span>
            )}
          </div>
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.lightBg)}>
          <Icon className={cn('w-5 h-5', config.textColor)} />
        </div>
      </div>

      {/* Mini Chart */}
      {chartData.length > 0 && (
        <div className="flex items-end gap-1 h-12">
          {normalizedData.map((height, index) => (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={cn(
                'flex-1 rounded-t-sm min-h-[4px]',
                index === normalizedData.length - 1 ? config.iconBg : 'bg-muted'
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Progress Stats Card
interface ProgressStatsCardProps {
  title: string;
  value: number;
  max: number;
  icon: LucideIcon;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  suffix?: string;
}

export function ProgressStatsCard({
  title,
  value,
  max,
  icon: Icon,
  color = 'primary',
  suffix = '',
}: ProgressStatsCardProps) {
  const config = colorConfig[color];
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.lightBg)}>
            <Icon className={cn('w-5 h-5', config.textColor)} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-lg font-bold">
              {value}{suffix} <span className="text-sm font-normal text-muted-foreground">/ {max}{suffix}</span>
            </p>
          </div>
        </div>
        <span className={cn('text-2xl font-bold', config.textColor)}>{percentage.toFixed(0)}%</span>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', config.iconBg)}
        />
      </div>
    </motion.div>
  );
}
