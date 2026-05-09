'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import SafeResponsiveContainer from '@/components/charts/SafeResponsiveContainer';

interface ModernChartProps {
  title: string;
  data: any[];
  type?: 'area' | 'bar';
  dataKeys: { key: string; color: string; name: string }[];
  height?: number;
  showToolbar?: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function ModernChart({
  title,
  data,
  type = 'area',
  dataKeys,
  height = 300,
  showToolbar = true,
}: ModernChartProps) {
  const [activeChart, setActiveChart] = useState<'area' | 'bar'>(type);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="chart-container-modern"
    >
      {/* Header */}
      <div className="chart-header-modern">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">آخر تحديث: الآن</p>
        </div>

        {showToolbar && (
          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setActiveChart('area')}
                className={`p-2 rounded-md transition-colors ${
                  activeChart === 'area'
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveChart('bar')}
                className={`p-2 rounded-md transition-colors ${
                  activeChart === 'bar'
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>

            {/* Time Range */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="week">أسبوع</option>
              <option value="month">شهر</option>
              <option value="year">سنة</option>
            </select>

            {/* Export Button */}
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height, width: '100%', minWidth: 0 }}>
        <SafeResponsiveContainer width="100%" height="100%" minHeight={height}>
          {activeChart === 'area' ? (
            <AreaChart data={data}>
              <defs>
                {dataKeys.map(({ key, color }) => (
                  <linearGradient key={key} id={key} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {dataKeys.map(({ key, color, name }) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  fill={`url(#${key})`}
                  name={name}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {dataKeys.map(({ key, color, name }) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={color}
                  name={name}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </SafeResponsiveContainer>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t border-border/20">
        <div className="grid grid-cols-3 gap-4 text-center">
          {dataKeys.map(({ key, color, name }) => {
            const total = data.reduce((sum, item) => sum + (item[key] || 0), 0);
            const avg = total / data.length;
            
            return (
              <div key={key}>
                <p className="text-sm text-muted-foreground">{name}</p>
                <p className="text-lg font-semibold" style={{ color }}>
                  {Math.round(avg).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">متوسط</p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
