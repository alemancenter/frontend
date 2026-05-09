'use client';

import Link from 'next/link';
import { motion } from '@/lib/motion-lite';
import { ArrowRight, Calendar, User, Eye, Share2, Tag, Layers, Folder, Home, FileText, Paperclip, Download, MessageSquare, Edit3, Info, LogIn, UserPlus, Lock, CheckCircle } from 'lucide-react';
import { formatFileSize, getStorageUrl } from '@/lib/utils';
import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { postsService } from '@/lib/api/services';
import { commentsService } from '@/lib/api/services/comments';
import { useAuthStore } from '@/store/useStore';
import Image from '@/components/common/AppImage';
import Badge from '@/components/ui/Badge';
import PostSeoContentBlock from './PostSeoContentBlock';
import ResponsiveAd from '@/components/ads/ResponsiveAd';
import { useFrontSettings } from '@/components/front-settings/FrontSettingsProvider';
import { sanitizeRichHtml } from '@/lib/sanitize-html';
import { shouldShowAds, getAdLimit } from '@/lib/ads-policy';


interface PostViewProps {
  post: any;
  countryCode: string;
  currentUrl?: string;
  adSettings?: {
    googleAdsDesktop: string;
    googleAdsMobile: string;
    googleAdsDesktop2: string;
    googleAdsMobile2: string;
  };
}

function getPostFiles(post: any): any[] {
  if (Array.isArray(post?.attachments)) return post.attachments;
  if (Array.isArray(post?.files)) return post.files;
  return [];
}

function isPostImageFile(file: any): boolean {
  return String(file?.file_category || '').toLowerCase() === 'post_image';
}

function isPlaceholderImage(path: string | undefined): boolean {
  if (!path) return false;
  try {
    return new URL(path).hostname === 'via.placeholder.com';
  } catch {
    return false;
  }
}

function getPostImagePath(post: any): string | undefined {
  if (post?.image_url && !isPlaceholderImage(post.image_url)) return post.image_url;
  if (post?.image && !isPlaceholderImage(post.image)) return post.image;

  const imageFile = getPostFiles(post).find(isPostImageFile);
  const filePath = imageFile?.file_url || imageFile?.file_path;
  return isPlaceholderImage(filePath) ? undefined : filePath;
}

export default function PostView({ post, countryCode, adSettings }: PostViewProps) {
  const { isAuthenticated } = useAuthStore();
  const frontSettings = useFrontSettings();
  const adClient = (frontSettings?.adsense_client || '').toString();
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const [comments, setComments] = useState<any[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentSuccessMessage, setCommentSuccessMessage] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [freshPostFiles, setFreshPostFiles] = useState<any[] | null>(null);
  const [copied, setCopied] = useState(false);
  const featuredImagePath = getPostImagePath(post);
  const featuredImageSrc = getStorageUrl(featuredImagePath);
  const postAttachments = (freshPostFiles ?? getPostFiles(post)).filter((file) => !isPostImageFile(file));

  // Get current URL for sharing
  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  // Share handlers
  const shareOnFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(post.title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`${post.title}\n${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = getShareUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate content metrics for AdSense compliance
  const contentMetrics = useMemo(() => {
    const plainText = (post.content || '').replace(/<[^>]*>/g, '').trim();
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const charCount = plainText.length;
    return { wordCount, charCount, hasMinimumContent: wordCount >= 300 };
  }, [post.content]);

  const adPolicy = useMemo(() => {
    const showAds = shouldShowAds({
      hasApprovedContent: post.status !== 'draft' && post.status !== 'pending',
      contentLength: contentMetrics.charCount,
    });
    const adLimit = getAdLimit(contentMetrics.charCount);
    return { showAds, adLimit };
  }, [post.status, contentMetrics.charCount]);

  const { contentWithIds, toc } = useMemo(() => {
    let content = post.content || '';
    
    content = sanitizeRichHtml(content, [
      'www.youtube.com', 'youtube.com', 'youtube-nocookie.com',
      'player.vimeo.com', 'vimeo.com',
      'www.google.com', 'maps.google.com',
      'www.dailymotion.com', 'dailymotion.com',
    ]);

    const headers: { id: string, text: string, level: number }[] = [];
    let index = 0;
    
    content = content.replace(/<(h[23])([^>]*)>(.*?)<\/\1>/gi, (match: string, tag: string, attrs: string, text: string) => {
      const id = `section-${index++}`;
      const cleanText = text.replace(/<[^>]*>/g, '');
      headers.push({
        id,
        text: cleanText,
        level: parseInt(tag.substring(1))
      });
      return `<${tag} id="${id}"${attrs}>${text}</${tag}>`;
    });
    
    return { contentWithIds: content, toc: headers };
  }, [post.content]);

  // Increment view count
  useEffect(() => {
    const incrementView = async () => {
      try {
        const { API_ENDPOINTS } = await import('@/lib/api/config');
        const { apiClient } = await import('@/lib/api/client');

        await apiClient.post(API_ENDPOINTS.POSTS.INCREMENT_VIEW(post.id), {
          country: countryCode
        }, {
          cache: 'no-store'
        });
      } catch {
        // Silent fail - view counting is not critical
      }
    };

    incrementView();
  }, [post.id, countryCode]);

  // Fetch Related & Latest Posts
  useEffect(() => {
    const categoryId = post.category?.id || post.category_id;
    let isMounted = true;

    async function fetchData() {
      // Fetch Related
      if (categoryId) {
        try {
          const res = await postsService.getAll({
            category_id: categoryId,
            per_page: 6,
            country: countryCode
          }, { next: { revalidate: 3600 } } as any);

          // Filter out current post
          if (isMounted) {
            // Extract posts from response: { data: { data: [...] } }
            const apiRes = res as any;
            const apiData = apiRes?.data?.data || apiRes?.data || [];
            const filtered = (Array.isArray(apiData) ? apiData : []).filter((p: any) => p.id !== post.id).slice(0, 4);
            setRelatedPosts(filtered);
          }
        } catch (e) {
          console.error("Failed to fetch related posts", e);
        }
      }


    }
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [post.category, post.category_id, post.id, countryCode]);


  useEffect(() => {
    let cancelled = false;

    const refreshFiles = async () => {
      if (!post.id) return;
      try {
        const freshPost = await postsService.getById(post.id, countryCode);
        const files = getPostFiles(freshPost);
        if (!cancelled && files.length > 0) {
          setFreshPostFiles(files);
        }
      } catch {
        // Keep SSR data if the background refresh fails.
      }
    };

    refreshFiles();

    return () => {
      cancelled = true;
    };
  }, [post.id, countryCode]);


  // Fetch Comments
  useEffect(() => {
    setIsMounted(true);
    async function fetchComments() {
      if (!post.id) return;
      try {
        const res = await commentsService.getAll(countryCode, {
          commentable_id: post.id,
          commentable_type: 'App\\Models\\Post',
          per_page: 50
        });
        setComments(res.data || []);
      } catch (e) {
        console.error("Failed to fetch comments", e);
      }
    }
    fetchComments();
  }, [post.id, countryCode]);

  const handleCommentSubmit = async () => {
    if (!commentBody.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      await commentsService.create(countryCode, {
        body: commentBody,
        commentable_id: post.id,
        commentable_type: 'App\\Models\\Post'
      });

      setCommentBody('');
      setCommentSuccessMessage('تم إرسال التعليق وسيظهر بعد مراجعته.');
    } catch (e) {
      console.error("Failed to submit comment", e);
      alert('حدث خطأ أثناء إرسال التعليق. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* Modern Header Section - Professional Clean Design */}
      <div className="w-full bg-gradient-to-br from-slate-900 via-blue-900/90 to-indigo-900/80 border-b border-white/10 backdrop-blur-sm pt-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          {/* Breadcrumb - Modern Glass Style - Scrollable on Mobile */}
          <nav className="flex items-center gap-2 text-sm mb-6 sm:mb-10 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <Link 
              href="/" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-sm hover:bg-white hover:shadow-md transition-all duration-300 group whitespace-nowrap"
            >
              <Home size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-gray-800">الرئيسية</span>
            </Link>
            
            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-2 shrink-0" />
            
            <Link 
              href={`/${countryCode}/posts`} 
              className="px-4 py-2 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm hover:bg-white hover:shadow-md transition-all duration-300 font-medium text-gray-700 whitespace-nowrap"
            >
              المنشورات
            </Link>

            {post.category && (
              <>
                <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-2 shrink-0" />
                <Link 
                  href={`/${countryCode}/posts/category/${post.category.id}`} 
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-blue-200/30 shadow-sm hover:shadow-md transition-all duration-300 font-medium text-blue-700 whitespace-nowrap"
                >
                  {post.category.name}
                </Link>
              </>
            )}
          </nav>

          {/* Animated Title with Gradient - Responsive */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight mb-6 sm:mb-8 md:mb-10 tracking-tighter px-4 sm:px-0"
          >
            {post.title}
          </motion.h1>

          {/* Meta Information - Animated Glass Cards - Responsive */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-sm border-t border-white/20 pt-8 sm:pt-10 px-4 sm:px-0"
          >
            {/* Author - Animated - Responsive */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-lg border border-white/10 hover:shadow-xl transition-all duration-300 group cursor-pointer min-w-0 flex-shrink-0"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                <User size={16} className="sm:size-5" />
              </div>
              <div className="min-w-0" dir="auto">
                <p className="font-bold text-white text-xs sm:text-sm truncate">{post.author?.name || 'فريق التحرير'}</p>
                <p className="text-[10px] sm:text-xs text-blue-200">كاتب المقال</p>
              </div>
            </motion.div>

            {/* Date - Animated - Responsive */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-lg border border-white/10 hover:shadow-xl transition-all duration-300 group cursor-pointer min-w-0 flex-shrink-0"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                <Calendar size={16} className="sm:size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-xs sm:text-sm" suppressHydrationWarning>
                  {new Date(post.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-[10px] sm:text-xs text-green-200">تاريخ النشر</p>
              </div>
            </motion.div>

            {/* Views Counter - Unified Design - Responsive */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex items-center gap-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 backdrop-blur-md rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-lg border border-orange-400/30 hover:shadow-xl transition-all duration-300 group cursor-pointer min-w-0 flex-shrink-0"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                <Eye size={16} className="sm:size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-xs sm:text-sm">{post.views?.toLocaleString('ar-EG') || 0}</p>
                <p className="text-[10px] sm:text-xs text-orange-200">مشاهدة</p>
              </div>
            </motion.div>

            {/* Category - Animated - Responsive */}
            {post.category && (
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                className="flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-lg border border-purple-400/30 hover:shadow-xl transition-all duration-300 group cursor-pointer min-w-0 flex-shrink-0"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                  <Folder size={16} className="sm:size-5" />
                </div>
                <span className="font-semibold text-purple-200 text-xs sm:text-sm truncate">{post.category.name}</span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Modern Wave Shape Divider - Same as Lesson Page */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]" style={{ height: '80px' }}>
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            style={{ width: '100%', height: '80px', transform: 'rotate(180deg)' }}
          >
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              className="fill-white/95"
            />
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              className="fill-white/80"
            />
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
              className="fill-white/60"
            />
          </svg>
        </div>
      </div>

      {/* Main Content Section - Modern Design */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Content Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-8 space-y-8"
          >
            {/* Article Content */}
            <article className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 overflow-hidden transition-all duration-300 hover:shadow-2xl">
              {/* Featured Image */}
              {featuredImageSrc && (
                <div className="relative aspect-video w-full overflow-hidden group">
                  <Image
                    src={featuredImageSrc}
                    alt={post.title}
                    fill
                    priority
                    loading="eager"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 66vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}
              
              {/* Top Ad */}
              {isMounted && adPolicy.showAds && adPolicy.adLimit >= 1 && (
                <div className="px-8 md:px-10 mb-6">
                  <ResponsiveAd
                    adClient={adClient}
                    desktopCode={adSettings?.googleAdsDesktop || undefined}
                    mobileCode={adSettings?.googleAdsMobile || undefined}
                  />
                </div>
              )}

              <div className="p-8 md:p-10">
                {/* Table of Contents - Modern Design */}
                {toc.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl p-6 mb-10 border border-blue-100/50 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Layers className="w-4 h-4" />
                      </div>
                      محتويات المقال
                    </h3>
                    <nav>
                      <ul className="space-y-3">
                        {toc.map((item, idx) => (
                          <li key={idx} style={{ paddingRight: (item.level - 2) * 20 }} className="group">
                            <a
                              href={`#${item.id}`}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/80 transition-all duration-300 group-hover:shadow-sm border border-transparent group-hover:border-blue-100"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                              }}
                            >
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <ArrowRight className="w-3 h-3" />
                              </div>
                              <span className="text-gray-700 group-hover:text-blue-600 transition-colors font-medium">
                                {item.text}
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                )}

                {/* Content - Enhanced Styling with better spacing */}
                <div
                  className="rich-content prose prose-xl max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-headings:leading-tight prose-headings:mb-6 prose-headings:mt-8 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-lg prose-p:mb-6 prose-li:text-gray-700 prose-li:text-lg prose-li:mb-2 prose-blockquote:border-l-blue-600 prose-blockquote:bg-blue-50/50 prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-8 prose-img:rounded-2xl prose-img:shadow-xl prose-img:border prose-img:border-gray-200 prose-img:my-8 prose-table:shadow-sm prose-table:rounded-xl prose-th:bg-gray-50 prose-th:text-gray-900 prose-th:font-semibold prose-th:p-4 prose-td:p-4 min-h-[400px]"
                  dangerouslySetInnerHTML={{ __html: contentWithIds }}
                />

                {/* SEO Content Block - Adds contextual content for short posts (AdSense compliance) */}
                {!contentMetrics.hasMinimumContent && (
                  <PostSeoContentBlock
                    title={post.title}
                    category={post.category?.name}
                    author={post.author?.name}
                    keywords={Array.isArray(post.keywords) ? post.keywords : undefined}
                  />
                )}

                {/* Attachments - Premium Design */}
                {postAttachments.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-3xl p-4 sm:p-8 border border-blue-100/50 mb-10 mt-10 backdrop-blur-sm overflow-hidden">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Paperclip className="w-5 h-5" />
                      </div>
                      المرفقات والملفات
                    </h3>
                    <div className="grid gap-5">
                      {postAttachments.map((file: any, fileIndex: number) => (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * fileIndex }}
                          className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 rounded-2xl border border-gray-100/50 hover:shadow-xl transition-all duration-300 group shadow-sm hover:shadow-blue-100/50 w-full max-w-full overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-5 flex-1 min-w-0">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                                {file.file_type?.includes('pdf') ? <FileText size={24} /> : <Download size={24} />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-base sm:text-lg break-words leading-snug">
                                  {file.file_name}
                                </h4>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                                    {file.file_type || 'ملف'}
                                  </span>
                                  <span className="text-sm text-gray-500 font-medium whitespace-nowrap" dir="ltr">
                                    {formatFileSize(file.file_size)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isAuthenticated ? (
                              <Link
                                href={`/download/${file.id}`}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 hover:shadow-xl shrink-0 w-full sm:w-auto transform hover:scale-105"
                              >
                                <Download size={18} />
                                <span className="whitespace-nowrap">تحميل الملف</span>
                              </Link>
                            ) : (
                              <div className="shrink-0 flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2.5 rounded-xl text-sm font-medium w-full sm:w-auto justify-center">
                                <Lock size={15} />
                                <span>يتطلب تسجيل الدخول</span>
                              </div>
                            )}
                          </div>

                          {!isAuthenticated && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3">
                              <p className="text-xs text-gray-500 sm:flex-1">
                                سجّل الدخول أو أنشئ حساباً مجانياً للوصول إلى جميع الملفات
                              </p>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <Link
                                  href={`/login?return=${encodeURIComponent(pathname)}`}
                                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                                >
                                  <LogIn size={14} />
                                  تسجيل الدخول
                                </Link>
                                <Link
                                  href={`/register?return=${encodeURIComponent(pathname)}`}
                                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 border border-blue-600 text-blue-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-all"
                                >
                                  <UserPlus size={14} />
                                  إنشاء حساب
                                </Link>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags - Modern Design */}
                {post.keywords && (
                  <div className="mt-10 pt-10 border-t border-gray-200/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <Tag size={16} />
                      </div>
                      <span className="font-bold text-gray-900 text-lg">الكلمات الدلالية</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {(() => {
                        const kwList: { key: string; label: string; href: string }[] = [];
                        if (typeof post.keywords === 'string') {
                          post.keywords.split(/[,،;؛]+/).forEach((kw: string) => {
                            const label = kw.trim();
                            if (label) kwList.push({ key: label, label, href: `/${countryCode}/posts/keyword/${encodeURIComponent(label)}` });
                          });
                        } else if (Array.isArray(post.keywords)) {
                          post.keywords.forEach((k: any) => {
                            const label = k.keyword || k;
                            if (label) kwList.push({ key: k.id || label, label, href: `/${countryCode}/posts/keyword/${encodeURIComponent(label)}` });
                          });
                        }
                        return kwList.map(({ key, label, href }) => (
                          <Link
                            key={key}
                            href={href}
                            className="px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 text-purple-700 hover:text-purple-800 rounded-xl text-sm font-medium transition-all duration-300 border border-purple-100 hover:border-purple-200 hover:shadow-md"
                          >
                            {label}
                          </Link>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* Author Box - Premium Design */}
                <div className="mt-10 p-8 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-3xl border border-blue-100/50 backdrop-blur-sm flex items-start gap-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg">
                    {post.author?.name ? post.author.name[0].toUpperCase() : 'A'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">{post.author?.name || 'فريق التحرير'}</h4>
                    <p className="text-gray-600 leading-relaxed text-base">
                      كاتب ومحرر في منصة التعليم، متخصص في نشر المحتوى التعليمي والأكاديمي لمساعدة الطلاب والمعلمين.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Ad */}
              {isMounted && adPolicy.showAds && adPolicy.adLimit >= 2 && (
                <div className="px-8 md:px-10 mt-6">
                  <ResponsiveAd
                    adClient={adClient}
                    desktopCode={adSettings?.googleAdsDesktop2 || undefined}
                    mobileCode={adSettings?.googleAdsMobile2 || undefined}
                  />
                </div>
              )}
            </article>

            {/* Related Posts Section - Premium Design */}
            {relatedPosts.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="mt-16"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center text-white">
                      <FileText size={16} />
                    </div>
                    اقرأ أيضاً
                  </h3>
                  {post.category && (
                    <Link href={`/${countryCode}/posts/category/${post.category.id}`} className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors">
                      المزيد من {post.category.name}
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  {relatedPosts.map((related) => {
                    const relatedImageSrc = getStorageUrl(getPostImagePath(related));

                    return (
                      <motion.div
                        key={related.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * relatedPosts.indexOf(related) + 0.8 }}
                        className="group"
                      >
                        <Link
                          href={`/${countryCode}/posts/${related.id}`}
                          className="block bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden hover:shadow-xl transition-all duration-500 hover:border-blue-100/50"
                        >
                          <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden group-hover:from-blue-50 group-hover:to-purple-50 transition-all duration-500">
                            {relatedImageSrc ? (
                              <Image
                                src={relatedImageSrc}
                                alt={related.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 group-hover:text-blue-300 transition-colors">
                                <FileText size={48} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          <div className="p-6">
                            <h4 className="font-bold text-gray-900 line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors text-lg leading-tight">
                              {related.title}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                <Calendar size={12} />
                                {new Date(related.created_at).toLocaleDateString('ar-EG')}
                              </span>
                              <span className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                                <Eye size={12} />
                                {related.views}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Sidebar Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-4 space-y-8"
          >
            {/* About Category Widget */}
            {post.category && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Folder className="text-blue-600" size={20} />
                  عن القسم
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0 relative overflow-hidden">
                    {post.category.icon_image_url ? (
                       <Image src={post.category.icon_image_url} alt="" fill unoptimized sizes="48px" className="object-contain p-2" />
                    ) : (
                       <Layers size={24} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{post.category.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{post.category.description || 'تصفح جميع المنشورات في هذا القسم'}</p>
                  </div>
                </div>
                <Link 
                  href={`/${countryCode}/posts/category/${post.category.id}`}
                  className="block w-full py-2.5 text-center bg-gray-50 text-gray-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-medium text-sm"
                >
                  تصفح القسم
                </Link>
              </div>
            )}

            {/* Share Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Share2 className="text-blue-600" size={20} />
                مشاركة المنشور
              </h3>
              <div className="grid grid-cols-2 gap-3">
                 <button
                   onClick={shareOnFacebook}
                   className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#1877f2]/10 text-[#1877f2] rounded-lg hover:bg-[#1877f2] hover:text-white transition-all font-medium text-sm"
                 >
                   فيسبوك
                 </button>
                 <button
                   onClick={shareOnTwitter}
                   className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#1da1f2]/10 text-[#1da1f2] rounded-lg hover:bg-[#1da1f2] hover:text-white transition-all font-medium text-sm"
                 >
                   تويتر
                 </button>
                 <button
                   onClick={shareOnWhatsApp}
                   className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#25d366]/10 text-[#25d366] rounded-lg hover:bg-[#25d366] hover:text-white transition-all font-medium text-sm"
                 >
                   واتساب
                 </button>
                 <button
                   onClick={copyLink}
                   className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-600 hover:text-white transition-all font-medium text-sm"
                 >
                   {copied ? '✓ تم النسخ!' : 'نسخ الرابط'}
                 </button>
              </div>
            </div>
          </motion.div>

          {/* Comments Section - Modern Design */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="lg:col-span-8 space-y-8"
          >
            {/* Comments Container */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  التعليقات
                </h3>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {comments.length} تعليق
                </div>
              </div>

              {/* Add Comment Form */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl border border-blue-100/30">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  اكتب تعليقك
                </h4>
                
                {isMounted && isAuthenticated ? (
                  <>
                    <textarea 
                      id="comment-body"
                      name="comment-body"
                      value={commentBody}
                      onChange={(e) => {
                        setCommentBody(e.target.value);
                        setCommentSuccessMessage(null);
                      }}
                      placeholder="شاركنا رأيك حول هذا المنشور..."
                      className="w-full h-32 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    />
                    {commentSuccessMessage && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        <CheckCircle className="h-4 w-4" />
                        <span>{commentSuccessMessage}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-end mt-4">
                      <button 
                        onClick={handleCommentSubmit}
                        disabled={isSubmitting || !commentBody.trim()}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSubmitting ? 'جاري الإرسال...' : 'إرسال التعليق'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 bg-white/50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                      <Info className="w-5 h-5" />
                      <span>يجب تسجيل الدخول لإضافة تعليق</span>
                    </div>
                    <Link 
                      href="/login"
                      className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      تسجيل الدخول
                    </Link>
                  </div>
                )}
              </div>

              {/* Comments List */}
              {comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map((comment, idx) => (
                    <motion.div 
                      key={comment.id || `temp-comment-${idx}`}
                      id={comment.id ? `comment-${comment.id}` : undefined}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-100 transition-colors"
                    >
                      <div className="shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                          {comment.user?.name ? comment.user.name[0].toUpperCase() : 'U'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{comment.user?.name || 'مستخدم'}</span>
                            {(comment.user?.id === post.author?.id || comment.user?.id === post.author_id) && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">الكاتب</Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500" dir="ltr">
                            {new Date(comment.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{comment.body}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">لا توجد تعليقات بعد</h4>
                  <p className="text-gray-500 text-sm">كن أول من يعلق على هذا المنشور</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>

    </>
  );
}
