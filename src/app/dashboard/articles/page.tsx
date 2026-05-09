'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from '@/components/common/AppImage';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Globe,
  FileText,
  ArrowUpRight,
  Clock,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { articlesService, COUNTRIES } from '@/lib/api/services';
import type { Article } from '@/types';
import { ConfirmModal, AlertModal } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

export default function ArticlesPage() {
  const { isAuthorized } = usePermissionGuard('manage articles');
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    views: 0,
    published: 0,
    drafts: 0
  });

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('1');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; variant: 'success' | 'error' }>({
    title: '',
    message: '',
    variant: 'success',
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });

  const stats = [
    { 
      label: 'إجمالي المقالات', 
      value: globalStats.total.toLocaleString(), 
      change: '+0%', 
      icon: FileText, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      action: () => setStatusFilter(undefined),
      active: statusFilter === undefined
    },
    { 
      label: 'إجمالي المشاهدات', 
      value: globalStats.views.toLocaleString(), 
      change: '+0%', 
      icon: Eye, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10'
      // No action for views
    },
    { 
      label: 'مقالات منشورة', 
      value: globalStats.published.toLocaleString(), 
      change: '+0%', 
      icon: CheckCircle2, 
      color: 'text-violet-500', 
      bg: 'bg-violet-500/10',
      action: () => setStatusFilter(true),
      active: statusFilter === true
    },
    { 
      label: 'مسودات', 
      value: globalStats.drafts.toLocaleString(), 
      change: '+0%', 
      icon: Clock, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10',
      action: () => setStatusFilter(false),
      active: statusFilter === false
    },
  ];

  // Country name mapping with robust normalization and fallback to selectedCountry
  const toCountryName = (id: string | number | undefined) => {
    if (id === undefined || id === null) return COUNTRIES.find(c => c.id === selectedCountry)?.name || 'غير محدد';
    const s = String(id).trim().toLowerCase();
    const country = COUNTRIES.find(c => c.id === s || c.code === s || c.name === s);
    if (country) return country.name;
    
    // Fallback legacy checks if needed, but COUNTRIES should cover it
    return COUNTRIES.find(c => c.id === selectedCountry)?.name || 'غير محدد';
  };

  const fetchStats = useCallback(async () => {
    try {
      const stats = await articlesService.getStats(selectedCountry);
      setGlobalStats(stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [selectedCountry]);

  const fetchArticles = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      // Simulate API delay for smooth transition demo
      // await new Promise(resolve => setTimeout(resolve, 800));
      
      const response = await articlesService.getAll({
        country: selectedCountry,
        page,
        per_page: 15,
        q: searchQuery || undefined,
        status: statusFilter,
      });
      setArticles(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCountry, searchQuery, statusFilter]);

  useEffect(() => {
    fetchArticles(1);
    fetchStats();
  }, [fetchArticles, fetchStats]);

  const handleStatusToggle = async (id: number, currentStatus: boolean) => {
    try {
      // Optimistic update
      setArticles(prev => prev.map(a => 
        a.id === id ? { ...a, status: !currentStatus } : a
      ));

      await articlesService.toggleStatus(id, !currentStatus, selectedCountry);
      
      // Refresh stats to reflect changes
      fetchStats();
      
      setAlertConfig({
        title: 'تم التحديث',
        message: `تم ${!currentStatus ? 'نشر' : 'إلغاء نشر'} المقال بنجاح.`,
        variant: 'success',
      });
      setAlertOpen(true);
    } catch (error) {
      console.error('Status toggle failed', error);
      // Revert optimistic update
      setArticles(prev => prev.map(a => 
        a.id === id ? { ...a, status: currentStatus } : a
      ));
      
      setAlertConfig({
        title: 'فشل التحديث',
        message: 'حدث خطأ أثناء تحديث حالة المقال.',
        variant: 'error',
      });
      setAlertOpen(true);
    }
  };

  const handleDeleteClick = async (id: number) => {
    setConfirmDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await articlesService.delete(confirmDeleteId);
      setConfirmOpen(false);
      setConfirmDeleteId(null);
      await fetchArticles(pagination.current_page);
      fetchStats();
      setAlertConfig({
        title: 'تم الحذف',
        message: 'تم حذف المقال بنجاح.',
        variant: 'success',
      });
      setAlertOpen(true);
    } catch (error) {
      console.error('Delete failed', error);
      setConfirmOpen(false);
      setAlertConfig({
        title: 'فشل الحذف',
        message: 'حدث خطأ أثناء حذف المقال. حاول مرة أخرى.',
        variant: 'error',
      });
      setAlertOpen(true);
    }
  };

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

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">إدارة المقالات</h1>
          <p className="text-muted-foreground mt-1">قم بإدارة المحتوى التعليمي، المقالات، والمنشورات.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/dashboard/articles/create">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 font-medium group">
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>مقال جديد</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={stat.action}
            className={`p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all
              ${stat.action ? 'cursor-pointer hover:border-primary/50' : ''}
              ${stat.active ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-border/50'}
            `}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-2 text-foreground">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-emerald-500 font-medium flex items-center gap-1">
                {stat.change} <ArrowUpRight size={14} />
              </span>
              <span className="text-muted-foreground">عن الشهر الماضي</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Actions Bar */}
      <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {COUNTRIES.map((country) => (
            <button
              key={country.id}
              onClick={() => setSelectedCountry(country.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                ${selectedCountry === country.id 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent'
                }
              `}
            >
              <Globe size={16} />
              {country.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              id="search-articles"
              name="search"
              type="text" 
              placeholder="بحث عن مقال..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pr-10 pl-4 rounded-xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all text-sm outline-none"
            />
          </div>
          
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/50">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Articles Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : articles.length > 0 ? (
        viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full"
                >
                  <div className="aspect-video bg-secondary/50 relative overflow-hidden">
                    {article.image_url ? (
                      <Image 
                        src={article.image_url} 
                        alt={article.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <FileText size={48} className="opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusToggle(article.id, !!article.status);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-md border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer
                        ${article.status 
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30' 
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30'
                        }
                      `}
                    >
                      {article.status ? 'منشور' : 'مسودة'}
                    </button>
                  </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md">
                        <Globe size={12} />
                        {toCountryName(article.country_id)}
                      </span>
                      <span className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md">
                        <Eye size={12} />
                        {article.views || 0}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                      {article.meta_description || 'لا يوجد وصف متاح لهذا المقال...'}
                    </p>

                    <div className="pt-4 mt-auto border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        {article.created_at ? new Date(article.created_at).toLocaleDateString('en-GB') : '-'}
                      </span>
                      
                      <div className="flex gap-1">
                        <Link href={`/dashboard/articles/edit/${article.id}`}>
                          <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                        </Link>
                        <button 
                          onClick={() => handleDeleteClick(article.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          // List View
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/30 border-b border-border text-right">
                    <th className="py-4 px-6 text-sm font-medium text-muted-foreground">العنوان</th>
                    <th className="py-4 px-6 text-sm font-medium text-muted-foreground">الحالة</th>
                    <th className="py-4 px-6 text-sm font-medium text-muted-foreground">الدولة</th>
                    <th className="py-4 px-6 text-sm font-medium text-muted-foreground">المشاهدات</th>
                    <th className="py-4 px-6 text-sm font-medium text-muted-foreground">تاريخ النشر</th>
                    <th className="py-4 px-6 text-sm font-medium text-muted-foreground text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {articles.map((article) => (
                    <tr key={article.id} className="group hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary/50 overflow-hidden flex-shrink-0 relative">
                            {article.image_url ? (
                              <Image src={article.image_url} alt="" fill sizes="40px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <FileText size={16} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                              {article.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                              {article.meta_description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusToggle(article.id, !!article.status);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:scale-105 active:scale-95 cursor-pointer
                          ${article.status 
                            ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 hover:bg-green-200 dark:hover:bg-green-500/20' 
                            : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/20'
                          }
                        `}>
                          {article.status ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              منشور
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              مسودة
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-sm text-foreground">
                        {toCountryName(article.country_id)}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {article.views || 0}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {article.created_at ? new Date(article.created_at).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/dashboard/articles/edit/${article.id}`}>
                            <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="تعديل">
                              <Edit size={16} />
                            </button>
                          </Link>
                          <button 
                            onClick={() => handleDeleteClick(article.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border/50 border-dashed">
          <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
            <Search size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">لا توجد مقالات</h3>
          <p className="text-muted-foreground mt-1 text-center max-w-sm">
            لم يتم العثور على أي مقالات تطابق بحثك. حاول تغيير معايير البحث أو أضف مقالاً جديداً.
          </p>
          <Link href="/dashboard/articles/create" className="mt-6">
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors">
              إضافة مقال جديد
            </button>
          </Link>
        </div>
      )}

      {/* Pagination */}
      {articles.length > 0 && pagination.last_page > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={pagination.current_page}
            totalPages={pagination.last_page}
            onPageChange={fetchArticles}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع عن هذه العملية."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
      />
      <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
        buttonText="حسناً"
      />
    </div>
  );
}
