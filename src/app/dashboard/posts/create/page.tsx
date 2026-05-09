'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import 'summernote/dist/summernote-lite.css';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Save, FileText, Tag, Image as ImageIcon, Upload, Loader2, Sparkles } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { postsService, categoriesService, articlesService, COUNTRIES, apiClient } from '@/lib/api/services';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';
import { extractError } from '@/lib/utils';
import { triggerSitemapRegen, countryIdToDatabase } from '@/lib/triggerSitemap';
import { notificationService } from '@/lib/api/services/notifications';

export default function CreatePostPage() {
  const { isAuthorized } = usePermissionGuard('manage posts');
  const router = useRouter();

  const editorRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<string>('');
  const [summernoteReady, setSummernoteReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<'1' | '2' | '3' | '4'>('1');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [isTitleDuplicate, setIsTitleDuplicate] = useState(false);
  const [isCheckingTitle, setIsCheckingTitle] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiElapsedSeconds, setAiElapsedSeconds] = useState(0);

  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    category_id: number | string;
    meta_description?: string;
    keywords?: string;
    is_active?: boolean;
    is_featured?: boolean;
    image?: File;
    attachments?: File[];
  }>({
    title: '',
    content: '',
    category_id: 0,
    meta_description: '',
    keywords: '',
    is_active: true,
    is_featured: false,
    image: undefined,
    attachments: [],
  });

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

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
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const res: unknown = await categoriesService.getAll({
          country: selectedCountry,
          per_page: 100,
        });
        const data = (res as any)?.data?.data ?? (Array.isArray(res) ? res : (res as any)?.data ?? []);
        const list = (Array.isArray(data) ? data : []).map((c: any) => ({ id: Number(c.id), name: String(c.name) }));
        setCategories(list);
        setFormData((prev) => ({ ...prev, category_id: list[0]?.id || 0 }));
      } catch {
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, [selectedCountry]);

  useEffect(() => {
    if (!isAuthorized) return;
    const t = setTimeout(async () => {
      const title = formData.title.trim();
      if (!title) {
        setIsTitleDuplicate(false);
        return;
      }
      setIsCheckingTitle(true);
      try {
        const unique = await postsService.isTitleUnique(title, selectedCountry);
        setIsTitleDuplicate(!unique);
      } catch {
        setIsTitleDuplicate(false);
      } finally {
        setIsCheckingTitle(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [formData.title, selectedCountry, isAuthorized]);

  useEffect(() => {
    if (!summernoteReady || !editorRef.current || isLoading) return;
    const jq = (window as any).jQuery || (window as any).$;
    if (!jq) return;
    const el = jq(editorRef.current);
    if (!el.data('summernote')) {
      el.summernote({
        height: 420,
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
                      console.error(e2);
                    }
                  }
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
              console.error('Upload image error', err);
            }
          },
        },
      });

      const noteEditor = el.next('.note-editor');
      noteEditor.find('.note-toolbar').attr('dir', 'rtl').css('direction', 'rtl');
      noteEditor.find('.note-btn-group').css('direction', 'ltr');
      const editable = noteEditor.find('.note-editable');
      editable.attr('dir', 'rtl');
      editable.css('font-family', 'Cairo, Tajawal, Almarai, sans-serif');
      editable.css('text-align', 'right');
      editable.css('direction', 'rtl');
      noteEditor.find('.dropdown-menu').css('text-align', 'right');
    }

    const currentRef = editorRef.current;
    return () => {
      try {
        if (currentRef) {
          (window as any).jQuery(currentRef).summernote('destroy');
        }
      } catch {}
    };
  }, [summernoteReady, isLoading]);

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
    !!formData.category_id &&
    !isTitleDuplicate;

  const formatAiWaitTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isGeneratingAi) { setAiElapsedSeconds(0); return; }
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
      toast.error('يرجى إدخال عنوان المنشور أولاً (3 أحرف على الأقل)');
      return;
    }

    try {
      setIsGeneratingAi(true);
      const article = await articlesService.generateSEOArticle(title, 'post');
      const content = article?.content_html || article?.content || '';

      if (content) {
        contentRef.current = content;
        const jq = (window as any).jQuery || (window as any).$;
        if (jq && editorRef.current) {
          jq(editorRef.current).summernote('code', content);
        }

        setFormData((prev) => ({
          ...prev,
          ...(!prev.meta_description?.trim() && article.meta_description
            ? { meta_description: article.meta_description }
            : {}),
          ...(!prev.keywords?.trim() && article.keywords?.length
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
    const latestContent = contentRef.current || formData.content;
    if (!latestContent.trim()) {
      toast.error('يرجى إدخال محتوى المنشور');
      return;
    }
    try {
      setIsSubmitting(true);
      const createdPost = await postsService.create({
        country: selectedCountry,
        title: formData.title,
        content: latestContent,
        category_id: Number(formData.category_id),
        meta_description: formData.meta_description || undefined,
        keywords: formData.keywords || undefined,
        is_active: !!formData.is_active,
        is_featured: !!formData.is_featured,
        image: formData.image,
        attachments: formData.attachments,
      });
      triggerSitemapRegen(countryIdToDatabase(selectedCountry));
      const countryCode = countryIdToDatabase(selectedCountry);
      notificationService.send({
        type: 'post_created',
        title: `منشور جديد: ${formData.title}`,
        message: `تم نشر منشور جديد بعنوان "${formData.title}"`,
        action_url: `/${countryCode}/posts/${(createdPost as any)?.id || ''}`,
      });
      toast.success('تم إنشاء المنشور بنجاح');
      router.push('/dashboard/posts');
    } catch (e) {
      console.error(e);
      const errorInfo = extractError(e);
      
      let errorMessage = errorInfo.message || 'حدث خطأ أثناء إنشاء المنشور';
      
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value as '1' | '2' | '3' | '4')}
            options={COUNTRIES.map((c) => ({ value: c.id, label: c.name }))}
            className="w-48"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/posts')}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting || isLoading}
            disabled={!canSubmit || isSubmitting || isLoading}
            rightIcon={<Save className="w-4 h-4" />}
            className="px-6"
          >
            حفظ المنشور
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <style>{`
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
                <CardTitle>تفاصيل المنشور</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="عنوان المنشور"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="أدخل عنوان المنشور"
                error={
                  isTitleDuplicate 
                    ? 'هذا العنوان مستخدم مسبقاً' 
                    : isCheckingTitle 
                      ? 'جاري التحقق...' 
                      : formData.title.length > 60 
                        ? `العنوان طويل جداً (${formData.title.length}/60)` 
                        : undefined
                }
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
                        <span>انتظار {formatAiWaitTime(aiElapsedSeconds)}</span>
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
                <CardTitle>تحسين محركات البحث</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Select
                label="الفئة"
                value={formData.category_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, category_id: Number((e.target as any).value) }))}
                options={categoryOptions}
              />
              <Input
                label="الوصف التعريفي"
                value={formData.meta_description || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))}
                placeholder="وصف قصير يظهر لمحركات البحث (اختياري)"
              />
              <Input
                label="الكلمات المفتاحية"
                value={formData.keywords || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, keywords: e.target.value }))}
                placeholder="اكتب كلمات مفصولة بفاصلة ، مثل: تعليم، دراسة"
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!formData.is_active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="sr-only peer"
                    id="post-active"
                  />
                  <label htmlFor="post-active" className="relative inline-flex items-center cursor-pointer">
                    <div className="w-11 h-6 bg-muted rounded-full transition-colors peer-checked:bg-primary relative">
                      <span className="absolute top-[2px] right-[2px] h-5 w-5 rounded-full bg-white border border-border transition-all peer-checked:right-[22px]"></span>
                    </div>
                  </label>
                  <span className={`text-sm ${formData.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                    {formData.is_active ? 'نشط' : 'معطل'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!formData.is_featured}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_featured: e.target.checked }))}
                    className="sr-only peer"
                    id="post-featured"
                  />
                  <label htmlFor="post-featured" className="relative inline-flex items-center cursor-pointer">
                    <div className="w-11 h-6 bg-muted rounded-full transition-colors peer-checked:bg-primary relative">
                      <span className="absolute top-[2px] right-[2px] h-5 w-5 rounded-full bg-white border border-border transition-all peer-checked:right-[22px]"></span>
                    </div>
                  </label>
                  <span className={`text-sm ${formData.is_featured ? 'text-info' : 'text-muted-foreground'}`}>
                    {formData.is_featured ? 'مميز' : 'غير مميز'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                <CardTitle>الصورة الرئيسية</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.files?.[0] }))}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                <CardTitle>مرفقات</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                type="file"
                multiple
                onChange={(e) => setFormData((prev) => ({ ...prev, attachments: Array.from(e.target.files || []) }))}
                className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

