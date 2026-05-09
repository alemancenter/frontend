'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Zap } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import SafeResponsiveContainer from '@/components/charts/SafeResponsiveContainer';

type MonitorPerformanceChartProps = {
  perfHistory: Array<{
    time: string;
    cpu: number;
    memory: number;
  }>;
};

export default function MonitorPerformanceChart({ perfHistory }: MonitorPerformanceChartProps) {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardHeader className="border-b border-gray-50 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            أداء الخادم المباشر
          </CardTitle>
          <div className="flex gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-700 rounded-md">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> CPU
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Memory
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-[350px] w-full min-w-0" dir="ltr">
          <SafeResponsiveContainer width="100%" height="100%" minHeight={350}>
            <AreaChart data={perfHistory} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                orientation="right"
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#64748b', marginBottom: '0.5rem' }}
              />
              <Area
                type="monotone"
                dataKey="cpu"
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCpu)"
                name="CPU %"
                animationDuration={1000}
              />
              <Area
                type="monotone"
                dataKey="memory"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMem)"
                name="Memory %"
                animationDuration={1000}
              />
            </AreaChart>
          </SafeResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
