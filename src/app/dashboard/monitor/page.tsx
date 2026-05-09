'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Users,
  Shield,
  Globe,
  Cpu,
  HardDrive,
  Clock,
  User,
  Monitor,
  LayoutDashboard,
  List,
  Search,
  Filter,
  Eye,
  Copy,
  ExternalLink,
  X,
  Laptop,
  Trash2,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/Modal';
import { monitorService, SystemMetrics, VisitorStats, SecurityLog } from '@/lib/api/services/monitor';
import { securityService } from '@/lib/api/services';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

const MonitorPerformanceChart = dynamic(() => import('@/components/dashboard/charts/MonitorPerformanceChart'), {
  ssr: false,
  loading: () => <div className="h-[430px] rounded-xl bg-muted/40 animate-pulse" />,
});

// Types for Tabs
type TabId = 'overview' | 'traffic' | 'security';

export default function MonitorPage() {
  const { isAuthorized } = usePermissionGuard('manage monitoring');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [performance, setPerformance] = useState<SystemMetrics | null>(null);
  const [visitors, setVisitors] = useState<VisitorStats | null>(null);
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<SecurityLog[]>([]);
  const [perfHistory, setPerfHistory] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SecurityLog | null>(null);
  const [selectedLogIds, setSelectedLogIds] = useState<number[]>([]);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    mode: 'single' | 'bulk' | 'all';
    ids: number[];
  }>({ open: false, mode: 'single', ids: [] });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [visitorPerPage, setVisitorPerPage] = useState<'20' | '50' | '100' | 'all'>('20');
  const [includeBots, setIncludeBots] = useState(false);
  const [pruneLoading, setPruneLoading] = useState(false);
  const lastLogIdRef = useRef<number>(0);

  const notifyNewAlert = (alert: SecurityLog) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        } transform transition-all duration-300 ease-in-out max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer hover:bg-gray-50`}
        onClick={() => {
            setSelectedAlert(alert);
            toast.dismiss(t.id);
            setActiveTab('security');
        }}
        dir="rtl"
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5 ml-3">
               <Shield className={`h-10 w-10 rounded-full p-2 ${
                   ['critical', 'danger'].includes(alert.severity) ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
               }`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">
                تنبيه أمني جديد
              </p>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {alert.event_type}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-r border-gray-200">
          <button
            onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
            }}
            className="w-full border border-transparent rounded-none rounded-l-lg p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      const perPage = visitorPerPage === 'all' ? 'all' : Number(visitorPerPage);
      const withHistory = visitorPerPage !== 'all';
      const [perfData, visitorData, secOverview] = await Promise.all([
        monitorService.getPerformance(),
        monitorService.getVisitors({ perPage, includeBots, withHistory }),
        monitorService.getSecurityOverview()
      ]);

      setPerformance(perfData);
      setVisitors({
        ...visitorData?.visitor_stats,
        country_stats: visitorData?.country_stats || []
      });
      setSecurityStats(secOverview?.stats);
      setRecentLogs(secOverview?.recent_events || []);

      // Check for new alerts
      const latestLog = secOverview?.recent_events?.[0];
      if (latestLog && latestLog.id > lastLogIdRef.current) {
         if (lastLogIdRef.current > 0) {
            // Only notify for warning/danger/critical
            if (['critical', 'danger', 'warning'].includes(latestLog.severity)) {
               notifyNewAlert(latestLog);
            }
         }
         lastLogIdRef.current = latestLog.id;
      } else if (latestLog && lastLogIdRef.current === 0) {
         // Initialize on first load
         lastLogIdRef.current = latestLog.id;
      }

      setPerfHistory(prev => {
        const newItem = {
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: perfData.cpu.usage,
          memory: perfData.memory.percentage
        };
        const newHistory = [...prev, newItem];
        if (newHistory.length > 20) newHistory.shift();
        return newHistory;
      });

    } catch (error) {
      console.error('Error fetching monitor data:', error);
    } finally {
      setLoading(false);
    }
  }, [includeBots, visitorPerPage]);

  useEffect(() => {
    if (!isAuthorized) return;
    
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData, isAuthorized]);

  useEffect(() => {
    const logIds = new Set(recentLogs.map((log) => log.id));
    setSelectedLogIds((prev) => {
      if (!prev.length) return prev;
      return prev.filter((id) => logIds.has(id));
    });
  }, [recentLogs]);

  const toggleLogSelection = (id: number) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAllLogs = (ids: number[], checked: boolean) => {
    setSelectedLogIds(checked ? ids : []);
  };

  const openDeleteModal = (mode: 'single' | 'bulk' | 'all', ids: number[] = []) => {
    setDeleteModal({ open: true, mode, ids });
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      if (deleteModal.mode === 'all') {
        await securityService.deleteAllLogs();
      } else {
        for (const id of deleteModal.ids) {
          await securityService.deleteLog(id);
        }
      }

      setDeleteModal({ open: false, mode: 'single', ids: [] });
      setSelectedLogIds([]);
      await fetchData();
      toast.success('تم حذف السجلات بنجاح');
    } catch (error) {
      console.error('Failed to delete security logs:', error);
      toast.error('تعذر حذف السجلات');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePruneSessions = useCallback(async () => {
    setPruneLoading(true);
    try {
      const result = await monitorService.pruneVisitors();
      const deleted = typeof result?.deleted === 'number' ? result.deleted : 0;
      toast.success(`تم تنظيف ${deleted} جلسة قديمة`);
      await fetchData();
    } catch (error) {
      console.error('Failed to prune visitor sessions:', error);
      toast.error('تعذر تنظيف الجلسات');
    } finally {
      setPruneLoading(false);
    }
  }, [fetchData]);

  const deleteTitle =
    deleteModal.mode === 'all'
      ? 'حذف جميع السجلات؟'
      : deleteModal.ids.length > 1
        ? 'حذف السجلات المحددة؟'
        : 'حذف السجل؟';

  const deleteMessage =
    deleteModal.mode === 'all'
      ? 'سيتم حذف جميع سجلات الأمان نهائيا ولا يمكن التراجع عن هذا الإجراء.'
      : `سيتم حذف ${deleteModal.ids.length || 1} من سجلات الأمان نهائيا ولا يمكن التراجع عن هذا الإجراء.`;

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
    return <AccessDenied />;
  }

  if (loading && !performance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium">جاري تحميل لوحة المراقبة...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'traffic', label: 'حركة الزوار', icon: Globe },
    { id: 'security', label: 'سجل الأمان', icon: Shield },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50/50" dir="rtl">
      
      {/* Top Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">نظام المراقبة المركزية</h1>
            <p className="text-sm text-gray-500">لوحة تحكم شاملة لمراقبة الأداء والأمان</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-left mx-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">آخر تحديث</div>
            <div className="text-sm font-mono text-gray-700 font-medium">{new Date().toLocaleTimeString('en-US')}</div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100 text-green-700">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-bold">النظام يعمل</span>
          </div>
        </div>
      </div>

      {/* Custom Tabs Navigation */}
      <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-blue-50 rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon size={18} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab 
              performance={performance} 
              visitors={visitors} 
              securityStats={securityStats} 
              perfHistory={perfHistory} 
            />
          )}
          {activeTab === 'traffic' && (
            <TrafficTab
              visitors={visitors}
              visitorPerPage={visitorPerPage}
              includeBots={includeBots}
              onChangePerPage={setVisitorPerPage}
              onToggleIncludeBots={setIncludeBots}
              onPrune={handlePruneSessions}
              isPruning={pruneLoading}
            />
          )}
          {activeTab === 'security' && (
            <SecurityTab 
              logs={recentLogs} 
              stats={securityStats} 
              onViewLog={setSelectedAlert}
              selectedLogIds={selectedLogIds}
              onToggleLog={toggleLogSelection}
              onToggleAll={toggleAllLogs}
              onDeleteLog={(id) => openDeleteModal('single', [id])}
              onDeleteSelected={() => openDeleteModal('bulk', selectedLogIds)}
              onDeleteAll={() => openDeleteModal('all', [])}
              isDeleting={deleteLoading}
            />
          )}
        </motion.div>
      </AnimatePresence>
      {selectedAlert && (
        <AlertDetailsModal 
          alert={selectedAlert} 
          onClose={() => setSelectedAlert(null)} 
        />
      )}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, mode: 'single', ids: [] })}
        onConfirm={confirmDelete}
        title={deleteTitle}
        message={deleteMessage}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}

function AlertDetailsModal({ alert, onClose }: { alert: SecurityLog, onClose: () => void }) {
  if (!alert) return null;
  const uaInfo = parseUserAgent(alert.user_agent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 z-10 backdrop-blur-xl ${
            alert.severity === 'critical' || alert.severity === 'danger' ? 'bg-red-50/80' : 
            alert.severity === 'warning' ? 'bg-amber-50/80' : 'bg-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
                alert.severity === 'critical' || alert.severity === 'danger' ? 'bg-red-100 text-red-600' : 
                alert.severity === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">تفاصيل التنبيه الأمني</h2>
              <div className="flex items-center gap-2 mt-1">
                 <Badge variant={getSeverityVariant(alert.severity)}>{alert.event_type}</Badge>
                 <span className="text-xs text-gray-500 font-mono" dir="ltr">{new Date(alert.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <h3 className="text-sm font-bold text-gray-900 mb-2">وصف الحدث</h3>
             <p className="text-gray-700 leading-relaxed">{alert.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Source Info */}
             <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                   <Monitor size={14} /> المصدر
                </h4>
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                   <div className="text-xs text-gray-500 mb-1">IP Address</div>
                   <div className="font-mono text-sm font-medium flex items-center justify-between">
                      {alert.ip_address}
                      <button onClick={() => {navigator.clipboard.writeText(alert.ip_address); toast.success('تم نسخ IP');}} className="text-gray-400 hover:text-blue-500">
                         <Copy size={14} />
                      </button>
                   </div>
                </div>
                {alert.user && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                       <div className="text-xs text-gray-500 mb-1">المستخدم المسجل</div>
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                             {alert.user.name.charAt(0)}
                          </div>
                          <div>
                             <div className="text-sm font-bold text-gray-900">{alert.user.name}</div>
                             <div className="text-xs text-gray-500">{alert.user.email}</div>
                          </div>
                       </div>
                    </div>
                )}
             </div>

             {/* Request Info */}
             <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                   <Globe size={14} /> الطلب
                </h4>
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                   <div className="text-xs text-gray-500 mb-1">المسار (URL)</div>
                   <div className="font-mono text-xs text-gray-700 break-all" dir="ltr">{alert.url}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                   <div className="text-xs text-gray-500 mb-1">المتصفح / النظام</div>
                   <div className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="font-medium">{uaInfo.browser}</span>
                      <span className="text-gray-300">|</span>
                      <span>{uaInfo.os}</span>
                   </div>
                   <div className="mt-2 text-[10px] text-gray-400 font-mono break-all leading-tight border-t border-gray-100 pt-2">
                      {alert.user_agent}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm">
              إغلاق
           </button>
           {alert.ip_address && (
              <button className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg transition-colors font-medium text-sm flex items-center gap-2">
                 <Shield size={16} />
                 حظر IP
              </button>
           )}
        </div>
      </motion.div>
    </div>
  );
}

// --- Tab Components ---

function OverviewTab({ performance, visitors, securityStats, perfHistory }: any) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="الزوار النشطون"
          value={visitors?.current || 0}
          icon={Users}
          color="blue"
          trend="+12%"
          footer={`منهم ${visitors?.current_members || 0} أعضاء`}
        />
        <MetricCard
          title="استهلاك المعالج"
          value={`${performance?.cpu.usage}%`}
          icon={Cpu}
          color="purple"
          progress={performance?.cpu.usage}
          footer={`${performance?.cpu.cores} أنوية نشطة`}
        />
        <MetricCard
          title="استهلاك الذاكرة"
          value={`${performance?.memory.percentage}%`}
          icon={HardDrive}
          color="amber"
          progress={performance?.memory.percentage}
          footer={`${Math.round((performance?.memory.used || 0) / 1024 / 1024)} ميجابايت مستخدمة`}
        />
        <MetricCard
          title="التهديدات المحظورة"
          value={securityStats?.blocked_attacks || 0}
          icon={Shield}
          color="red"
          footer="تم التصدي لها اليوم"
        />
      </div>

      <MonitorPerformanceChart perfHistory={perfHistory} />
    </div>
  );
}

function TrafficTab({
  visitors,
  visitorPerPage,
  includeBots,
  onChangePerPage,
  onToggleIncludeBots,
  onPrune,
  isPruning,
}: {
  visitors: VisitorStats | null;
  visitorPerPage: '20' | '50' | '100' | 'all';
  includeBots: boolean;
  onChangePerPage: (value: '20' | '50' | '100' | 'all') => void;
  onToggleIncludeBots: (value: boolean) => void;
  onPrune: () => void;
  isPruning: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'member' | 'guest'>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);

  // Derive Data
  const activeVisitors = visitors?.active_visitors || [];
  const totalActive = visitors?.current ?? activeVisitors.length;
  const totalMembers = visitors?.current_members ?? activeVisitors.filter(v => v.is_member).length;
  const totalGuests = visitors?.current_guests ?? activeVisitors.filter(v => !v.is_member).length;
  const uniqueCountries = Array.from(new Set(activeVisitors.map(v => v.country).filter(Boolean))).sort();

  const filteredVisitors = activeVisitors.filter(visitor => {
    // Search Filter
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      !query ||
      visitor.user_name?.toLowerCase().includes(query) ||
      visitor.ip?.includes(query) ||
      visitor.country?.toLowerCase().includes(query) ||
      visitor.browser?.toLowerCase().includes(query);
    
    // Type Filter
    const matchesType = 
      filterType === 'all' ? true :
      filterType === 'member' ? visitor.is_member :
      !visitor.is_member;

    // Country Filter
    const matchesCountry = filterCountry === 'all' || visitor.country === filterCountry;

    return matchesSearch && matchesType && matchesCountry;
  });

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    toast.success('تم نسخ عنوان IP بنجاح');
  };

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-gray-500 text-sm font-medium">إجمالي المتصلين</p>
             <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalActive}</h3>
           </div>
           <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-gray-500 text-sm font-medium">الأعضاء</p>
             <h3 className="text-2xl font-bold text-indigo-900 mt-1">{totalMembers}</h3>
           </div>
           <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><User size={20}/></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-gray-500 text-sm font-medium">الزوار الضيوف</p>
             <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalGuests}</h3>
           </div>
           <div className="p-3 bg-gray-50 text-gray-600 rounded-lg"><Globe size={20}/></div>
        </div>
         <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
             <p className="text-gray-500 text-sm font-medium">أعلى دولة</p>
             <div className="flex items-center gap-2 mt-1">
               <span className="text-lg">{getFlagEmoji(visitors?.country_stats?.[0]?.country || '')}</span>
               <h3 className="text-lg font-bold text-gray-900 truncate max-w-[100px]">{visitors?.country_stats?.[0]?.country || '-'}</h3>
             </div>
           </div>
           <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Globe size={20}/></div>
        </div>
      </div>

      {/* Main Table Section (Full Width) */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b border-gray-50 space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  جلسات الزوار النشطة
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  عرض {filteredVisitors.length} من أصل {totalActive} جلسة نشطة
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500">عرض</span>
                  <select
                    value={visitorPerPage}
                    onChange={(e) => onChangePerPage(e.target.value as '20' | '50' | '100' | 'all')}
                    className="bg-transparent text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="all">الكل</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={includeBots}
                    onChange={(e) => onToggleIncludeBots(e.target.checked)}
                  />
                  عرض البوتات
                </label>

                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isPruning}
                  leftIcon={<Trash2 size={14} />}
                  onClick={onPrune}
                >
                  تنظيف الجلسات
                </Button>
              </div>
            </div>

            {/* Filters Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="بحث عن مستخدم، IP، دولة..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64 transition-all"
                />
              </div>
              
              <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 w-fit">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  الكل
                </button>
                <button 
                  onClick={() => setFilterType('member')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'member' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  أعضاء
                </button>
                <button 
                  onClick={() => setFilterType('guest')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterType === 'guest' ? 'bg-white text-gray-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  زوار
                </button>
              </div>

              <select 
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                <option value="all">كل الدول</option>
                {uniqueCountries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">المستخدم</th>
                <th className="px-6 py-4">الدولة</th>
                <th className="px-6 py-4">المتصفح</th>
                <th className="px-6 py-4">الجهاز</th>
                <th className="px-6 py-4">آخر نشاط</th>
                <th className="px-6 py-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredVisitors.map((visitor, idx) => {
                 const uaInfo = parseUserAgent(visitor.user_agent || '');
                 return (
                  <tr key={`${visitor.ip}-${idx}`} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-full shadow-sm ${visitor.is_member ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                          <User size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">
                            {visitor.is_member ? visitor.user_name : 'زائر ضيف'}
                          </div>
                          <div className="font-mono text-xs text-gray-400 ltr text-right mt-0.5">{visitor.ip}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getFlagEmoji(visitor.country)}</span>
                        <span className="font-medium text-gray-700">{visitor.country}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600" title={visitor.browser}>{visitor.browser === 'Unknown' || visitor.browser === 'غير محدد' ? uaInfo.browser : visitor.browser}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600" title={visitor.os}>{visitor.os === 'Unknown' || visitor.os === 'غير محدد' ? uaInfo.os : visitor.os}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock size={14} className="text-gray-400" />
                        {new Date(visitor.last_active).toLocaleTimeString('ar-EG')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedVisitor(visitor)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleCopyIp(visitor.ip)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="نسخ IP"
                        >
                          <Copy size={18} />
                        </button>
                        {visitor.is_member && visitor.user_id && (
                          <button 
                            onClick={() => window.open(`/dashboard/users/${visitor.user_id}`, '_blank')}
                            className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex"
                            title="مشاهدة البروفايل"
                          >
                            <ExternalLink size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                 );
              })}
              {filteredVisitors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <div className="p-4 bg-gray-50 rounded-full mb-3">
                        <Search className="w-8 h-8 opacity-50" />
                      </div>
                      <p>لا توجد نتائج تطابق بحثك</p>
                      {activeVisitors.length > 0 && (
                        <button onClick={() => {setSearchQuery(''); setFilterType('all'); setFilterCountry('all');}} className="text-blue-500 text-sm mt-2 hover:underline">
                          مسح الفلاتر
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Country Stats (Moved below) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-white h-full">
          <CardHeader className="border-b border-gray-50 pb-4 px-6 pt-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-500" />
              توزيع الدول
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {visitors?.country_stats?.slice(0, 7).map((stat, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl drop-shadow-sm">{getFlagEmoji(stat.country)}</span>
                    <span className="font-medium text-gray-700">{stat.country || 'غير معروف'}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-md min-w-[30px] text-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {stat.count}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stat.count / (visitors?.country_stats[0]?.count || 1)) * 100, 100)}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  />
                </div>
              </div>
            ))}
             {(!visitors?.country_stats || visitors.country_stats.length === 0) && (
              <div className="text-center py-12 text-gray-400">
                <Globe className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>لا توجد بيانات جغرافية متاحة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visitor Details Modal */}
      {selectedVisitor && (
        <VisitorDetailsModal 
          visitor={selectedVisitor} 
          onClose={() => setSelectedVisitor(null)} 
        />
      )}


    </div>
  );
}

function SecurityTab({
  logs,
  stats,
  onViewLog,
  selectedLogIds,
  onToggleLog,
  onToggleAll,
  onDeleteLog,
  onDeleteSelected,
  onDeleteAll,
  isDeleting,
}: {
  logs: SecurityLog[];
  stats: any;
  onViewLog: (log: SecurityLog) => void;
  selectedLogIds: number[];
  onToggleLog: (id: number) => void;
  onToggleAll: (ids: number[], checked: boolean) => void;
  onDeleteLog: (id: number) => void;
  onDeleteSelected: () => void;
  onDeleteAll: () => void;
  isDeleting: boolean;
}) {
  const allIds = logs.map((log) => log.id);
  const allSelected = logs.length > 0 && selectedLogIds.length === logs.length;
  const someSelected = selectedLogIds.length > 0 && !allSelected;
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  return (
    <div className="space-y-6">
      {/* Security Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-red-50 rounded-xl p-5 border border-red-100 flex items-center justify-between">
          <div>
            <p className="text-red-600 font-medium mb-1">الهجمات المحظورة</p>
            <h3 className="text-2xl font-bold text-red-900">{stats?.blocked_attacks || 0}</h3>
          </div>
          <div className="p-3 bg-red-100 rounded-full text-red-600">
            <Shield size={24} />
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 flex items-center justify-between">
          <div>
            <p className="text-orange-600 font-medium mb-1">عناوين IP المحظورة</p>
            <h3 className="text-2xl font-bold text-orange-900">{stats?.blocked_ips_count || 0}</h3>
          </div>
          <div className="p-3 bg-orange-100 rounded-full text-orange-600">
            <Filter size={24} />
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-blue-600 font-medium mb-1">إجمالي الطلبات</p>
            <h3 className="text-2xl font-bold text-blue-900">{stats?.total_requests || 0}</h3>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Activity size={24} />
          </div>
        </div>
      </div>

      {/* Security Logs Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-gray-50 pb-4 px-6 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <List className="w-5 h-5 text-gray-500" />
              سجل الأحداث الأمنية
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedLogIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{selectedLogIds.length} محدد</span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={onDeleteSelected}
                    isLoading={isDeleting}
                    leftIcon={<Trash2 size={14} />}
                  >
                    حذف المحدد
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteAll}
                disabled={!logs.length || isDeleting}
                leftIcon={<Trash2 size={14} />}
              >
                حذف الكل
              </Button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" aria-label="Search logs">
                <Search size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" aria-label="Filter logs">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 w-[48px]">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onToggleAll(allIds, e.target.checked)}
                    disabled={!logs.length}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40"
                    aria-label="Select all security logs"
                  />
                </th>
                <th className="px-6 py-4 w-[200px]">نوع الحدث</th>
                <th className="px-6 py-4">الوصف</th>
                <th className="px-6 py-4 w-[180px]">المصدر (IP/User)</th>
                <th className="px-6 py-4 w-[150px]">التوقيت</th>
                <th className="px-6 py-4 w-[100px]">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr 
                  key={log.id} 
                  className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                  onClick={() => onViewLog(log)}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedLogIds.includes(log.id)}
                      onChange={() => onToggleLog(log.id)}
                      disabled={isDeleting}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/40"
                      aria-label="Select security log"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getSeverityVariant(log.severity)} className="w-fit">
                      {log.event_type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-700 font-medium truncate max-w-[400px]" title={log.description}>
                      {log.description}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-gray-600 bg-gray-100 w-fit px-1.5 py-0.5 rounded">
                        <Monitor size={10} />
                        {log.ip_address}
                      </div>
                      {log.user && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600">
                          <User size={10} />
                          {log.user.name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(log.created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onViewLog(log); }}
                      className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="عرض التفاصيل"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteLog(log.id); }}
                      className="p-2 ml-1 text-red-500 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="ðøë?"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>سجل الأمان نظيف تماماً</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// --- Shared Helpers ---

function MetricCard({ title, value, icon: Icon, color, trend, footer, progress }: any) {
  const colorStyles: any = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
  };
  const style = colorStyles[color] || colorStyles.blue;

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${style.bg} ${style.text}`}>
            <Icon size={22} />
          </div>
          {trend && (
            <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              {trend}
            </span>
          )}
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
        </div>

        {progress !== undefined && (
          <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              className={`h-full rounded-full ${progress > 80 ? 'bg-red-500' : progress > 50 ? 'bg-amber-500' : 'bg-blue-500'}`}
            />
          </div>
        )}

        {footer && (
          <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getSeverityVariant(severity: string): 'default' | 'error' | 'warning' | 'info' | 'success' {
  switch (severity?.toLowerCase()) {
    case 'critical':
    case 'danger': return 'error';
    case 'warning': return 'warning';
    case 'info': return 'info';
    case 'success': return 'success';
    default: return 'default';
  }
}

function getFlagEmoji(country: string) {
  if (!country || country === 'Unknown') return '🏳️';
  const map: Record<string, string> = {
    'Jordan': '🇯🇴', 'Saudi Arabia': '🇸🇦', 'Egypt': '🇪🇬', 'Palestine': '🇵🇸',
    'United Arab Emirates': '🇦🇪', 'Kuwait': '🇰🇼', 'Qatar': '🇶🇦', 'Bahrain': '🇧🇭',
    'Oman': '🇴🇲', 'Iraq': '🇮🇶', 'Syria': '🇸🇾', 'Lebanon': '🇱🇧', 'Yemen': '🇾🇪',
    'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Germany': '🇩🇪', 'France': '🇫🇷',
    'Turkey': '🇹🇷', 'Russia': '🇷🇺', 'China': '🇨🇳', 'India': '🇮🇳',
    'Morocco': '🇲🇦', 'Algeria': '🇩🇿', 'Tunisia': '🇹🇳', 'Libya': '🇱🇾', 'Sudan': '🇸🇩'
  };
  return map[country] || '🌍'; 
}

function parseUserAgent(ua: string) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
  
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Computer';

  // Detect Browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  else if (ua.includes('Trident')) browser = 'Internet Explorer';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Detect Device Type
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    device = 'Mobile';
  } else if (ua.includes('iPad') || ua.includes('Tablet')) {
    device = 'Tablet';
  }

  // Extract versions if possible (simple regex)
  const browserVersionMatch = ua.match(new RegExp(`${browser}\\/([\\d.]+)`));
  if (browserVersionMatch) {
    browser += ` ${browserVersionMatch[1]}`;
  }

  return { browser, os, device };
}

function VisitorDetailsModal({ visitor, onClose }: { visitor: any, onClose: () => void }) {
  if (!visitor) return null;
  const uaInfo = parseUserAgent(visitor.user_agent);

  // Calculate session duration
  const start = new Date(visitor.session_start || visitor.last_active);
  const now = new Date();
  const durationMs = now.getTime() - start.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const durationHours = Math.floor(durationMinutes / 60);
  
  let durationText = '';
  if (durationHours > 0) durationText += `${durationHours} ساعة و `;
  durationText += `${durationMinutes % 60} دقيقة`;
  if (durationMinutes < 1) durationText = 'أقل من دقيقة';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${visitor.is_member ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
              {visitor.is_member ? <User size={24} /> : <Globe size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">تفاصيل الزائر</h2>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${visitor.is_member ? 'bg-indigo-500' : 'bg-blue-500'}`}></span>
                {visitor.is_member ? 'عضو مسجل' : 'زائر ضيف'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Top Grid: User Info & Device */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Information */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User size={16} className="text-blue-500" />
                معلومات المستخدم
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <span className="text-gray-500 text-sm">الاسم</span>
                  <span className="font-medium text-gray-900">{visitor.user_name || 'زائر'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <span className="text-gray-500 text-sm">البريد الإلكتروني</span>
                  <span className="font-medium text-gray-900">{visitor.user_email || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <span className="text-gray-500 text-sm">الصلاحية</span>
                  <Badge variant={visitor.user_role === 'Admin' ? 'error' : 'default'}>{visitor.user_role || 'Guest'}</Badge>
                </div>
              </div>
            </div>

            {/* Device & Location */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Laptop size={16} className="text-purple-500" />
                الجهاز والموقع
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <span className="text-gray-500 text-sm">المتصفح</span>
                  <span className="font-medium text-gray-900 flex items-center gap-2">
                    {visitor.browser === 'Unknown' || visitor.browser === 'غير محدد' ? uaInfo.browser : visitor.browser}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <span className="text-gray-500 text-sm">نظام التشغيل</span>
                  <span className="font-medium text-gray-900 flex items-center gap-2">
                     {visitor.os === 'Unknown' || visitor.os === 'غير محدد' ? uaInfo.os : visitor.os}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <span className="text-gray-500 text-sm">IP Address</span>
                  <span className="font-mono text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 text-xs">
                    {visitor.ip}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                  <span className="text-gray-500 text-sm">الموقع</span>
                  <span className="font-medium text-gray-900 flex items-center gap-2">
                    {getFlagEmoji(visitor.country)} {visitor.country}, {visitor.city}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
             <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity size={16} className="text-green-500" />
                  معلومات الجلسة
                </h3>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <div>
                   <label className="text-xs text-gray-400 block mb-1">الحالة</label>
                   <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      <span className="font-medium text-green-600">نشط الآن (Online)</span>
                   </div>
                </div>
                <div>
                   <label className="text-xs text-gray-400 block mb-1">وقت البدء</label>
                   <div className="font-medium text-gray-900">
                      {visitor.session_start ? new Date(visitor.session_start).toLocaleString('ar-EG') : '-'}
                   </div>
                </div>
                <div>
                   <label className="text-xs text-gray-400 block mb-1">آخر نشاط</label>
                   <div className="font-medium text-gray-900">
                      {new Date(visitor.last_active).toLocaleString('ar-EG')}
                      <span className="text-xs text-gray-400 mr-2">
                         (منذ {Math.floor((new Date().getTime() - new Date(visitor.last_active).getTime()) / 1000)} ثانية)
                      </span>
                   </div>
                </div>
                 <div>
                   <label className="text-xs text-gray-400 block mb-1">مدة الجلسة</label>
                   <div className="font-medium text-gray-900">{durationText}</div>
                </div>
                <div className="col-span-full">
                   <label className="text-xs text-gray-400 block mb-1">الصفحة الحالية</label>
                   <a href={visitor.current_page_full} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all font-mono text-sm flex items-center gap-1">
                      {visitor.current_page_full}
                      <ExternalLink size={12} />
                   </a>
                </div>
                <div className="col-span-full">
                   <label className="text-xs text-gray-400 block mb-1">User Agent</label>
                   <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-600 font-mono break-all">
                      {visitor.user_agent}
                   </div>
                </div>
             </div>
          </div>

          {/* History Table */}
          <div className="space-y-4">
             <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Clock size={20} className="text-gray-400" />
                سجل النشاط الحديث
             </h3>
             <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-right">
                   <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                         <th className="px-4 py-3">الوقت</th>
                         <th className="px-4 py-3">الصفحة</th>
                         <th className="px-4 py-3">الجهاز</th>
                         <th className="px-4 py-3">الموقع</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {visitor.history?.map((record: any, idx: number) => (
                         <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                               {new Date(record.time).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                               <div className="text-xs text-gray-400">{new Date(record.time).toLocaleDateString('ar-EG')}</div>
                            </td>
                            <td className="px-4 py-3">
                               <div className="truncate max-w-[200px] text-gray-900" title={record.url}>{record.url}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{record.device}</td>
                            <td className="px-4 py-3 text-gray-600">{record.location}</td>
                         </tr>
                      ))}
                      {(!visitor.history || visitor.history.length === 0) && (
                         <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                               لا يوجد سجل نشاط سابق
                            </td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
