'use client';

import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { ReactNode } from 'react';

interface ModernStatsCardProps {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: ReactNode;
  color: string;
  trendData?: number[];
  isLoading?: boolean;
}

export default function ModernStatsCard({
  title,
  value,
  change,
  changeType,
  icon,
  color,
  trendData,
  isLoading = false,
}: ModernStatsCardProps) {
  const normalizedTrend = Array.isArray(trendData) && trendData.length > 0
    ? (() => {
        const max = Math.max(...trendData);
        const min = Math.min(...trendData);
        const range = max - min || 1;
        return trendData.map((point) => {
          const scaled = ((point - min) / range) * 85 + 15;
          return Math.max(8, Math.min(100, scaled));
        });
      })()
    : null;

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-sm animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
          <div className="w-12 h-12 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 group cursor-pointer hover:shadow-lg"
      whileHover={{ y: -5 }}
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl bg-background/50 backdrop-blur-md border border-border/60 shadow-inner ${color}`}>
            {icon}
          </div>
          {changeType === 'increase' ? (
            <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg text-xs font-medium">
              <ArrowUp size={14} />
              <span>+{change}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg text-xs font-medium">
              <ArrowDown size={14} />
              <span>-{change}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{value}</h2>
        </div>

        {/* Mini Sparkline Chart Decoration */}
        {normalizedTrend && (
          <div className="absolute bottom-0 right-0 w-full h-16 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <div className="flex items-end justify-between h-full gap-1 px-4 pb-4">
              {normalizedTrend.map((h, i) => (
                <div 
                  key={i} 
                  className={`w-full rounded-t-sm ${color.replace('text-', 'bg-')}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Background Gradient Decoration */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-5 blur-3xl transition-all group-hover:opacity-10 ${color.replace('text-', 'bg-')}`} />
    </motion.div>
  );
}
