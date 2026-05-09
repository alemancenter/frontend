'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  Trash2,
  Calendar,
  RefreshCw,
  FileText,
  Newspaper,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { commentsService, COUNTRIES } from '@/lib/api/services';
import { Comment } from '@/lib/api/services/comments';
import { ConfirmModal, AlertModal } from '@/components/ui/Modal';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';
import Pagination from '@/components/ui/Pagination';

type CommentStatus = 'pending' | 'approved' | 'rejected' | '';

const STATUS_OPTIONS: Array<{ value: CommentStatus; label: string }> = [
  { value: 'pending', label: 'قيد المراجعة' },
  { value: 'approved', label: 'موافق عليها' },
  { value: 'rejected', label: 'مرفوضة' },
  { value: '', label: 'كل الحالات' },
];

function isArticleComment(comment: Comment): boolean {
  return comment.commentable_type.toLowerCase().includes('article');
}

function getCommentTargetUrl(comment: Comment, selectedDatabase: string): string {
  const database = (comment.database || selectedDatabase || 'jo').toLowerCase();
  const path = isArticleComment(comment)
    ? `/${database}/lesson/articles/${comment.commentable_id}`
    : `/${database}/posts/${comment.commentable_id}`;

  return `${path}#comment-${comment.id}`;
}

function getStatusMeta(status?: Comment['status']) {
  switch (status) {
    case 'approved':
      return { label: 'موافق عليها', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'rejected':
      return { label: 'مرفوضة', className: 'bg-red-50 text-red-700 border-red-200' };
    default:
      return { label: 'قيد المراجعة', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
}

export default function CommentsPage() {
  const { isAuthorized } = usePermissionGuard('manage comments');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CommentStatus>('pending');
  // Default to Jordan (jo)
  const [selectedDatabase, setSelectedDatabase] = useState<string>('jo');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    last_page: 1,
    per_page: 20,
    total: 0,
  });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; variant: 'success' | 'error' }>({
    title: '',
    message: '',
    variant: 'success',
  });

  // Allowed databases for comments
  const ALLOWED_DATABASES = ['jo', 'sa', 'eg', 'ps'];
  const filteredCountries = COUNTRIES.filter(c => ALLOWED_DATABASES.includes(c.code));

  const fetchComments = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await commentsService.getAllDashboard(selectedDatabase, {
        page,
        per_page: 20,
        q: searchQuery || undefined,
        status: selectedStatus || undefined,
      });

      // Laravel returns either { data: [], meta: {} } or { current_page, data: [], last_page, total, ... }
      const list: Comment[] = response?.data || [];
      const meta = response?.meta ?? (response as any);

      setComments(list);
      setSelectedIds([]);
      setCurrentPage(meta?.current_page ?? page);
      setPagination({
        last_page: meta?.last_page ?? 1,
        per_page: meta?.per_page ?? 20,
        total: meta?.total ?? list.length,
      });
    } catch (err: any) {
      console.error('Failed to fetch comments:', err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDatabase, searchQuery, selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
    fetchComments(1);
  }, [fetchComments]);

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

  const handleDeleteClick = (id: number) => {
    setConfirmDeleteId(id);
    setConfirmOpen(true);
  };

  const visibleCommentIds = comments.map((comment) => comment.id);
  const allVisibleSelected = visibleCommentIds.length > 0 && visibleCommentIds.every((id) => selectedIds.includes(id));
  const hasSelection = selectedIds.length > 0;

  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? [] : visibleCommentIds);
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  const handleBulkDeleteClick = () => {
    if (!hasSelection) return;
    setBulkConfirmOpen(true);
  };

  const handleStatusUpdate = async (id: number, action: 'approve' | 'reject') => {
    try {
      setActionLoadingId(id);
      if (action === 'approve') {
        await commentsService.approve(selectedDatabase, id);
      } else {
        await commentsService.reject(selectedDatabase, id);
      }

      setAlertConfig({
        title: action === 'approve' ? 'تمت الموافقة' : 'تم الرفض',
        message: action === 'approve' ? 'تمت الموافقة على التعليق بنجاح' : 'تم رفض التعليق بنجاح',
        variant: 'success',
      });
      setAlertOpen(true);
      await fetchComments(currentPage);
    } catch {
      setAlertConfig({
        title: 'خطأ',
        message: 'فشل تحديث حالة التعليق',
        variant: 'error',
      });
      setAlertOpen(true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await commentsService.delete(selectedDatabase, confirmDeleteId);
      setAlertConfig({
        title: 'تم الحذف',
        message: 'تم حذف التعليق بنجاح',
        variant: 'success',
      });
      setAlertOpen(true);
      await fetchComments(currentPage);
    } catch {
      setAlertConfig({
        title: 'خطأ',
        message: 'فشل حذف التعليق',
        variant: 'error',
      });
      setAlertOpen(true);
    } finally {
      setConfirmOpen(false);
      setConfirmDeleteId(null);
    }
  };

  const confirmBulkDelete = async () => {
    if (!hasSelection) return;
    try {
      setIsBulkDeleting(true);
      await commentsService.bulkDelete(selectedDatabase, selectedIds);
      setAlertConfig({
        title: 'تم الحذف',
        message: `تم حذف ${selectedIds.length} تعليق بنجاح`,
        variant: 'success',
      });
      setAlertOpen(true);
      setSelectedIds([]);
      await fetchComments(currentPage);
    } catch {
      setAlertConfig({
        title: 'خطأ',
        message: 'فشل حذف التعليقات المحددة',
        variant: 'error',
      });
      setAlertOpen(true);
    } finally {
      setIsBulkDeleting(false);
      setBulkConfirmOpen(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            التعليقات
          </h1>
          <p className="text-gray-500 mt-1">إدارة التعليقات والتحكم بها</p>
        </div>

        <div className="flex items-center gap-3">
            <div className="relative min-w-[200px]">
                <select
                    value={selectedDatabase}
                    onChange={(e) => setSelectedDatabase(e.target.value)}
                    className="w-full h-10 pr-3 pl-10 bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                    {filteredCountries.map((country) => (
                    <option key={country.id} value={country.code}>
                        {country.name}
                    </option>
                    ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <RefreshCw className="w-4 h-4" />
                </div>
            </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="بحث في محتوى التعليقات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="relative sm:w-56">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as CommentStatus)}
            className="w-full py-2.5 pr-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {hasSelection && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-red-700">
              تم تحديد {selectedIds.length} تعليق
            </p>
            <p className="text-xs text-red-600 mt-1">
              سيتم حذف التعليقات المحددة من قاعدة بيانات {selectedDatabase}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors"
            >
              إلغاء التحديد
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteClick}
              disabled={isBulkDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              حذف المحدد
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-4 text-blue-500" />
            <p>جاري تحميل التعليقات...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">لا توجد تعليقات</p>
            <p className="text-sm text-gray-400 mt-1">لم يتم العثور على أي تعليقات في قاعدة البيانات المحددة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      aria-label="تحديد كل التعليقات في الصفحة"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">التعليق</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">المستخدم</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">المكان</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">الحالة</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">التاريخ</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {comments.map((comment) => {
                    const targetUrl = getCommentTargetUrl(comment, selectedDatabase);
                    const isArticle = isArticleComment(comment);
                    const targetTitle = comment.commentable?.title || comment.commentable?.name || `#${comment.commentable_id}`;
                    const statusMeta = getStatusMeta(comment.status);
                    const isUpdating = actionLoadingId === comment.id;

                    return (
                    <motion.tr
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(comment.id)}
                          onChange={() => toggleSelectOne(comment.id)}
                          aria-label={`تحديد التعليق ${comment.id}`}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-lg">
                          <Link
                            href={targetUrl}
                            className="text-gray-800 text-sm leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all hover:text-blue-600 block"
                          >
                            {comment.body}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {comment.user?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{comment.user?.name || 'مستخدم غير معروف'}</p>
                            <p className="text-xs text-gray-500">{comment.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full w-fit bg-gray-100 text-gray-600">
                            {isArticle ? (
                              <FileText className="w-3 h-3" />
                            ) : (
                              <Newspaper className="w-3 h-3" />
                            )}
                            {comment.commentable_type.includes('Article') ? 'مقال' : 'خبر'}
                          </div>
                          {comment.commentable ? (
                            <Link
                              href={targetUrl}
                              className="text-sm text-blue-600 truncate max-w-[200px] hover:underline"
                              title={targetTitle}
                            >
                              {comment.commentable.title}
                            </Link>
                          ) : (
                            <p className="text-sm text-gray-400 truncate max-w-[200px]">
                              محذوف
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(comment.created_at).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {comment.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusUpdate(comment.id, 'approve')}
                              disabled={isUpdating}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                              title="قبول التعليق"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {comment.status !== 'rejected' && (
                            <button
                              onClick={() => handleStatusUpdate(comment.id, 'reject')}
                              disabled={isUpdating}
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                              title="رفض التعليق"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(comment.id)}
                            disabled={isUpdating}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="حذف التعليق"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {comments.length > 0 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-gray-500">
                    عرض {comments.length} من أصل {pagination.total} تعليق
                    {pagination.last_page > 1 && ` — صفحة ${currentPage} من ${pagination.last_page}`}
                </p>
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.last_page}
                  onPageChange={(page) => { setCurrentPage(page); fetchComments(page); }}
                />
            </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="حذف التعليق"
        message="هل أنت متأكد من رغبتك في حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
      />

      <ConfirmModal
        isOpen={bulkConfirmOpen}
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={confirmBulkDelete}
        title="حذف التعليقات المحددة"
        message={`هل أنت متأكد من حذف ${selectedIds.length} تعليق؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف المحدد"
        cancelText="إلغاء"
        variant="danger"
        isLoading={isBulkDeleting}
      />

      <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
      />
    </div>
  );
}
