'use client';

import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ReactNode } from 'react';
import { Eye, Monitor, Smartphone, Tablet } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import SafeResponsiveContainer from '@/components/charts/SafeResponsiveContainer';
import type { VisitorAnalyticsData } from '@/types';

type AnalyticsChartsProps = {
  data: VisitorAnalyticsData;
  selectedPeriod: number;
};

const deviceIcons: Record<string, ReactNode> = {
  'الكمبيوتر': <Monitor className="w-4 h-4" />,
  'الهاتف': <Smartphone className="w-4 h-4" />,
  'التابلت': <Tablet className="w-4 h-4" />,
};

export default function AnalyticsCharts({ data, selectedPeriod }: AnalyticsChartsProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            الزوار ومشاهدات الصفحة (آخر {selectedPeriod} يوم)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <SafeResponsiveContainer width="100%" height="100%" minHeight={320}>
              <AreaChart data={data.chart_data}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    direction: 'rtl',
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name="الزوار"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorVisitors)"
                />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  name="المشاهدات"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#colorPageViews)"
                />
              </AreaChart>
            </SafeResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            توزيع الأجهزة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.device_stats.length > 0 ? (
            <>
              <div className="h-56 w-full min-w-0">
                <SafeResponsiveContainer width="100%" height="100%" minHeight={224}>
                  <PieChart>
                    <Pie
                      data={data.device_stats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {data.device_stats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'النسبة']}
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </SafeResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {data.device_stats.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="flex items-center gap-1.5 text-sm">
                        {deviceIcons[item.name]}
                        {item.name}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{item.value}%</span>
                      <span className="text-muted-foreground mr-1">({item.count.toLocaleString('ar-EG')})</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Monitor className="w-12 h-12 mb-2 opacity-50" />
              <p>لا توجد بيانات كافية</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
