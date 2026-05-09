'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import Image from '@/components/common/AppImage';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import {
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  SortAsc, 
  SortDesc, 
  ArrowUpRight, 
  Clock, 
  TrendingUp, 
  LayoutGrid,
  ChevronLeft,
  Grid,
  List,
  X,
  FileText,
  ChevronsRight,
  ChevronRight,
  ChevronsLeft
} from 'lucide-react';
import { getStorageUrl } from '@/lib/utils';
import ResponsiveAd from '@/components/ads/ResponsiveAd';
import { useFrontSettings } from '@/components/front-settings/FrontSettingsProvider';
import { shouldShowAds } from '@/lib/ads-policy';

interface PostsIndexViewProps {
  initialPosts: any[];
  categories: any[];
  pagination: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from?: number;
    to?: number;
  };
  countryCode: string;
  error?: string;
  pageTitle?: string;
  selectedCategoryId?: string;
  adSettings?: {
    googleAdsDesktop: string;
    googleAdsMobile: string;
    googleAdsDesktop2: string;
    googleAdsMobile2: string;
  };
}

const SORT_OPTIONS = [
  { label: 'الأحدث', value: 'created_at:desc', icon: Clock },
  { label: 'الأقدم', value: 'created_at:asc', icon: Clock },
  { label: 'الأكثر مشاهدة', value: 'views:desc', icon: Eye },
  { label: 'الأبجدية (أ-ي)', value: 'title:asc', icon: SortAsc },
  { label: 'الأبجدية (ي-أ)', value: 'title:desc', icon: SortDesc },
];

export default function PostsIndexView({
  initialPosts,
  categories,
  pagination,
  countryCode,
  error,
  pageTitle,
  selectedCategoryId,
  adSettings
}: PostsIndexViewProps) {
  const frontSettings = useFrontSettings();
  const adClient = (frontSettings?.adsense_client || '').toString();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Local state for immediate UI feedback
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [categorySearch, setCategorySearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Filter categories
  const filteredCategories = categories.filter(cat =>  
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
  
  // Derived state from URL or Props
  const activeCategoryId = selectedCategoryId || searchParams.get('category_id');
  const currentSort = `${searchParams.get('sort_by') || 'created_at'}:${searchParams.get('sort_dir') || 'desc'}`;
  const currentPage = Number(searchParams.get('page')) || 1;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      if (searchQuery) {
        current.set('search', searchQuery);
      } else {
        current.delete('search');
      }

      const currentSearch = searchParams.get('search') || '';
      if (searchQuery !== currentSearch) {
        current.set('page', '1');
        startTransition(() => {
          // If we are on a category page (selectedCategoryId is set), 
          // performing a search might need to keep us on the same category or redirect to global search.
          // For now, let's keep the standard behavior which updates the URL.
          router.push(`${pathname}?${current.toString()}`);
        });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, router, pathname, searchParams]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });

    // Reset page on filter change (unless page is explicitly updated)
    if (!updates.page) {
      current.set('page', '1');
    }

    // Special handling for category updates when on a specific category route
    if (updates.category_id !== undefined) {
       // If user clicks "All" (null) or a different category, we should probably 
       // navigate to the main posts page or the new category page if we want to maintain the route structure.
       // However, simply updating query params works if the page component handles it.
       // But if we are at /posts/category/3 and user clicks category 4, 
       // updating query param ?category_id=4 might be confusing if the URL stays /posts/category/3.
       
       if (selectedCategoryId && updates.category_id !== selectedCategoryId) {
          // Navigate to the new category route or main posts page
          if (updates.category_id) {
             router.push(`/${countryCode}/posts/category/${updates.category_id}`);
          } else {
             router.push(`/${countryCode}/posts`);
          }
          return;
       }
    }

    startTransition(() => {
      router.push(`${pathname}?${current.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCategoryName = categories.find(c => c.id.toString() === activeCategoryId)?.name;
  const activeSortLabel = SORT_OPTIONS.find(o => o.value === currentSort)?.label;

  // Hero Post (First post on first page when no search/filter)
  const showHero = currentPage === 1 && !searchQuery && !activeCategoryId && initialPosts.length > 0;
  const heroPost = showHero ? initialPosts[0] : null;
  const gridPosts = showHero ? initialPosts.slice(1) : initialPosts;

  const showAds = shouldShowAds({ isSearchEmpty: gridPosts.length === 0 });

  return (
    <div className="min-h-screen bg-[#eef2ff] font-sans overflow-x-hidden" dir="rtl">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900/90 to-indigo-900/80 w-full">
        {/* Background Pattern */}
        <div className="absolute w-full h-full top-0 left-0 bg-gradient-to-r from-blue-600/10 via-transparent to-indigo-600/10" />

        {/* Animated Shapes */}
        <div 
          className="absolute rounded-full w-72 h-72 -top-36 -right-36 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20"
        />
        <div 
          className="absolute rounded-full w-48 h-48 -bottom-24 -left-24 bg-gradient-to-br from-blue-600/20 via-transparent to-indigo-600/20"
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-blue-600 text-sm font-medium mb-6 border border-blue-100 shadow-sm"
            >
              <TrendingUp size={16} />
              <span>المكتبة التعليمية الشاملة</span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight"
            >
              استكشف آلاف <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">الموارد التعليمية</span>
            </motion.h2>

            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 mx-auto max-w-2xl bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center"
              >
                <p className="text-lg font-medium mb-2">عذراً، حدث خطأ</p>
                <p className="text-sm opacity-80">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  إعادة المحاولة
                </button>
              </motion.div>
            ) : (
              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative max-w-2xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  id="main-search"
                  name="main-search"
                  type="text"
                  placeholder="ابحث في المنشورات والموارد التعليمية..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/95 backdrop-blur-sm border border-[#e2e8f0] rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </motion.div>
            )}
          </div>
        </div>

        {/* Modern Wave Shape Divider - Same as Other Pages */}
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
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* SEO Heading */}
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-8 leading-tight">
          {pageTitle || 'جميع المقالات'}
        </h1>

        {/* Featured Post Hero */}
        {heroPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 relative group"
          >
            <Link href={`/${countryCode}/posts/${heroPost.id}`} className="block relative rounded-3xl overflow-hidden bg-white shadow-xl shadow-blue-100/50 border border-[#e2e8f0] hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="relative h-64 lg:h-auto overflow-hidden">
                  <Image 
                    src={getStorageUrl(heroPost.image_url) || ''} 
                    alt={heroPost.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent lg:hidden" />
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-blue-600 rounded-lg text-sm font-bold border border-blue-200">
                      {heroPost.category?.name || 'عام'}
                    </span>
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <LayoutGrid size={120} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6 text-slate-500 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(heroPost.created_at).toLocaleDateString('ar-EG')}
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {(heroPost.views ?? heroPost.views_count ?? 0)} مشاهدة
                      </span>
                    </div>

                    <h2 className="text-3xl font-bold text-slate-900 mb-4 leading-tight group-hover:text-blue-600 transition-colors">
                      {heroPost.title}
                    </h2>

                    <p className="text-slate-600 text-lg mb-8 line-clamp-3 leading-relaxed">
                      {heroPost.meta_description || heroPost.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                    </p>

                    <div className="flex items-center text-blue-600 font-bold group/btn">
                      اقرأ المقال كاملاً
                      <ArrowUpRight className="mr-2 group-hover/btn:-translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-8">
            {/* Categories Widget */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e2e8f0] sticky top-24">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg">
                <Filter size={20} className="text-blue-600" />
                التصنيفات
                <span className="text-xs font-normal text-slate-400 mr-auto bg-slate-50 px-2 py-1 rounded-full">
                  {categories.length}
                </span>
              </h3>

              {/* Category Search */}
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  id="category-search"
                  name="category-search"
                  type="text"
                  placeholder="بحث في التصنيفات..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1 -mr-1">
                <button
                  onClick={() => updateFilters({ category_id: null })}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-sm group ${
                    !activeCategoryId 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="font-bold">الكل</span>
                  {!activeCategoryId ? (
                     <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  ) : (
                     <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[10px] group-hover:bg-white transition-colors">
                        {pagination.total}
                     </span>
                  )}
                </button>
                
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateFilters({ category_id: cat.id.toString() })}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-sm group ${
                        activeCategoryId === cat.id.toString()
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="font-medium text-right truncate pl-2">{cat.name}</span>
                      {activeCategoryId === cat.id.toString() ? (
                        <div className="w-1.5 h-1.5 bg-white rounded-full shrink-0" />
                      ) : (
                        (cat.news_count > 0 || cat.posts_count > 0) && (
                            <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[10px] group-hover:bg-white transition-colors shrink-0">
                                {cat.news_count || cat.posts_count}
                            </span>
                        )
                      )}
                    </button>
                  ))
                ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        لا توجد تصنيفات مطابقة
                    </div>
                )}
              </div>
            </div>

            {/* Dynamic Sidebar Ad */}
            {showAds && (
              <div className="mt-8">
                <ResponsiveAd
                  adClient={adClient}
                  desktopCode={adSettings?.googleAdsDesktop || undefined}
                  mobileCode={adSettings?.googleAdsMobile || undefined}
                />
              </div>
            )}
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#e2e8f0] mb-8 sticky top-0 z-30 lg:static">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className="lg:hidden p-2.5 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <Filter size={20} />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setIsSortOpen(!isSortOpen)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-700 transition-colors min-w-[160px] justify-between"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {(() => {
                          const option = SORT_OPTIONS.find((o) => o.value === currentSort);
                          const Icon = option?.icon;
                          return Icon ? (
                            <span className="text-slate-400">
                              <Icon size={16} />
                            </span>
                          ) : null;
                        })()}
                        {activeSortLabel}
                      </span>
                      <ChevronLeft size={16} className={`text-slate-400 transition-transform ${isSortOpen ? '-rotate-90' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isSortOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 z-20 py-2"
                          >
                            {SORT_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  const [sort_by, sort_dir] = option.value.split(':');
                                  updateFilters({ sort_by, sort_dir });
                                  setIsSortOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                                  currentSort === option.value
                                    ? 'bg-blue-50 text-blue-600 font-bold'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <option.icon size={16} />
                                {option.label}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="hidden sm:flex items-center text-sm text-slate-500">
                    عرض <span className="font-bold text-slate-900 mx-1">{pagination.from || 1}-{pagination.to || initialPosts.length}</span> من <span className="font-bold text-slate-900 mx-1">{pagination.total}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>

              {/* Active Filters Chips */}
              {(activeCategoryId || searchQuery) && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-400 ml-2">الفلاتر النشطة:</span>
                  {activeCategoryId && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
                      {activeCategoryName}
                      <button onClick={() => updateFilters({ category_id: null })} className="hover:text-blue-800">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {searchQuery && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold border border-purple-100">
                      بحث: {searchQuery}
                      <button onClick={() => setSearchQuery('')} className="hover:text-purple-800" aria-label="Clear search">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      updateFilters({ category_id: null, page: '1' });
                    }}
                    className="text-xs text-red-500 hover:text-red-700 underline mr-auto"
                  >
                    مسح الكل
                  </button>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className={`transition-opacity duration-200 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {gridPosts.length > 0 ? (
                <>
                  <div className={`grid gap-6 ${
                    viewMode === 'list' 
                      ? 'grid-cols-1' 
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                  }`}>
                    {gridPosts.map((post) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={post.id}
                      >
                        <Link 
                          href={`/${countryCode}/posts/${post.id}`}
                          className={`group block bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full ${
                            viewMode === 'list' ? 'flex flex-col md:flex-row min-h-[180px]' : 'flex flex-col'
                          }`}
                        >
                          {/* Image */}
                          <div className={`relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 ${
                            viewMode === 'list' ? 'w-full md:w-72 h-48 md:h-auto shrink-0' : 'aspect-[16/10] w-full'
                          }`}>
                            {post.image_url ? (
                              <Image
                                src={getStorageUrl(post.image_url) || ''}
                                alt={post.title}
                                fill
                                unoptimized
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <FileText size={48} />
                              </div>
                            )}
                            <div className="absolute top-3 right-3 z-10">
                              <span className="px-2 py-1 bg-white/95 backdrop-blur-sm text-blue-600 text-xs font-bold rounded-lg border border-blue-100 shadow-sm">
                                  {post.category?.name}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(post.created_at).toLocaleDateString('ar-EG')}
                              </span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="flex items-center gap-1">
                                <Eye size={12} />
                                {(post.views ?? post.views_count ?? 0)} مشاهدة
                              </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {post.title}
                            </h3>

                            <p className="text-slate-600 text-sm line-clamp-2 mb-4 flex-1">
                              {post.meta_description || post.content?.replace(/<[^>]*>/g, '').substring(0, 100)}...
                            </p>

                            <div className="flex items-center text-blue-600 text-sm font-bold mt-auto pt-4 border-t border-slate-100 group-hover:text-blue-700 transition-colors">
                              اقرأ المزيد
                              <ChevronLeft size={16} className="mr-auto group-hover:-translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* Dynamic Bottom Ad - After Posts Grid */}
                  <div className="mt-12">
                    <ResponsiveAd
                      adClient={adClient}
                      desktopCode={adSettings?.googleAdsDesktop2 || undefined}
                      mobileCode={adSettings?.googleAdsMobile2 || undefined}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-[#e2e8f0]">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">لا توجد نتائج</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-8">لم نتمكن من العثور على ما تبحث عنه. حاول تغيير كلمات البحث أو إزالة بعض الفلاتر.</p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      updateFilters({ category_id: null, page: '1' });
                    }}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-200"
                  >
                    عرض جميع المنشورات
                  </button>
                </div>
              )}

              {/* Advanced Pagination */}
              {pagination.last_page > 1 && (
                <div className="mt-16 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-2 rounded-2xl shadow-sm border border-white/10">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.current_page === 1}
                      className="p-2.5 hover:bg-slate-50 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors"
                      title="الصفحة الأولى"
                    >
                      <ChevronsRight size={18} />
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                      className="p-2.5 hover:bg-slate-50 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors"
                      title="الصفحة السابقة"
                    >
                      <ChevronRight size={18} />
                    </button>
                    
                    <div className="h-6 w-px bg-slate-200 mx-2" />

                    {(() => {
                        const range = [];
                        const delta = 2;
                        for (let i = Math.max(2, pagination.current_page - delta); i <= Math.min(pagination.last_page - 1, pagination.current_page + delta); i++) {
                            range.push(i);
                        }

                        if (pagination.current_page - delta > 2) range.unshift('...');
                        if (pagination.current_page + delta < pagination.last_page - 1) range.push('...');

                        range.unshift(1);
                        if (pagination.last_page > 1) range.push(pagination.last_page);

                        return range.map((pageNum, idx) => (
                            pageNum === '...' ? (
                                <span key={`dots-${idx}`} className="px-2 text-slate-400">...</span>
                            ) : (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum as number)}
                                    className={`min-w-[40px] h-10 px-2 rounded-xl font-bold transition-all ${
                                        pagination.current_page === pageNum
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                            : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            )
                        ));
                    })()}

                    <div className="h-6 w-px bg-slate-200 mx-2" />

                    <button
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="p-2.5 hover:bg-slate-50 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors"
                      title="الصفحة التالية"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.last_page)}
                      disabled={pagination.current_page === pagination.last_page}
                      className="p-2.5 hover:bg-slate-50 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors"
                      title="الصفحة الأخيرة"
                    >
                      <ChevronsLeft size={18} />
                    </button>
                  </div>
                  
                  <div className="text-slate-400 text-sm">
                    الصفحة {pagination.current_page} من {pagination.last_page}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-80 bg-white/95 backdrop-blur-sm z-50 shadow-2xl lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-900">تصفية النتائج</h3>
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Filter size={18} className="text-blue-600" />
                      الأقسام
                    </h4>

                    {/* Mobile Category Search */}
                    <div className="relative mb-4">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        id="mobile-category-search"
                        name="mobile-category-search"
                        type="text"
                        placeholder="بحث في التصنيفات..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                      <button
                        onClick={() => {
                          updateFilters({ category_id: null });
                          setIsFilterOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl ${
                          !activeCategoryId ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'
                        }`}
                      >
                        الكل
                      </button>
                      {filteredCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            updateFilters({ category_id: cat.id.toString() });
                            setIsFilterOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl ${
                            activeCategoryId === cat.id.toString() 
                              ? 'bg-blue-50 text-blue-600 font-bold' 
                              : 'text-slate-600'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

