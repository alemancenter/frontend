'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Trash2,
  Download,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  File,
  Grid,
  List,
  Upload,
  Eye,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { cn, formatFileSize } from '@/lib/utils';
import type { FileItem, Role, Permission } from '@/types';
import { filesService, API_CONFIG, API_ENDPOINTS } from '@/lib/api/services';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

const mockFiles: FileItem[] = [];

type ViewMode = 'grid' | 'list';
type CategoryFilter = 'all' | string;

const CATEGORY_LABELS: Record<string, string> = {
  study_plan: 'خطط الدراسة',
  worksheet: 'أوراق عمل',
  exam: 'اختبارات',
  book: 'كتب',
  record: 'السجلات',
  images: 'صور',
};
const CATEGORY_ALIASES: Record<string, string[]> = {
  study_plan: [
    'plans',
    'study-plan',
    'studyplan',
    'study_plan',
    'خطط الدراسة',
    'خطة دراسية',
  ],
  worksheet: [
    'worksheet',
    'worksheets',
    'papers',
    'أوراق عمل',
    'ورقة عمل',
  ],
  exam: [
    'exam',
    'exams',
    'test',
    'tests',
    'اختبارات',
    'اختبار',
  ],
  book: [
    'book',
    'books',
    'كتب',
    'كتاب',
  ],
  record: [
    'record',
    'records',
    'log',
    'سجلات',
    'سجل',
  ],
  images: [
    'image',
    'images',
    'img',
    'picture',
    'photo',
    'صور',
    'صورة',
  ],
};
const DEFAULT_CATEGORIES = Object.keys(CATEGORY_LABELS);
const normCat = (c?: string) => (c ?? '').trim().toLowerCase();
const toBackendCategory = (c: string) => {
  const n = normCat(c);
  if (CATEGORY_LABELS[n]) return n;
  const rev = Object.entries(CATEGORY_LABELS).find(([, label]) => normCat(label) === n);
  return rev ? rev[0] : n;
};
const toDisplayCategory = (c: string) => {
  const n = normCat(c);
  return CATEGORY_LABELS[n] ?? c;
};

const resolveCategory = (f: FileItem): string => {
  if (!f) return '';
  const fc = normCat(f.file_category);
  const fp = normCat(f.file_path);
  
  if (f.mime_type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(f.file_type?.toLowerCase())) {
    return 'images';
  }

  if (fc) {
    const back = toBackendCategory(fc);
    if (CATEGORY_LABELS[back]) return back;
    const hit = Object.entries(CATEGORY_ALIASES).find(([, aliases]) =>
      aliases?.map(normCat).includes(fc)
    );
    if (hit) return hit[0];
  }
  if (fp) {
    if (fp.includes('/worksheet/')) return 'worksheet';
    if (fp.includes('/study_plan/') || fp.includes('/study-plan/') || fp.includes('/plans/')) return 'study_plan';
    if (fp.includes('/exam/') || fp.includes('/exams/') || fp.includes('/test/')) return 'exam';
    if (fp.includes('/book/') || fp.includes('/books/')) return 'book';
    if (fp.includes('/record/') || fp.includes('/records/') || fp.includes('/log/')) return 'record';
  }
  return fc || '';
};
const getFileIcon = (mimeType: string) => {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Film;
  if (mimeType.startsWith('audio/')) return Music;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return Archive;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet')) return FileText;
  return File;
};

const getFileColor = (mimeType: string) => {
  if (!mimeType) return 'text-blue-500 bg-blue-500/10';
  if (mimeType.startsWith('image/')) return 'text-green-500 bg-green-500/10';
  if (mimeType.startsWith('video/')) return 'text-purple-500 bg-purple-500/10';
  if (mimeType.startsWith('audio/')) return 'text-pink-500 bg-pink-500/10';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'text-yellow-500 bg-yellow-500/10';
  if (mimeType.includes('pdf')) return 'text-red-500 bg-red-500/10';
  return 'text-blue-500 bg-blue-500/10';
};

 

export default function FilesPage() {
  const { isAuthorized, user } = usePermissionGuard('manage files');

  const canUpload = user?.roles?.some((r: Role) => ['admin', 'super_admin'].includes(r.name)) || 
                    user?.permissions?.some((p: Permission) => p.name === 'manage files');

  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [uploadModal, setUploadModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 48,
    total: 0,
  });
  const hasMore = pagination.current_page < pagination.last_page;
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);

  const detectMime = (f: FileItem) => {
    if (!f) return '';
    if (f.mime_type) return f.mime_type;
    const name = f.file_name?.toLowerCase() || '';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.gif') || name.endsWith('.webp')) return 'image/';
    if (name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.avi') || name.endsWith('.mkv')) return 'video/';
    if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.aac')) return 'audio/';
    if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.tar') || name.endsWith('.gz')) return 'application/zip';
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.doc') || name.endsWith('.docx')) return 'application/msword';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'application/vnd.ms-excel';
    return f.file_type || '';
  };

  const fetchFiles = async (page = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);
      const res: unknown = await filesService.getAll({
        country: '1',
        page,
        per_page: pagination.per_page,
        search: searchQuery || undefined,
        category:
          selectedCategory !== 'all' ? toBackendCategory(selectedCategory) : undefined,
      });

      const getProp = (o: unknown, k: string): unknown => {
        if (o && typeof o === 'object' && k in (o as Record<string, unknown>)) {
          return (o as Record<string, unknown>)[k];
        }
        return undefined;
      };
      const data = getProp(res, 'data');
      const nestedData = getProp(data, 'data');
      const list = Array.isArray(nestedData)
        ? (nestedData as FileItem[])
        : Array.isArray(data)
        ? (data as FileItem[])
        : Array.isArray(res)
        ? (res as FileItem[])
        : [];

      const metaUnknown = getProp(data, 'pagination') ?? getProp(res, 'pagination') ?? getProp(res, 'meta');
      const meta =
        metaUnknown && typeof metaUnknown === 'object'
          ? (metaUnknown as { current_page?: number; last_page?: number; per_page?: number; total?: number })
          : pagination;
      setFiles((prev) => (append ? [...prev, ...(list || [])] : (list || [])));
      setPagination({
        current_page: meta.current_page || page,
        last_page: meta.last_page || 1,
        per_page: meta.per_page || pagination.per_page,
        total: meta.total || (Array.isArray(list) ? list.length : 0) || 0,
      });
    } catch (e) {
      let msg = 'فشل جلب الملفات';
      if (e && typeof e === 'object' && 'message' in (e as Record<string, unknown>)) {
        const m = (e as { message?: unknown }).message;
        if (typeof m === 'string') msg = m;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    fetchFiles(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    const id = setTimeout(() => {
      fetchFiles(1);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, isAuthorized]);

  const filterByCategory = (file: FileItem) =>
    selectedCategory === 'all'
      ? true
      : (() => {
          const sel = toBackendCategory(selectedCategory);
          const fileCat = resolveCategory(file);
          return fileCat === sel;
        })();

  const filteredFiles = files.filter(
    (f) =>
      f &&
      (f.file_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) &&
      filterByCategory(f)
  );

  const toggleSelectFile = (id: number) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleDelete = (ids: number[]) => {
    if (!ids.length) return;
    setPendingDeleteIds(ids);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteIds.length) {
      setDeleteModalOpen(false);
      return;
    }
    try {
      setLoading(true);
      for (const id of pendingDeleteIds) {
        await filesService.delete(id, '1');
      }
      setFiles((prev) => prev.filter((f) => !pendingDeleteIds.includes(f.id)));
      setSelectedFiles([]);
      await fetchFiles(pagination.current_page);
    } catch {
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setPendingDeleteIds([]);
    }
  };

  const totalSize = useMemo(() => files.reduce((sum, f) => sum + (f?.file_size || 0), 0), [files]);
  const totalViews = useMemo(() => files.reduce((sum, f) => sum + (f?.views_count || 0), 0), [files]);
  const totalDownloads = useMemo(() => files.reduce((sum, f) => sum + (f?.download_count || 0), 0), [files]);
  const downloadUrl = (id: number) => `${API_CONFIG.BASE_URL}${API_ENDPOINTS.FILES.DOWNLOAD(id)}`;

  const categories = DEFAULT_CATEGORIES;

  if (isAuthorized === null) {
    return null;
  }

  if (isAuthorized === false) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة الملفات</h1>
          <p className="text-muted-foreground">إدارة ملفات النظام والوسائط</p>
        </div>
        {canUpload && (
          <Button leftIcon={<Upload className="w-4 h-4" />} onClick={() => setUploadModal(true)}>
            رفع ملف
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي الملفات</p>
            <p className="text-2xl font-bold text-primary">{pagination.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">الحجم الإجمالي</p>
            <p className="text-2xl font-bold text-accent">{formatFileSize(totalSize)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">الصور</p>
            <p className="text-2xl font-bold text-success">
              {files.filter((f) => detectMime(f).startsWith('image/')).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">المستندات</p>
            <p className="text-2xl font-bold text-warning">
              {files.filter((f) => {
                const m = detectMime(f);
                return m.includes('pdf') || m.includes('document');
              }).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي المشاهدات</p>
            <p className="text-2xl font-bold text-indigo-600">{totalViews.toLocaleString('ar-EG')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">إجمالي التنزيلات</p>
            <p className="text-2xl font-bold text-emerald-600">{totalDownloads.toLocaleString('ar-EG')}</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-error">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
                  selectedCategory === 'all' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                )}
              >
                <File className="w-4 h-4" />
                الكل
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
                    selectedCategory === cat ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  <FileText className="w-4 h-4" />
                  {toDisplayCategory(cat)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {selectedFiles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => handleDelete(selectedFiles)}
                >
                  حذف ({selectedFiles.length})
                </Button>
              )}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-muted border-none rounded-lg pr-9 pl-4 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'grid' ? 'bg-primary text-white' : 'hover:bg-muted'
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'list' ? 'bg-primary text-white' : 'hover:bg-muted'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-muted h-32 animate-pulse" />
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">لا توجد ملفات مطابقة</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file, index) => {
            const mime = detectMime(file);
            const Icon = getFileIcon(mime);
            const colorClass = getFileColor(mime);

            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-lg',
                    selectedFiles.includes(file.id) && 'ring-2 ring-primary'
                  )}
                  onClick={() => toggleSelectFile(file.id)}
                >
                  <CardContent className="py-6">
                    <div className="flex flex-col items-center text-center">
                      <div className={cn('w-16 h-16 rounded-xl flex items-center justify-center mb-4', colorClass)}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <p className="font-medium text-sm truncate w-full mb-1">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size || 0)}</p>
                      <div className="mt-2 flex items-center justify-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {(file.views_count || 0).toLocaleString('ar-EG')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {(file.download_count || 0).toLocaleString('ar-EG')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(downloadUrl(file.id), '_blank'); }}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete([file.id]); }}
                        className="p-1.5 rounded-lg hover:bg-error/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredFiles.map((file) => {
                const mime = detectMime(file);
                const Icon = getFileIcon(mime);
                const colorClass = getFileColor(mime);

                return (
                  <div
                    key={file.id}
                    className={cn(
                      'flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors',
                      selectedFiles.includes(file.id) && 'bg-primary/5'
                    )}
                    onClick={() => toggleSelectFile(file.id)}
                  >
                    <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colorClass)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.file_name}</p>
                      <p className="text-sm text-muted-foreground">{file.created_at}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">{formatFileSize(file.file_size || 0)}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {(file.views_count || 0).toLocaleString('ar-EG')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {(file.download_count || 0).toLocaleString('ar-EG')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(downloadUrl(file.id), '_blank'); }}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete([file.id]); }}
                        className="p-1.5 rounded-lg hover:bg-error/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          صفحة {pagination.current_page} من {pagination.last_page} — إجمالي {pagination.total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.current_page <= 1 || loading}
            onClick={() => fetchFiles(pagination.current_page - 1)}
          >
            السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.current_page >= pagination.last_page || loading}
            onClick={() => fetchFiles(pagination.current_page + 1)}
          >
            التالي
          </Button>
          <Button
            size="sm"
            disabled={!hasMore || loading}
            onClick={() => fetchFiles(pagination.current_page + 1, true)}
          >
            تحميل المزيد
          </Button>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        title="رفع ملف جديد"
      >
        <div className="mt-4">
          <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="font-medium mb-2">اسحب الملفات هنا أو اضغط للاختيار</p>
            <p className="text-sm text-muted-foreground mb-4">
              يدعم: PDF, DOC, XLS, JPG, PNG, MP4, MP3, ZIP
            </p>
            <Button variant="outline">
              اختيار ملف
            </Button>
          </div>
          <div className="flex items-center justify-end gap-3 pt-6">
            <Button variant="outline" onClick={() => setUploadModal(false)}>
              إلغاء
            </Button>
            <Button>
              رفع
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title="معاينة الملف"
      >
        {previewFile && (
          <div className="mt-4">
            <div className="flex items-center gap-4 mb-6">
              <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', getFileColor(detectMime(previewFile)))}>
                {(() => { const Icon = getFileIcon(detectMime(previewFile)); return <Icon className="w-6 h-6" />; })()}
              </div>
              <div>
                <p className="font-medium">{previewFile.file_name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(previewFile.file_size || 0)}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">النوع</span>
                <span>{detectMime(previewFile)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">المسار</span>
                <span className="font-mono text-xs">{previewFile.file_path}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">تاريخ الرفع</span>
                <span>{previewFile.created_at}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">المشاهدات</span>
                <span>{(previewFile.views_count || 0).toLocaleString('ar-EG')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">التنزيلات</span>
                <span>{(previewFile.download_count || 0).toLocaleString('ar-EG')}</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-6">
              <Button variant="outline" onClick={() => setPreviewFile(null)}>
                إغلاق
              </Button>
              <Button leftIcon={<Download className="w-4 h-4" />} onClick={() => window.open(downloadUrl(previewFile.id), '_blank')}>
                تحميل
              </Button>
            </div>
          </div>
        )}
      </Modal>
      
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="تأكيد الحذف"
      >
        <div className="mt-2">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-destructive/10">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">تأكيد الحذف</h3>
            <p className="text-muted-foreground">
              سيتم حذف
              <span className="mx-1 text-destructive font-semibold">{pendingDeleteIds.length}</span>
              ملف
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-6">
            <Button
              variant="success"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={() => setDeleteModalOpen(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={confirmDelete}
              isLoading={loading}
            >
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
