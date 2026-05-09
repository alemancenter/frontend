'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  Globe,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Activity,
  Monitor,
  Smartphone,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  UserCheck,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { dashboardService } from '@/lib/api/services';
import { VisitorAnalyticsData } from '@/types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

const AnalyticsCharts = dynamic(() => import('@/components/dashboard/charts/AnalyticsCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-80 rounded-xl bg-muted/40 animate-pulse" />
      <div className="h-80 rounded-xl bg-muted/40 animate-pulse" />
    </div>
  ),
});

// Auto-refresh interval in milliseconds
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export default function AnalyticsPage() {
  const { isAuthorized } = usePermissionGuard('manage analytics');
  const [data, setData] = useState<VisitorAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active visitors pagination and filtering
  const [visitorsPage, setVisitorsPage] = useState(1);
  const [visitorsSearch, setVisitorsSearch] = useState('');
  const [visitorsFilter, setVisitorsFilter] = useState<'all' | 'members' | 'guests' | 'bots'>('all');
  const VISITORS_PER_PAGE = 25;

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (!isAuthorized) return;

    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else if (!data) {
        setLoading(true);
      }
      setError(null);

      const res = await dashboardService.getAnalytics(selectedPeriod);
      setData(res);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('فشل في جلب البيانات. جاري إعادة المحاولة...');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthorized, selectedPeriod, data]);

  // Initial fetch
  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, selectedPeriod]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !isAuthorized) return;

    const interval = setInterval(() => {
      fetchData(false);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, isAuthorized, fetchData]);

  // Permission check after all hooks
  if (isAuthorized === false) {
    return <AccessDenied />;
  }

  if (isAuthorized === null || (loading && !data)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">جاري تحميل التحليلات...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-error">فشل في تحميل البيانات</p>
        <button
          onClick={() => fetchData(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // Process Country Data
  const totalVisitorsForCountries = data.country_stats.reduce((acc, curr) => acc + curr.count, 0);
  const countryData = data.country_stats.map(c => ({
    country: c.country,
    visitors: c.count,
    percentage: totalVisitorsForCountries > 0 ? Math.round((c.count / totalVisitorsForCountries) * 100) : 0
  }));

  // Process Stats
  const stats = [
    {
      title: 'الزوار اليوم',
      value: data.visitor_stats.total_today.toLocaleString('ar-EG'),
      change: data.visitor_stats.change,
      changeType: data.visitor_stats.change >= 0 ? 'increase' : 'decrease',
      icon: Users,
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'الزوار النشطون الآن',
      value: data.visitor_stats.current.toLocaleString('ar-EG'),
      subtitle: `${data.visitor_stats.current_members || 0} عضو + ${data.visitor_stats.current_guests || 0} زائر`,
      change: null,
      changeType: 'live',
      icon: Activity,
      color: 'bg-emerald-500',
      gradient: 'from-emerald-500 to-emerald-600',
      isLive: true,
    },
    {
      title: 'إجمالي الأعضاء',
      value: data.user_stats.total.toLocaleString('ar-EG'),
      change: data.user_stats.new_today,
      changeLabel: 'جديد اليوم',
      changeType: 'increase',
      icon: Users,
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'الأعضاء النشطون',
      value: data.user_stats.active.toLocaleString('ar-EG'),
      change: null,
      changeType: 'neutral',
      icon: Clock,
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-primary" />
            التحليلات
          </h1>
          <p className="text-muted-foreground">تتبع أداء موقعك وتحليل سلوك الزوار في الوقت الفعلي</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Last Updated */}
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              آخر تحديث: {lastUpdated.toLocaleTimeString('ar-EG')}
            </span>
          )}

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
              autoRefresh
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Activity className={cn('w-4 h-4', autoRefresh && 'animate-pulse')} />
            <span className="hidden sm:inline">{autoRefresh ? 'مباشر' : 'متوقف'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            <span className="hidden sm:inline">تحديث</span>
          </button>

          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value={7}>آخر 7 أيام</option>
            <option value={14}>آخر 14 يوم</option>
            <option value={30}>آخر 30 يوم</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                    )}
                    {stat.change !== null && (
                      <div className={cn(
                        'flex items-center gap-1 text-sm',
                        stat.changeType === 'increase' ? 'text-success' :
                        stat.changeType === 'decrease' ? 'text-error' : 'text-muted-foreground'
                      )}>
                        {stat.changeType === 'increase' ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : stat.changeType === 'decrease' ? (
                          <ArrowDown className="w-4 h-4" />
                        ) : null}
                        <span>
                          {stat.changeLabel
                            ? `+${Math.abs(stat.change)} ${stat.changeLabel}`
                            : `${Math.abs(stat.change)}%`}
                        </span>
                      </div>
                    )}
                    {stat.isLive && (
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">مباشر</span>
                      </div>
                    )}
                  </div>
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br', stat.gradient)}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
              {/* Background decoration */}
              <div className={cn('absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-10', stat.color)} />
            </Card>
          </motion.div>
        ))}
      </div>

      <AnalyticsCharts data={data} selectedPeriod={selectedPeriod} />

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              مصادر الزيارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.traffic_sources.length > 0 ? (
              <div className="space-y-4">
                {data.traffic_sources.map((source, index) => {
                  const maxVisits = Math.max(...data.traffic_sources.map(s => s.visits));
                  const percentage = maxVisits > 0 ? (source.visits / maxVisits) * 100 : 0;

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-medium">{source.source}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground font-medium">
                            {source.visits.toLocaleString('ar-EG')}
                          </span>
                          {source.change !== 0 && (
                            <span className={cn(
                              'flex items-center gap-1 text-sm',
                              source.change > 0 ? 'text-success' : 'text-error'
                            )}>
                              {source.change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                              {Math.abs(source.change)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Globe className="w-12 h-12 mb-2 opacity-50" />
                <p>لا توجد بيانات كافية</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              أعلى الدول
            </CardTitle>
          </CardHeader>
          <CardContent>
            {countryData.length > 0 ? (
              <div className="space-y-4">
                {countryData.slice(0, 6).map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                        <span className="font-medium">{item.country}</span>
                      </div>
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{item.visitors.toLocaleString('ar-EG')}</span>
                        {' '}({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Globe className="w-12 h-12 mb-2 opacity-50" />
                <p>لا توجد بيانات كافية</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Visitors Section */}
      {data.visitor_stats.active_visitors && data.visitor_stats.active_visitors.length > 0 && (() => {
        // Helper function to check if visitor is a bot
        const isBot = (visitor: typeof data.visitor_stats.active_visitors[0]) =>
          visitor.os?.toLowerCase().includes('bot') || visitor.browser?.toLowerCase() === 'bot';

        // Helper function to check if visitor is a guest (not member and not bot)
        const isGuest = (visitor: typeof data.visitor_stats.active_visitors[0]) =>
          !visitor.is_member && !isBot(visitor);

        // Count members, bots, and guests
        const membersCount = data.visitor_stats.active_visitors.filter(v => v.is_member).length;
        const botsCount = data.visitor_stats.active_visitors.filter(v => isBot(v)).length;
        const guestsCount = data.visitor_stats.active_visitors.filter(v => isGuest(v)).length;

        // Filter visitors based on type filter AND search
        const filteredVisitors = data.visitor_stats.active_visitors.filter(visitor => {
          // First apply type filter
          let passesTypeFilter = true;
          switch (visitorsFilter) {
            case 'members':
              passesTypeFilter = visitor.is_member === true;
              break;
            case 'guests':
              passesTypeFilter = isGuest(visitor);
              break;
            case 'bots':
              passesTypeFilter = isBot(visitor);
              break;
            case 'all':
            default:
              passesTypeFilter = true;
          }

          if (!passesTypeFilter) return false;

          // Then apply search filter
          if (!visitorsSearch) return true;
          const searchLower = visitorsSearch.toLowerCase();
          return (
            visitor.country?.toLowerCase().includes(searchLower) ||
            visitor.city?.toLowerCase().includes(searchLower) ||
            visitor.browser?.toLowerCase().includes(searchLower) ||
            visitor.os?.toLowerCase().includes(searchLower) ||
            visitor.current_page?.toLowerCase().includes(searchLower) ||
            visitor.user_name?.toLowerCase().includes(searchLower)
          );
        });

        // Pagination calculations
        const totalVisitors = filteredVisitors.length;
        const totalPages = Math.ceil(totalVisitors / VISITORS_PER_PAGE);
        const startIndex = (visitorsPage - 1) * VISITORS_PER_PAGE;
        const endIndex = startIndex + VISITORS_PER_PAGE;
        const currentVisitors = filteredVisitors.slice(startIndex, endIndex);

        // Handle filter click
        const handleFilterClick = (filter: 'all' | 'members' | 'guests' | 'bots') => {
          setVisitorsFilter(filter);
          setVisitorsPage(1); // Reset to first page when filter changes
        };

        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  الزوار النشطون الآن
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </CardTitle>

                {/* Stats badges - Clickable for filtering */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => handleFilterClick('all')}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all cursor-pointer",
                      visitorsFilter === 'all'
                        ? "bg-emerald-500 dark:bg-emerald-600 ring-2 ring-emerald-300 dark:ring-emerald-400"
                        : "bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                    )}
                  >
                    <Users className={cn(
                      "w-4 h-4",
                      visitorsFilter === 'all' ? "text-white" : "text-emerald-600 dark:text-emerald-400"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      visitorsFilter === 'all' ? "text-white" : "text-emerald-700 dark:text-emerald-300"
                    )}>
                      {data.visitor_stats.active_visitors.length.toLocaleString('ar-EG')} إجمالي
                    </span>
                  </button>

                  <button
                    onClick={() => handleFilterClick('members')}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all cursor-pointer",
                      visitorsFilter === 'members'
                        ? "bg-blue-500 dark:bg-blue-600 ring-2 ring-blue-300 dark:ring-blue-400"
                        : "bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    )}
                  >
                    <UserCheck className={cn(
                      "w-4 h-4",
                      visitorsFilter === 'members' ? "text-white" : "text-blue-600 dark:text-blue-400"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      visitorsFilter === 'members' ? "text-white" : "text-blue-700 dark:text-blue-300"
                    )}>
                      {membersCount.toLocaleString('ar-EG')} عضو
                    </span>
                  </button>

                  <button
                    onClick={() => handleFilterClick('guests')}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all cursor-pointer",
                      visitorsFilter === 'guests'
                        ? "bg-gray-500 dark:bg-gray-600 ring-2 ring-gray-300 dark:ring-gray-400"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    <User className={cn(
                      "w-4 h-4",
                      visitorsFilter === 'guests' ? "text-white" : "text-gray-600 dark:text-gray-400"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      visitorsFilter === 'guests' ? "text-white" : "text-gray-700 dark:text-gray-300"
                    )}>
                      {guestsCount.toLocaleString('ar-EG')} زائر
                    </span>
                  </button>

                  {botsCount > 0 && (
                    <button
                      onClick={() => handleFilterClick('bots')}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all cursor-pointer",
                        visitorsFilter === 'bots'
                          ? "bg-orange-500 dark:bg-orange-600 ring-2 ring-orange-300 dark:ring-orange-400"
                          : "bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50"
                      )}
                    >
                      <Activity className={cn(
                        "w-4 h-4",
                        visitorsFilter === 'bots' ? "text-white" : "text-orange-600 dark:text-orange-400"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        visitorsFilter === 'bots' ? "text-white" : "text-orange-700 dark:text-orange-300"
                      )}>
                        {botsCount.toLocaleString('ar-EG')} بوت
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Search bar */}
              <div className="mt-4 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="بحث بالدولة، المدينة، المتصفح، الصفحة، أو اسم العضو..."
                  value={visitorsSearch}
                  onChange={(e) => {
                    setVisitorsSearch(e.target.value);
                    setVisitorsPage(1); // Reset to first page on search
                  }}
                  className="w-full pr-10 pl-4 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground">المستخدم</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground">الموقع</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground">الصفحة الحالية</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground hidden md:table-cell">المتصفح</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground hidden lg:table-cell">النظام</th>
                      <th className="text-right py-3 px-3 font-medium text-muted-foreground">آخر نشاط</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentVisitors.map((visitor, index) => (
                      <tr
                        key={index}
                        className={cn(
                          "border-b border-border/50 hover:bg-muted/50 transition-colors",
                          visitor.is_member && "bg-blue-50/50 dark:bg-blue-900/10"
                        )}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {visitor.is_member ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <UserCheck className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className={cn(
                                "font-medium",
                                visitor.is_member ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                              )}>
                                {visitor.is_member ? visitor.user_name : 'زائر'}
                              </span>
                              {visitor.is_member && visitor.user_role && (
                                <span className="text-xs text-muted-foreground">{visitor.user_role}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[150px]" title={`${visitor.country}, ${visitor.city}`}>
                              {visitor.country}
                              {visitor.city && visitor.city !== 'Unknown' && `, ${visitor.city}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className="text-primary truncate block max-w-[200px]"
                            title={visitor.current_page_full}
                          >
                            {visitor.current_page}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground hidden md:table-cell">
                          <span
                            title={visitor.browser === 'Unknown' ? visitor.user_agent : undefined}
                            className={cn(
                              visitor.browser === 'Unknown' && 'cursor-help border-b border-dashed border-muted-foreground'
                            )}
                          >
                            {visitor.browser || 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground hidden lg:table-cell">
                          <div
                            className="flex items-center gap-1.5"
                            title={visitor.os === 'Unknown' ? visitor.user_agent : undefined}
                          >
                            {visitor.os?.toLowerCase().includes('windows') && <Monitor className="w-3.5 h-3.5" />}
                            {visitor.os?.toLowerCase().includes('mac') && <Monitor className="w-3.5 h-3.5" />}
                            {visitor.os?.toLowerCase().includes('android') && <Smartphone className="w-3.5 h-3.5" />}
                            {visitor.os?.toLowerCase().includes('ios') && <Smartphone className="w-3.5 h-3.5" />}
                            {visitor.os?.toLowerCase().includes('linux') && <Monitor className="w-3.5 h-3.5" />}
                            {visitor.os?.toLowerCase().includes('bot') && <Activity className="w-3.5 h-3.5 text-orange-500" />}
                            {visitor.os?.toLowerCase().includes('server') && <Monitor className="w-3.5 h-3.5 text-purple-500" />}
                            <span className={cn(
                              visitor.os === 'Unknown' && 'cursor-help border-b border-dashed border-muted-foreground'
                            )}>
                              {visitor.os || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-muted-foreground text-xs">
                            {new Date(visitor.last_active).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Empty state */}
                {currentVisitors.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Search className="w-12 h-12 mb-3 opacity-50" />
                    <p>لا توجد نتائج مطابقة للبحث</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    عرض {startIndex + 1} - {Math.min(endIndex, totalVisitors)} من {totalVisitors.toLocaleString('ar-EG')} زائر
                  </div>

                  <div className="flex items-center gap-1">
                    {/* First page */}
                    <button
                      onClick={() => setVisitorsPage(1)}
                      disabled={visitorsPage === 1}
                      className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="الصفحة الأولى"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>

                    {/* Previous page */}
                    <button
                      onClick={() => setVisitorsPage(p => Math.max(1, p - 1))}
                      disabled={visitorsPage === 1}
                      className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="الصفحة السابقة"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (visitorsPage <= 3) {
                          pageNum = i + 1;
                        } else if (visitorsPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = visitorsPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setVisitorsPage(pageNum)}
                            className={cn(
                              "min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors",
                              visitorsPage === pageNum
                                ? "bg-primary text-white"
                                : "hover:bg-muted"
                            )}
                          >
                            {pageNum.toLocaleString('ar-EG')}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next page */}
                    <button
                      onClick={() => setVisitorsPage(p => Math.min(totalPages, p + 1))}
                      disabled={visitorsPage === totalPages}
                      className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="الصفحة التالية"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Last page */}
                    <button
                      onClick={() => setVisitorsPage(totalPages)}
                      disabled={visitorsPage === totalPages}
                      className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="الصفحة الأخيرة"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Page jump */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">انتقل للصفحة:</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={visitorsPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          setVisitorsPage(page);
                        }
                      }}
                      className="w-16 px-2 py-1.5 bg-muted/50 border border-border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <span className="text-muted-foreground">من {totalPages.toLocaleString('ar-EG')}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
