'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  FileText,
  Eye,
  Users,
  Activity,
  Newspaper,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import ModernStatsCard from '@/components/dashboard/ModernStatsCard';
import { dashboardService } from '@/lib/api/services/dashboard';
import type { DashboardData, VisitorAnalyticsData } from '@/types';
import { useAuthStore } from '@/store/useStore';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

const ModernChart = dynamic(() => import('@/components/dashboard/ModernChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] rounded-xl bg-muted/40 animate-pulse" />,
});

export default function DashboardPage() {
  const { isAuthorized } = usePermissionGuard('dashboard.view');
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<VisitorAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if authorized (or null which means loading auth)
    if (!isAuthorized) return;

    const fetchData = async () => {
      try {
        // 1) بيانات لوحة التحكم الأساسية متاحة لكل من يملك صلاحية dashboard.view
        const dashboard = await dashboardService.getIndex();
        setDashboardData(dashboard);
        
        // 2) بيانات تحليلات الزوار (visitor-analytics) للمستخدمين المخوّلين فقط
        let canViewVisitorAnalytics = false;

        if (user) {
          const adminRoles = ['admin', 'super_admin', 'super-admin', 'manager', 'administrator', 'root'];

          const hasAdminRole = user.roles?.some((r: any) => {
            const roleName = typeof r === 'string' ? r : r.name;
            return adminRoles.includes((roleName || '').toLowerCase());
          }) ?? false;

          const isSuperAdminById = user.id === 1;

          if (hasAdminRole || isSuperAdminById) {
            canViewVisitorAnalytics = true;
          } else {
            canViewVisitorAnalytics = user.permissions?.some((p: any) => {
              const permName = typeof p === 'string' ? p : p.name;
              return permName === 'manage monitoring';
            }) ?? false;
          }
        }

        if (canViewVisitorAnalytics) {
          const analytics = await dashboardService.getAnalytics(7);
          setAnalyticsData(analytics);
        } else {
          setAnalyticsData(null);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthorized, user]);

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    // If user has any permissions, show a welcome message instead of AccessDenied
    // This allows users with specific permissions (e.g. manage posts) to access the dashboard layout
    // even if they don't have full dashboard.view access
    const hasAnyPermission = user?.permissions && user.permissions.length > 0;
    
    if (hasAnyPermission) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="bg-card rounded-xl shadow-sm border p-8 max-w-2xl w-full">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-4">مرحباً بك، {user?.name}</h1>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              مرحباً بك في لوحة التحكم. لديك صلاحيات محدودة للوصول إلى أقسام معينة.
              <br />
              يرجى استخدام القائمة الجانبية للتنقل بين الصفحات المصرح لك بها.
            </p>
          </div>
        </div>
      );
    }

    return <AccessDenied />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Transform API data for stats cards
  const stats = [
    {
      title: 'إجمالي المقالات',
      value: (dashboardData?.totals?.articles ?? 0).toLocaleString(),
      change: dashboardData?.trends?.articles?.percentage || 0,
      changeType: (dashboardData?.trends?.articles?.trend === 'up' ? 'increase' : 'decrease') as 'increase' | 'decrease',
      icon: <FileText className="w-6 h-6" />,
      color: 'text-blue-500',
      trendData: dashboardData?.analytics?.articles || []
    },
    {
      title: 'المشاهدات',
      value: (dashboardData?.totals?.online_users ?? 0).toLocaleString(),
      change: 0,
      changeType: 'increase' as const,
      icon: <Eye className="w-6 h-6" />,
      color: 'text-emerald-500',
      trendData: dashboardData?.analytics?.views || []
    },
    {
      title: 'الأخبار',
      value: (dashboardData?.totals?.news ?? 0).toLocaleString(),
      change: dashboardData?.trends?.news?.percentage || 0,
      changeType: (dashboardData?.trends?.news?.trend === 'up' ? 'increase' : 'decrease') as 'increase' | 'decrease',
      icon: <Newspaper className="w-6 h-6" />,
      color: 'text-violet-500',
      trendData: dashboardData?.analytics?.news || []
    },
    {
      title: 'المستخدمين',
      value: (dashboardData?.totals?.users ?? 0).toLocaleString(),
      change: dashboardData?.trends?.users?.percentage || 0,
      changeType: (dashboardData?.trends?.users?.trend === 'up' ? 'increase' : 'decrease') as 'increase' | 'decrease',
      icon: <Users className="w-6 h-6" />,
      color: 'text-orange-500',
      trendData: dashboardData?.analytics?.authors || []
    },
  ];

  // Transform analytics data for chart
  const chartData = analyticsData?.chart_data?.map(item => ({
    name: item.name, // Day name
    views: item.pageViews,
    visitors: item.visitors
  })) || [];

  return (
    <>
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">مرحباً {user?.name || 'بك'}، إليك ملخص لأداء مشروعك اليوم.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            عرض الموقع
          </Link>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 font-medium">
            تنزيل تقرير
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat, index) => (
          <ModernStatsCard
            key={index}
            {...stat}
          />
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 glass-card rounded-2xl p-6 min-h-[400px]">
          <ModernChart 
            title="إحصائيات المشاهدات والزوار"
            data={chartData}
            dataKeys={[
              { key: 'views', color: '#10b981', name: 'المشاهدات' },
              { key: 'visitors', color: '#3b82f6', name: 'الزوار' }
            ]}
            height={300}
          />
        </div>
        
        <div className="col-span-3 glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            النشاطات الأخيرة
          </h2>
          <div className="space-y-4">
            {dashboardData?.recentActivities?.map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-secondary/50 rounded-xl transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    activity.type === 'article' ? 'bg-blue-500/10 text-blue-500' :
                    activity.type === 'news' ? 'bg-violet-500/10 text-violet-500' :
                    'bg-orange-500/10 text-orange-500'
                  }`}>
                    {activity.type === 'article' && <FileText size={18} />}
                    {activity.type === 'news' && <Newspaper size={18} />}
                    {activity.type === 'comment' && <MessageSquare size={18} />}
                  </div>
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{activity.title || activity.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user?.name || activity.author?.name || 'مستخدم'} • {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ar })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {(!dashboardData?.recentActivities || dashboardData.recentActivities.length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                لا توجد نشاطات حديثة
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
