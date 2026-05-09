'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import 'summernote/dist/summernote-lite.css';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  FileText,
  Tag,
  CheckCircle2,
  Globe,
  Upload,
  X,
  Layout,
  BookOpen,
  Calendar,
  File,
  Sparkles,
  Loader2
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { articlesService, COUNTRIES, apiClient, API_ENDPOINTS } from '@/lib/api/services';
import type { SchoolClass, Subject, Semester } from '@/types';
import type { ArticleFormData } from '@/lib/api/services/articles';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { extractError } from '@/lib/utils';
import { triggerSitemapRegen, countryIdToDatabase } from '@/lib/triggerSitemap';
import { notificationService } from '@/lib/api/services/notifications';
import AccessDenied from '@/components/common/AccessDenied';

const META_MAX_LENGTH = 120;
const MAX_ARTICLE_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const normalizeMeta = (value: string) => value.replace(/\s+/g, ' ').trim();

const clampMeta = (value: string) => {
  const normalized = normalizeMeta(value);
  if (!normalized) return '';
  if (normalized.length <= META_MAX_LENGTH) return normalized;
  return normalized.slice(0, META_MAX_LENGTH).trim();
};

const formatAiWaitTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const generateMetaFromContent = (html: string, title: string, keywords?: string) => {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  const text = (doc.body?.textContent || '').trim();
  const base = text || title || (keywords || '');
  return clampMeta(base);
};

export default function CreateArticlePage() {
  const { isAuthorized } = usePermissionGuard('manage articles');
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<'1' | '2' | '3' | '4'>('1');

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const contentRef = useRef<string>('');
  const [summernoteReady, setSummernoteReady] = useState(false);
  const [useTitleForMeta, setUseTitleForMeta] = useState(false);
  const [useKeywordsForMeta, setUseKeywordsForMeta] = useState(false);
  const [isTitleDuplicate, setIsTitleDuplicate] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiElapsedSeconds, setAiElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isGeneratingAi) {
      setAiElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    setAiElapsedSeconds(0);
    const timer = window.setInterval(() => {
      setAiElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isGeneratingAi]);

  const handleAiGenerate = async () => {
    const title = formData.title.trim();
    if (!title || title.length < 3) {
      toast.error('يرجى إدخال عنوان المقالة أولاً (3 أحرف على الأقل)');
      return;
    }

    try {
      setIsGeneratingAi(true);
      const article = await articlesService.generateSEOArticle(title);
      const content = article?.content_html || '';

      if (content) {
        contentRef.current = content;

        // Update Summernote
        const jq = (window as any).jQuery || (window as any).$;
        if (jq && editorRef.current) {
          jq(editorRef.current).summernote('code', content);
        }

        // Auto-fill SEO fields only if currently empty
        setFormData((prev: ArticleFormData) => ({
          ...prev,
          ...((!prev.meta_description || prev.meta_description.trim() === '') && article.meta_description
            ? { meta_description: article.meta_description }
            : {}),
          ...((!prev.keywords || prev.keywords.trim() === '') && article.keywords?.length
            ? { keywords: article.keywords.join('، ') }
            : {}),
        }));

        toast.success('تم توليد المحتوى بنجاح');
      } else {
        toast.error('فشل توليد المحتوى');
      }
    } catch (error) {
      const errorInfo = extractError(error);
      toast.error(errorInfo.message || 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const [formData, setFormData] = useState<ArticleFormData>({
    country: '1',
    grade_level: 0,
    subject_id: 0,
    semester_id: 0,
    title: '',
    content: '',
    keywords: '',
    file_category: 'study_plan',
    file_name: '',
    status: true,
  });

  const classOptions = useMemo(
    () => classes.map((c) => ({ value: c.id, label: c.grade_name })),
    [classes]
  );

  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ value: s.id, label: s.subject_name })),
    [subjects]
  );

  const semesterOptions = useMemo(
    () => semesters.map((s) => ({ value: s.id, label: s.semester_name })),
    [semesters]
  );

  const fileCategoryOptions = [
    { value: 'study_plan', label: 'خطط الدراسة' },
    { value: 'worksheet', label: 'أوراق عمل' },
    { value: 'exam', label: 'اختبارات' },
    { value: 'book', label: 'كتب' },
    { value: 'record', label: 'السجلات' },
  ];

  const handleFileChange = (file: File | undefined) => {
    if (file && file.size > MAX_ARTICLE_FILE_SIZE) {
      toast.error('حجم الملف يتجاوز الحد المسموح (50 ميجابايت).');
      setFormData((prev) => ({
        ...prev,
        file: undefined,
        file_name: '',
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      file,
      file_name: file?.name || '',
    }));
  };


  useEffect(() => {
    if (!isAuthorized) return;
    const fetchCreateData = async () => {
      try {
        setIsLoading(true);
        const res = await articlesService.getCreateData(selectedCountry);
        setClasses(res.classes || []);
        setSubjects([]);
        setSemesters([]);
        setFormData((prev: ArticleFormData) => ({ ...prev, country: selectedCountry }));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCreateData();
  }, [selectedCountry, isAuthorized]);

useEffect(() => {
    if (!isAuthorized) return;
    const fetchSubjectsByClass = async () => {
      if (!formData.grade_level) {
        setSubjects([]);
        return;
      }
      try {
        setLoadingSubjects(true);
        const res = await apiClient.get<{ data?: Subject[] }>(
          API_ENDPOINTS.FILTER.SUBJECTS_BY_CLASS(formData.grade_level),
          { country_id: selectedCountry }
        );
        const list: Subject[] = Array.isArray(res.data?.data) ? (res.data!.data as Subject[]) : [];
        setSubjects(list);
      } catch (e) {
        console.error(e);
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjectsByClass();
  }, [formData.grade_level, selectedCountry, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    const fetchSemestersBySubject = async () => {
      if (!formData.subject_id) {
        setSemesters([]);
        return;
      }
      try {
        setLoadingSemesters(true);
        const res = await apiClient.get<{ data?: { semesters?: Semester[] } }>(
          API_ENDPOINTS.FILTER.SEMESTERS_BY_SUBJECT(formData.subject_id),
          { country_id: selectedCountry }
        );
        const list: Semester[] = res.data?.data?.semesters ?? [];
        setSemesters(list);
      } catch (e) {
        console.error(e);
        setSemesters([]);
      } finally {
        setLoadingSemesters(false);
      }
    };
    fetchSemestersBySubject();
  }, [formData.subject_id, selectedCountry, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    const t = setTimeout(async () => {
      const title = formData.title.trim();
      if (!title) {
        setIsTitleDuplicate(false);
        return;
      }
      try {
        const unique = await articlesService.isTitleUnique(title, selectedCountry);
        setIsTitleDuplicate(!unique);
      } catch {
        setIsTitleDuplicate(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [formData.title, selectedCountry, isAuthorized]);

  useEffect(() => {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Tajawal:wght@400;700&family=Almarai:wght@400;700&display=swap';
    document.head.appendChild(fontLink);
    (async () => {
      const jquery = (await import('jquery')).default;
      (window as any).$ = jquery;
      (window as any).jQuery = jquery;
      await import('summernote/dist/summernote-lite');
      await import('summernote/dist/lang/summernote-ar-AR');
      setSummernoteReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!summernoteReady || !editorRef.current) return;
    const jq = (window as any).jQuery || (window as any).$;
    if (!jq) return;
    const el = jq(editorRef.current);
    if (!el.data('summernote')) {
      el.summernote({
        height: 400,
        minHeight: 240,
        maxHeight: null,
        placeholder: 'اكتب المحتوى هنا...',
        lang: 'ar-AR',
        fontSizes: ['10', '12', '14', '16', '18', '24', '36'],
        buttons: {
          fileUpload: function () {
            const ui = (jq as any).summernote.ui;
            return ui.button({
              contents: '<span class="note-icon-link"></span>',
              tooltip: 'رفع ملف',
              click: async function () {
                const input = document.createElement('input');
                input.type = 'file';
                input.onchange = async () => {
                  const f = input.files && input.files[0];
                  if (!f) return;
                  const fd = new FormData();
                  fd.append('file', f);
                  try {
                    const resp = await fetch('/api/upload/file', { method: 'POST', body: fd });
                    const json = await resp.json();
                    const url = (json as any).url ?? (json as any).data?.url;
                    const name = (json as any).name ?? (json as any).data?.name ?? f.name;
                    if (url) {
                      const a = document.createElement('a');
                      a.href = url;
                      a.textContent = name;
                      a.target = '_blank';
                      el.summernote('insertNode', a);
                    }
                  } catch (err) {
                    const info = extractError(err);
                    if (info.status === 404) {
                      try {
                        const resp2 = await fetch('/api/upload/file', { method: 'POST', body: fd });
                        const json2 = await resp2.json();
                        const url2 = (json2 as any).url ?? (json2 as any).data?.url;
                        const name2 = (json2 as any).name ?? (json2 as any).data?.name ?? f.name;
                        if (url2) {
                          const a = document.createElement('a');
                          a.href = url2;
                          a.textContent = name2;
                          a.target = '_blank';
                          el.summernote('insertNode', a);
                        }
                        return;
                      } catch (e2) {
                        console.error('Upload file error (secure)', extractError(e2));
                      }
                    }
                    console.error('Upload file error', info);
                  }
                };
                input.click();
              },
            });
          },
        },
        toolbar: [
          ['style', ['style']],
          ['font', ['bold', 'italic', 'underline', 'clear']],
          ['fontname', ['fontname']],
          ['fontsize', ['fontsize']],
          ['color', ['color']],
          ['para', ['ul', 'ol', 'paragraph']],
          ['table', ['table']],
          ['insert', ['link', 'picture', 'video', 'fileUpload']],
          ['view', ['fullscreen', 'codeview', 'help']],
        ],
        popover: {
          image: [
            ['resize', ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone']],
            ['float', ['floatLeft', 'floatRight', 'floatNone']],
            ['remove', ['removeMedia']],
          ],
          link: [
            ['link', ['linkDialogShow', 'unlink']],
          ],
          table: [
            ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
            ['delete', ['deleteRow', 'deleteCol', 'deleteTable']],
          ],
          air: [
            ['color', ['color']],
            ['font', ['bold', 'underline', 'clear']],
            ['para', ['ul', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture']],
          ],
        },
        styleTags: ['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4'],
        fontNames: ['Cairo', 'Tajawal', 'Almarai', 'Arial', 'Helvetica', 'Times New Roman', 'Courier New'],
        fontNamesIgnoreCheck: ['Cairo', 'Tajawal', 'Almarai'],
        disableDragAndDrop: true,
        dialogsInBody: true,
        callbacks: {
          onChange: (contents: string) => {
            contentRef.current = contents;
          },
          onImageUpload: async (files: File[]) => {
            if (!files || !files.length) return;
            const file = files[0];
            const fd = new FormData();
            fd.append('file', file);
            fd.append('width', '1920');
            fd.append('quality', '85');
            fd.append('convert_to_webp', 'true');
            try {
              const resp = await fetch('/api/upload/image', {
                method: 'POST',
                body: fd,
                credentials: 'include'
              });
              const json = await resp.json();
              if (!resp.ok) {
                throw new Error(json.message || 'فشل رفع الصورة');
              }
              // Handle nested data structure: { data: { url: ... } } or { url: ... }
              const url = json?.data?.url ?? json?.url;
              console.log('[Upload] Response:', json, 'URL:', url);
              if (url) {
                // Create image element and insert it
                const $img = jq('<img>').attr({
                  src: url,
                  alt: file.name
                }).css({
                  'max-width': '100%',
                  'height': 'auto'
                });
                el.summernote('insertNode', $img[0]);
                console.log('[Upload] Image inserted successfully');
              } else {
                console.error('No URL returned from upload', json);
              }
            } catch (err) {
              console.error('Upload image error', extractError(err));
            }
          },
        },
      });
      
      // Fix RTL issues manually
      const noteEditor = el.next('.note-editor');
      noteEditor.find('.note-toolbar').attr('dir', 'rtl').css('direction', 'rtl');
      noteEditor.find('.note-btn-group').css('direction', 'ltr'); // Keep button groups internal layout if needed, or adjust
      const editable = noteEditor.find('.note-editable');
      editable.attr('dir', 'rtl');
      editable.css('font-family', 'Cairo, Tajawal, Almarai, sans-serif');
      editable.css('text-align', 'right');
      editable.css('direction', 'rtl');
      
      // Force dropdowns to align right
      noteEditor.find('.dropdown-menu').css('text-align', 'right');
      
      if (formData.content) {
        el.summernote('code', formData.content);
      }
    }
    return () => {
      try {
        el.summernote('destroy');
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summernoteReady]);

  useEffect(() => {
    if (useTitleForMeta) {
      setFormData((prev: ArticleFormData) => ({ ...prev, meta_description: clampMeta(prev.title) }));
    }
  }, [formData.title, useTitleForMeta]);

  useEffect(() => {
    if (useKeywordsForMeta) {
      setFormData((prev: ArticleFormData) => ({ ...prev, meta_description: clampMeta(prev.keywords || '') }));
    }
  }, [formData.keywords, useKeywordsForMeta]);

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

  const canSubmit =
    formData.title.trim() !== '' &&
    formData.title.length <= 60 &&
    !!formData.grade_level &&
    !!formData.subject_id &&
    !!formData.semester_id &&
    (formData.file_category || '').trim() !== '' &&
    !isTitleDuplicate;

  const handleSubmit = async () => {
    if (!canSubmit || isTitleDuplicate) return;
    const latestContent = contentRef.current ?? formData.content ?? '';
    const trimmedContent = latestContent.trim();
    if (!trimmedContent) {
      toast.error('يرجى إدخال محتوى المقال');
      return;
    }
    try {
      setIsSubmitting(true);
      const computedMeta =
        useTitleForMeta
          ? formData.title
          : useKeywordsForMeta
            ? (formData.keywords || '')
            : (formData.meta_description && formData.meta_description.trim())
              ? formData.meta_description!.trim()
              : generateMetaFromContent(latestContent, formData.title, formData.keywords);
      const safeMeta = clampMeta(computedMeta || '');
      const createdArticle = await articlesService.create({ ...formData, content: latestContent, meta_description: safeMeta || undefined });
      triggerSitemapRegen(countryIdToDatabase(selectedCountry));
      const countryCode = countryIdToDatabase(selectedCountry);
      notificationService.send({
        type: 'article_created',
        title: `مقال جديد: ${formData.title}`,
        message: `تم إنشاء مقال جديد بعنوان "${formData.title}"`,
        action_url: `/${countryCode}/lesson/articles/${(createdArticle as any)?.id || ''}`,
      });
      toast.success('تم إنشاء المقال بنجاح');
      router.push('/dashboard/articles');
    } catch (e) {
      console.error(e);
      const errorInfo = extractError(e);
      
      let errorMessage = errorInfo.message || 'حدث خطأ أثناء إنشاء المقال';
      
      if (errorInfo.errors && typeof errorInfo.errors === 'object') {
        const firstError = Object.values(errorInfo.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          errorMessage = firstError[0];
        } else if (typeof firstError === 'string') {
          errorMessage = firstError;
        }
      }
      
      toast.error(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <button 
               onClick={() => router.push('/dashboard/articles')}
               className="p-1 hover:bg-secondary rounded-lg transition-colors"
             >
               <ArrowLeft className="w-5 h-5 text-muted-foreground" />
             </button>
             <h1 className="text-3xl font-bold tracking-tight text-foreground">إنشاء مقال جديد</h1>
          </div>
          <p className="text-muted-foreground mr-8">أضف محتوى تعليمي جديد، مقال، أو ملف دراسي.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/articles')}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting || isLoading}
            disabled={!canSubmit || isSubmitting || isLoading}
            rightIcon={<Save className="w-4 h-4" />}
            className="px-6"
          >
            حفظ المقال
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <style>{`
            .note-modal-backdrop,
            .modal-backdrop {
              z-index: 10500 !important;
            }
            .note-modal,
            .modal {
              z-index: 10501 !important;
              pointer-events: auto;
            }
            .note-modal .modal-dialog,
            .modal .modal-dialog {
              pointer-events: auto;
            }
            .note-editor .dropdown-menu,
            .note-editor .note-dropdown-menu {
              z-index: 3000;
            }
            .note-editor .note-editable {
              direction: rtl;
              text-align: right;
              font-family: Cairo, Tajawal, Almarai, sans-serif;
              background-color: var(--color-background);
              color: var(--color-foreground);
            }
            .note-editor .note-codable {
              background-color: var(--color-background);
              color: var(--color-foreground);
            }
            .note-editor .note-placeholder {
              color: var(--color-muted-foreground);
            }
            .note-editor.note-frame {
              border: 1px solid hsl(var(--border));
              border-radius: 0.75rem;
              overflow: hidden;
            }
            .note-toolbar {
              background-color: hsl(var(--secondary) / 0.5) !important;
              border-bottom: 1px solid hsl(var(--border)) !important;
            }
            .note-statusbar {
              background-color: hsl(var(--secondary) / 0.3) !important;
              border-top: 1px solid hsl(var(--border)) !important;
            }
          `}</style>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle>تفاصيل المقال</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="عنوان المقال"
                id="article-title"
                name="title"
                placeholder="مثال: شرح درس قواعد اللغة العربية..."
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev: ArticleFormData) => ({ ...prev, title: e.target.value }))
                }
                error={
                  isTitleDuplicate 
                    ? 'هذا العنوان مستخدم مسبقاً' 
                    : formData.title.length > 60 
                      ? `العنوان طويل جداً (${formData.title.length}/60)` 
                      : undefined
                }
                required
                className="text-lg"
              />
              
              <div className="flex justify-end mt-2">
                <Button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isGeneratingAi}
                  className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white border-0 shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0] hover:bg-[position:200%_0] transition-[background-position] duration-[1500ms] ease-in-out" />
                  <div className="relative flex items-center gap-2">
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري صياغة المحتوى...</span>
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold tabular-nums">
                          انتظار {formatAiWaitTime(aiElapsedSeconds)}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>توليد المحتوى بالذكاء الاصطناعي</span>
                      </>
                    )}
                  </div>
                </Button>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="article-content" className="block text-sm font-medium mb-2">المحتوى</label>
                <textarea id="article-content" ref={editorRef} className="w-full bg-card" defaultValue={formData.content} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                <CardTitle>تحسين محركات البحث (SEO)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="article-meta-description" className="block text-sm font-medium">الوصف المختصر (Meta Description)</label>
                <textarea
                  id="article-meta-description"
                  name="meta_description"
                  value={formData.meta_description || ''}
                  onChange={(e) =>
                    setFormData((prev: ArticleFormData) => ({ ...prev, meta_description: e.target.value }))
                  }
                  maxLength={META_MAX_LENGTH}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  disabled={useTitleForMeta || useKeywordsForMeta}
                  placeholder="اكتب وصفاً جذاباً يظهر في نتائج البحث..."
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>الحد الأقصى {META_MAX_LENGTH} حرفًا</span>
                  <span>{normalizeMeta(formData.meta_description || '').length}/{META_MAX_LENGTH}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <label htmlFor="use-title-meta" className="inline-flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        id="use-title-meta"
                        type="checkbox"
                        checked={useTitleForMeta}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseTitleForMeta(checked);
                          if (checked) {
                            setUseKeywordsForMeta(false);
                            setFormData((prev: ArticleFormData) => ({ ...prev, meta_description: prev.title }));
                          } else {
                            setFormData((prev: ArticleFormData) => ({ ...prev, meta_description: prev.meta_description || '' }));
                          }
                        }}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-muted-foreground rounded transition-colors peer-checked:bg-primary peer-checked:border-primary" />
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">نسخ من العنوان</span>
                  </label>

                  <label htmlFor="use-keywords-meta" className="inline-flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        id="use-keywords-meta"
                        type="checkbox"
                        checked={useKeywordsForMeta}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseKeywordsForMeta(checked);
                          if (checked) {
                            setUseTitleForMeta(false);
                            setFormData((prev: ArticleFormData) => ({ ...prev, meta_description: prev.keywords || '' }));
                          } else {
                            setFormData((prev: ArticleFormData) => ({ ...prev, meta_description: prev.meta_description || '' }));
                          }
                        }}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-muted-foreground rounded transition-colors peer-checked:bg-primary peer-checked:border-primary" />
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">نسخ من الكلمات المفتاحية</span>
                  </label>
                </div>
              </div>

              <Input
                label="الكلمات المفتاحية"
                id="article-keywords"
                name="keywords"
                placeholder="أدخل كلمات مفتاحية مفصولة بفاصلة..."
                value={formData.keywords || ''}
                onChange={(e) =>
                  setFormData((prev: ArticleFormData) => ({ ...prev, keywords: e.target.value }))
                }
                rightIcon={<Tag className="w-4 h-4" />}
                helperText="تساعد الكلمات المفتاحية في تحسين ظهور المقال في محركات البحث."
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar Column */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <CardTitle>إعدادات النشر</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <span className="block text-sm font-medium">الدولة</span>
                <div className="grid grid-cols-2 gap-2">
                  {COUNTRIES.map((country) => (
                    <button
                      key={country.id}
                      onClick={() => setSelectedCountry(country.id as any)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border
                        ${selectedCountry === country.id 
                          ? 'bg-primary/10 text-primary border-primary/20 ring-1 ring-primary/20' 
                          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border-transparent'
                        }
                      `}
                    >
                      {country.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                <label htmlFor="article-status" className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium">حالة النشر</span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="article-status"
                      type="checkbox"
                      className="sr-only peer"
                      checked={!!formData.status}
                      onChange={(e) =>
                        setFormData((prev: ArticleFormData) => ({ ...prev, status: e.target.checked }))
                      }
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.status ? 'سيظهر المقال للزوار فور حفظه.' : 'سيتم حفظ المقال كمسودة ولن يظهر للزوار.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-primary" />
                <CardTitle>التصنيف</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="الصف الدراسي"
                id="article-class"
                name="grade_level"
                value={formData.grade_level || ''}
                onChange={(e) =>
                  setFormData((prev: ArticleFormData) => ({
                    ...prev,
                    grade_level: Number(e.target.value),
                    subject_id: 0,
                    semester_id: 0,
                  }))
                }
                options={classOptions}
                placeholder="اختر الصف"
                required
              />
              <Select
                label="المادة"
                id="article-subject"
                name="subject_id"
                value={formData.subject_id || ''}
                onChange={(e) =>
                  setFormData((prev: ArticleFormData) => ({
                    ...prev,
                    subject_id: Number(e.target.value),
                    semester_id: 0,
                  }))
                }
                options={
                  loadingSubjects
                    ? [{ value: 'loading', label: 'جاري التحميل...' }]
                    : subjectOptions
                }
                disabled={loadingSubjects || !formData.grade_level}
                placeholder="اختر المادة"
                required
                rightIcon={<BookOpen className="w-4 h-4" />}
              />
              <Select
                label="الفصل الدراسي"
                id="article-semester"
                name="semester_id"
                value={formData.semester_id || ''}
                onChange={(e) =>
                  setFormData((prev: ArticleFormData) => ({
                    ...prev,
                    semester_id: Number(e.target.value),
                  }))
                }
                options={
                  loadingSemesters
                    ? [{ value: 'loading', label: 'جاري التحميل...' }]
                    : semesterOptions
                }
                disabled={loadingSemesters || !formData.subject_id}
                placeholder="اختر الفصل"
                required
                rightIcon={<Calendar className="w-4 h-4" />}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <File className="w-5 h-5 text-primary" />
                <CardTitle>المرفقات</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="نوع الملف"
                id="article-file-category"
                name="file_category"
                value={formData.file_category}
                onChange={(e) =>
                  setFormData((prev: ArticleFormData) => ({ ...prev, file_category: e.target.value }))
                }
                options={fileCategoryOptions}
                required
              />

              <div className="space-y-2">
                <label htmlFor="article-file" className="text-sm font-medium">الملف المرفق</label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 hover:bg-secondary/20 transition-colors text-center cursor-pointer relative group">
                  <input
                    type="file"
                    id="article-file"
                    name="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    {formData.file_name ? (
                      <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {formData.file_name}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-foreground">اضغط لرفع ملف</p>
                        <p className="text-xs text-muted-foreground">PDF, Word, Excel, Images</p>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">الحد الأقصى لحجم الملف: 50 ميجابايت.</p>
                {formData.file_name && (
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                     onClick={() => handleFileChange(undefined)}
                   >
                     <X className="w-4 h-4 ml-2" />
                     إزالة الملف
                   </Button>
                )}
              </div>

              {formData.file_name && (
                <Input
                  label="اسم الملف الظاهر"
                  placeholder="اسم الملف كما سيظهر للمستخدم"
                  id="article-file-name"
                  name="file_name"
                  value={formData.file_name || ''}
                  onChange={(e) =>
                    setFormData((prev: ArticleFormData) => ({ ...prev, file_name: e.target.value }))
                  }
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
