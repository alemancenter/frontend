'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Server, 
  Clock, 
  Database,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { performanceService, PerformanceLive, CacheStats, AppMetricsSnapshot } from '@/lib/api/services/performance';
import { toast } from 'react-hot-toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

const PerformanceHistoryCharts = dynamic(() => import('@/components/dashboard/charts/PerformanceHistoryCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-[380px] rounded-xl bg-gray-100 animate-pulse" />
      <div className="h-[380px] rounded-xl bg-gray-100 animate-pulse" />
    </div>
  ),
});

export default function PerformancePage() {
  const { isAuthorized } = usePermissionGuard('manage performance');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceLive | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [appMetrics, setAppMetrics] = useState<AppMetricsSnapshot | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setRefreshing(true);
      
      const [liveData, cacheData, respTimeData, metricsData] = await Promise.all([
        performanceService.getLive(),
        performanceService.getCacheStats(),
        performanceService.getResponseTime(),
        performanceService.getMetrics()
      ]);

      setData(liveData);
      setCacheStats(cacheData);
      setResponseTime(respTimeData.average_ms);
      setAppMetrics(metricsData);
      
      // Update history
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setHistory(prev => {
        const newPoint = {
          time: timeStr,
          cpu: liveData.cpu?.usage || 0,
          memory: liveData.memory?.usage_percentage || 0
        };
        const newHistory = [...prev, newPoint];
        // Keep last 20 points
        if (newHistory.length > 20) return newHistory.slice(newHistory.length - 20);
        return newHistory;
      });

      setError(null);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      // Don't show toast on background updates to avoid spam
      if (!isBackground) {
        toast.error('Failed to update performance metrics');
        setError('Failed to load performance data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (isAuthorized === null) {
    return null;
  }

  if (isAuthorized === false) {
    return <AccessDenied />;
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">System Performance</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time server monitoring and metrics</p>
        </div>
        <button
          onClick={() => fetchData(false)}
          disabled={refreshing}
          className={`p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors ${refreshing ? 'opacity-50' : ''}`}
        >
          <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Cpu className="w-6 h-6 text-blue-600" />
            </div>
            <span className={`text-sm font-medium ${
              (data?.cpu?.usage || 0) > 80 ? 'text-red-600' : 'text-green-600'
            }`}>
              {data?.cpu?.cores || 1} Cores
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">CPU Usage</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {data?.cpu?.usage || 0}%
            </h3>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  (data?.cpu?.usage || 0) > 80 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${data?.cpu?.usage || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Memory Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">
              {data?.memory ? formatBytes(data.memory.total) : '0 GB'} Total
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Memory Usage</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {data?.memory?.usage_percentage || 0}%
            </h3>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  (data?.memory?.usage_percentage || 0) > 80 ? 'bg-red-500' : 'bg-purple-500'
                }`}
                style={{ width: `${data?.memory?.usage_percentage || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Free: {data?.memory ? formatBytes(data.memory.free) : '0 B'}
            </p>
          </div>
        </div>

        {/* Disk Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <HardDrive className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">
              {data?.disk ? formatBytes(data.disk.total) : '0 GB'} Total
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Disk Usage</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {data?.disk?.usage_percentage || 0}%
            </h3>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  (data?.disk?.usage_percentage || 0) > 80 ? 'bg-red-500' : 'bg-orange-500'
                }`}
                style={{ width: `${data?.disk?.usage_percentage || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Free: {data?.disk ? formatBytes(data.disk.free) : '0 B'}
            </p>
          </div>
        </div>

        {/* Response Time Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Avg Latency</span>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Response Time</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {responseTime} ms
            </h3>
             <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  responseTime > 500 ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((responseTime / 1000) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Internal benchmark
            </p>
          </div>
        </div>
      </div>

      <PerformanceHistoryCharts history={history} />

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cache Stats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-500" />
            Cache Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Hit Ratio</p>
                <p className="text-xl font-bold text-gray-900">{cacheStats?.hit_ratio || 0}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-gray-200">
                <span className="text-xs font-bold text-blue-600">{cacheStats?.hit_ratio || 0}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Cache Size</p>
                <p className="text-xl font-bold text-gray-900">{cacheStats?.cache_size || '0 B'}</p>
              </div>
              <Database className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-gray-500" />
            Server Information
          </h3>
          <div className="space-y-3">
             <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Backend</span>
              <span className="text-sm font-medium text-gray-900">Go / Fiber API</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Requests Total</span>
              <span className="text-sm font-medium text-gray-900">{appMetrics?.requests_total ?? 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">5xx Errors</span>
              <span className="text-sm font-medium text-gray-900">{appMetrics?.errors_total ?? 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">App Avg Latency</span>
              <span className="text-sm font-medium text-gray-900">{Math.round(appMetrics?.avg_latency_ms ?? 0)} ms</span>
            </div>
             <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Refresh Interval</span>
              <span className="text-sm font-medium text-gray-900">15 seconds</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-500">Server Time</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date().toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
