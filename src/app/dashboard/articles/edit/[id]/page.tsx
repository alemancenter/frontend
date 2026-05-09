'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import 'summernote/dist/summernote-lite.css';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  FileText,
  Tag,
  CheckCircle2,
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
import type { ArticleFormData } from '@/lib/api/services/articles';
import type { SchoolClass, Subject, Semester } from '@/types';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import { extractError } from '@/lib/utils';
import { triggerSitemapRegen, countryIdToDatabase } from '@/lib/triggerSitemap';
import { notificationService } from '@/lib/api/services/notifications';
import AccessDenied from '@/components/common/AccessDenied';

export default function EditArticlePage() {
  const { isAuthorized } = usePermissionGuard('manage articles');
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<'1' | '2' | '3' | '4'>('1');

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<string>('');
  const [summernoteReady, setSummernoteReady] = useState(false);
  const [useTitleForMeta, setUseTitleForMeta] = useState(false);
  const [useKeywordsForMeta, setUseKeywordsForMeta] = useState(false);
  const [isCheckingTitle, setIsCheckingTitle] = useState(false);
  const [isTitleDuplicate, setIsTitleDuplicate] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [initialTitle, setInitialTitle] = useState('');

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

  const generateMetaFromContent = (html: string, title: string, keywords?: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    const text = (tmp.textContent || tmp.innerText || '').trim();
    const base = text || title || (keywords || '');
    const normalized = base.replace(/\s+/g, ' ').trim();
    return normalized.length > 160 ? normalized.slice(0, 157) + '...' : normalized;
  };

  // Fetch initial data for edit
  useEffect(() => {
    if (!isAuthorized) return;
    const fetchEditData = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        // Fetch data from service
        // Response structure: { data: Article, classes: [], subjects: [], semesters: [], country: ... }
        const res: any = await articlesService.getEditData(id, selectedCountry);

        // The response might be wrapped in 'data' from BaseResource
        const articleData = res.data?.data || res.data;
        const classesData = res.data?.classes || res.classes || [];
        const subjectsData = res.data?.subjects || res.subjects || [];
        const semestersData = res.data?.semesters || res.semesters || [];

        if (articleData) {
            // Update lists
            setClasses(classesData);
            setSubjects(subjectsData);
            setSemesters(semestersData);

            // Extract attached file if exists
            const attachedFile = articleData.files && articleData.files.length > 0 ? articleData.files[0] : null;

            // Update form
            setFormData({
                country: String(articleData.country_id || '1'),
                grade_level: articleData.grade_level || articleData.class_id || 0,
                subject_id: articleData.subject_id || 0,
                semester_id: articleData.semester_id || 0,
                title: articleData.title || '',
                content: articleData.content || '',
                keywords: articleData.keywords ? (Array.isArray(articleData.keywords) ? articleData.keywords.map((k: any) => k.keyword).join(', ') : articleData.keywords) : '',
                file_category: attachedFile ? attachedFile.file_category : (articleData.file_category || 'study_plan'),
                file_name: attachedFile ? attachedFile.file_name : (articleData.file_name || ''),
                status: (articleData.status === true || articleData.status === 'true' || articleData.status === 1 || articleData.status === '1') || 
                        (articleData.is_published === true || articleData.is_published === 'true' || articleData.is_published === 1 || articleData.is_published === '1'),
                meta_description: articleData.meta_description
            });

            setInitialTitle(articleData.title || '');
            // Update selected country if different
            // Note: If we update selectedCountry, it might trigger other effects if they depend on it.
            // But here we are just setting state.
             if (articleData.country_id) {
               setSelectedCountry(String(articleData.country_id) as any);
             }
        }

      } catch (e) {
        console.error(e);
        // If error (e.g. not found), redirect or show error
      } finally {
        setIsLoading(false);
      }
    };
    fetchEditData();
  }, [id, selectedCountry, isAuthorized]); 
  // Removed selectedCountry from dependency to avoid infinite loop if we update selectedCountry inside.
  // We only fetch once on mount (or id change).

  // Refetch lists if country changes manually? 
  // In edit mode, usually you don't change country easily without resetting everything.
  // But let's keep the logic from create page for cascading dropdowns if user changes things.

  // When class changes, fetch subjects (only if changed by user, or if initial load didn't provide them)
  // The initial load provides subjects for the *current* class.
  // If user changes class, we need to fetch new subjects.
  useEffect(() => {
    if (!isAuthorized) return;
    if (isLoading) return; // Don't trigger during initial load setup
    const fetchSubjectsByClass = async () => {
      if (!formData.grade_level) {
        setSubjects([]);
        return;
      }
      // If we already have subjects and they match the class (how to verify?), we might skip.
      // But simplest is to fetch if grade_level changes.
      try {
        setLoadingSubjects(true);
        const res = await apiClient.get<{ data?: Subject[] }>(
          API_ENDPOINTS.FILTER.SUBJECTS_BY_CLASS(formData.grade_level),
          { country_id: selectedCountry }
        );
        const list = Array.isArray(res.data?.data) ? (res.data!.data as Subject[]) : [];
        setSubjects(list);
      } catch (e) {
        console.error(e);
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    // Only fetch if we are not in the middle of setting initial data... 
    // This effect runs when formData.grade_level changes.
    // On initial load, we set formData.grade_level. This triggers.
    // But we also setSubjects from initial load.
    // This might overwrite initial subjects with a new fetch. That's acceptable, as it ensures consistency.
    fetchSubjectsByClass();
  }, [formData.grade_level, selectedCountry, isLoading, isAuthorized]);

  // When subject changes, fetch semesters
  useEffect(() => {
    if (!isAuthorized) return;
    if (isLoading) return;
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
        const list = res.data?.data?.semesters ?? [];
        setSemesters(list);
      } catch (e) {
        console.error(e);
        setSemesters([]);
      } finally {
        setLoadingSemesters(false);
      }
    };
    fetchSemestersBySubject();
  }, [formData.subject_id, selectedCountry, isLoading, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    const t = setTimeout(async () => {
      const title = formData.title.trim();
      if (!title) {
        setIsTitleDuplicate(false);
        setIsCheckingTitle(false);
        return;
      }
      
      // Skip check if title hasn't changed
      if (title === initialTitle) {
        setIsTitleDuplicate(false);
        setIsCheckingTitle(false);
        return;
      }

      try {
        setIsCheckingTitle(true);
        const unique = await articlesService.isTitleUnique(title, selectedCountry);
        setIsTitleDuplicate(!unique);
      } catch {
        setIsTitleDuplicate(false);
      } finally {
        setIsCheckingTitle(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [formData.title, selectedCountry, initialTitle, isAuthorized]);

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
    if (!summernoteReady || !editorRef.current || isLoading) return;
    
    const jq = (window as any).jQuery || (window as any).$;
    if (!jq) return;

    const $editor = jq(editorRef.current);
    
    // Destroy existing if any (safe check)
    if ($editor.data('summernote')) {
        $editor.summernote('destroy');
    }

    $editor.summernote({
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
                    $editor.summernote('insertNode', a);
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
                        $editor.summernote('insertNode', a);
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
      styleTags: ['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4'],
      fontNames: ['Cairo', 'Tajawal', 'Almarai', 'Arial', 'Helvetica', 'Times New Roman', 'Courier New'],
      fontNamesIgnoreCheck: ['Cairo', 'Tajawal', 'Almarai'],
      disableDragAndDrop: true,
      dialogsInBody: true,
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
      callbacks: {
        onInit: () => {
          // Fix RTL issues manually
          const noteEditor = $editor.next('.note-editor');
          noteEditor.find('.note-toolbar').attr('dir', 'rtl').css('direction', 'rtl');
          noteEditor.find('.note-btn-group').css('direction', 'ltr');
          const editable = noteEditor.find('.note-editable');
          editable.attr('dir', 'rtl');
          editable.css('font-family', 'Cairo, Tajawal, Almarai, sans-serif');
          editable.css('text-align', 'right');
          editable.css('direction', 'rtl');
          noteEditor.find('.dropdown-menu').css('text-align', 'right');

          if (formData.content) {
              $editor.summernote('code', formData.content);
              contentRef.current = formData.content;
          }
        },
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
              $editor.summernote('insertNode', $img[0]);
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

    return () => {
      if ($editor.data('summernote')) {
        $editor.summernote('destroy');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summernoteReady, isLoading]); // Re-run when ready or loading finishes (to set content)

  // Update summernote code if content changes externally (e.g. from fetch)
  // But strictly, we only want to set it once on load.
  // The onInit callback handles the initial set.

  const handleAiGenerate = async () => {
    const title = formData.title.trim();
    if (!title || title.length < 3) {
      toast.error('يرجى إدخال عنوان المقالة أولاً (3 أحرف على الأقل)');
      return;
    }
    try {
      setIsGeneratingAi(true);
      const article = await articlesService.generateSEOArticle(title);
      if (article?.content_html) {
        // Set editor content
        contentRef.current = article.content_html;
        const jq = (window as any).jQuery || (window as any).$;
        if (jq && editorRef.current) {
          jq(editorRef.current).summernote('code', article.content_html);
        }
        // Auto-fill SEO fields only if they are currently empty
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

      // Calculate meta description if needed
      const computedMeta =
        useTitleForMeta
          ? formData.title
          : useKeywordsForMeta
            ? (formData.keywords || '')
            : (formData.meta_description && formData.meta_description.trim())
              ? formData.meta_description!.trim()
              : generateMetaFromContent(latestContent, formData.title, formData.keywords);

      await articlesService.update(id, { ...formData, content: latestContent, meta_description: computedMeta });
      triggerSitemapRegen(countryIdToDatabase(selectedCountry));
      notificationService.send({
        type: 'article_updated',
        title: `تحديث مقال: ${formData.title}`,
        message: `تم تحديث المقال "${formData.title}"`,
        action_url: `/${countryIdToDatabase(selectedCountry)}/lesson/articles/${id}`,
      });
      toast.success('تم تحديث المقال بنجاح');
      router.push('/dashboard/articles');
    } catch (e) {
      console.error(e);
      const errorInfo = extractError(e);
      
      let errorMessage = errorInfo.message || 'حدث خطأ أثناء تحديث المقال';
      
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

  // In edit mode, we only require title and content
  // class_id, subject_id, semester_id are already set from the loaded article
  const canSubmit =
    formData.title.trim().length > 0 &&
    formData.title.length <= 60;


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

  if (isLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>جاري تحميل بيانات المقالة...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button 
              onClick={() => router.push('/dashboard/articles')}
              className="p-1 hover:bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">تعديل المقالة</h1>
          </div>
          <p className="text-muted-foreground mr-8">عدّل المحتوى التعليمي، بيانات النشر، والمرفقات.</p>
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
            disabled={!canSubmit || isSubmitting || isTitleDuplicate}
            rightIcon={<Save className="w-4 h-4" />}
            className="px-6"
          >
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2 space-y-8"
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
                    : isCheckingTitle
                    ? 'جاري التحقق...'
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
                <span className="block text-sm font-medium mb-2">المحتوى</span>
                <div ref={editorRef} id="summernote" className="w-full bg-card" />
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
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  disabled={useTitleForMeta || useKeywordsForMeta}
                  placeholder="اكتب وصفاً جذاباً يظهر في نتائج البحث..."
                />
                
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
                            setFormData((prev) => ({ ...prev, meta_description: prev.keywords || '' }));
                          } else {
                            setFormData((prev) => ({ ...prev, meta_description: prev.meta_description || '' }));
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

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-6"
        >
          <Card className="border-border/50 shadow-sm overflow-hidden sticky top-6">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                    <Layout className="w-5 h-5" />
                </div>
                إعدادات النشر والتصنيف
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Publish Status Toggle */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 flex items-center justify-between">
                <div className="space-y-0.5">
                  <label htmlFor="publish-status" className="text-sm font-semibold block cursor-pointer">حالة النشر</label>
                  <p className="text-xs text-muted-foreground">تفعيل أو تعطيل ظهور المقالة للزوار</p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={formData.status}
                    aria-label="Toggle publish status"
                    onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
                    className={`relative inline-flex h-[28px] w-[52px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        formData.status ? 'bg-primary' : 'bg-input'
                    }`}
                >
                    <span
                        className={`pointer-events-none block h-6 w-6 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ${
                            formData.status ? 'translate-x-0' : '-translate-x-6'
                        }`}
                    >
                        {formData.status && <CheckCircle2 className="w-full h-full p-1 text-primary" />}
                    </span>
                </button>
              </div>

              <div className="space-y-3">
                <span className="block text-sm font-medium text-foreground">الدولة</span>
                <div className="grid grid-cols-2 gap-2">
                  {COUNTRIES.map((country) => (
                    <button
                      key={country.id}
                      type="button"
                      onClick={() => {
                          setSelectedCountry(country.id as any);
                          setFormData({ ...formData, country: country.id as any });
                      }}
                      className={`relative flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-bold transition-all border
                        ${selectedCountry === country.id 
                          ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20' 
                          : 'bg-card text-muted-foreground hover:bg-muted border-border hover:border-muted-foreground/30'
                        }
                      `}
                    >
                      {country.name}
                      {selectedCountry === country.id && (
                          <motion.div
                            layoutId="country-indicator"
                            className="absolute inset-0 border-2 border-primary rounded-xl"
                            transition={{ duration: 0.2 }}
                          />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <Select
                  id="grade_level"
                  name="grade_level"
                  label="الصف الدراسي"
                  options={classOptions}
                  value={formData.grade_level}
                  onChange={(e) => setFormData({ ...formData, grade_level: Number(e.target.value), subject_id: 0, semester_id: 0 })}
                  placeholder="اختر الصف..."
                  rightIcon={<BookOpen className="w-4 h-4" />}
                  required
                />

                <Select
                  id="subject_id"
                  name="subject_id"
                  label="المادة"
                  options={loadingSubjects ? [{ value: 'loading', label: 'جاري التحميل...' }] : subjectOptions}
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: Number(e.target.value), semester_id: 0 })}
                  placeholder="اختر المادة..."
                  disabled={loadingSubjects || !formData.grade_level}
                  required
                />

                <Select
                  id="semester_id"
                  name="semester_id"
                  label="الفصل الدراسي"
                  options={loadingSemesters ? [{ value: 'loading', label: 'جاري التحميل...' }] : semesterOptions}
                  value={formData.semester_id}
                  onChange={(e) => setFormData({ ...formData, semester_id: Number(e.target.value) })}
                  placeholder="اختر الفصل..."
                  disabled={loadingSemesters || !formData.subject_id}
                  rightIcon={<Calendar className="w-4 h-4" />}
                  required
                />
              </div>
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
                  setFormData((prev) => ({ ...prev, file_category: e.target.value }))
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData((prev) => ({
                          ...prev,
                          file,
                          file_name: file.name || prev.file_name || '',
                        }));
                      }
                    }}
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
                {formData.file_name && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      setFormData((prev) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { file, ...rest } = prev;
                        return { ...(rest as ArticleFormData), file_name: '' };
                      })
                    }
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
                    setFormData((prev) => ({ ...prev, file_name: e.target.value }))
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
