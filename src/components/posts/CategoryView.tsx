'use client';

import Link from 'next/link';
import Image from '@/components/common/AppImage';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion } from '@/lib/motion-lite';
import { ArrowRight, Calendar, FileText, Folder, Eye, Home, ChevronLeft } from 'lucide-react';

interface CategoryViewProps {
  category: any;
  posts: any[];
  countryCode: string;
  pagination: {
    currentPage: number;
    totalPages: number;
  };
}

export default function CategoryView({ category, posts, countryCode, pagination }: CategoryViewProps) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 50 } }
  };

  const { currentPage, totalPages } = pagination;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', page.toString());
      router.push(`${pathname}?${params.toString()}`);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 font-sans">
      {/* Header Section matching ClassHeader.tsx */}
      <section 
        className="relative pt-32 pb-20 overflow-hidden"
        style={{ background: 'linear-gradient(226deg, #202c45 0%, #286aad 100%)' }}
      >
        {/* Background Pattern */}
        <div 
          className="absolute w-full h-full top-0 left-0" 
          style={{ background: 'linear-gradient(45deg, rgba(40, 106, 173, 0.1), transparent)' }}
        />

        {/* Animated Shapes */}
        <div 
          className="absolute rounded-full"
          style={{ 
            width: '300px', 
            height: '300px', 
            background: 'radial-gradient(circle, rgba(40, 106, 173, 0.1) 0%, transparent 70%)',
            top: '-150px',
            right: '-150px'
          }}
        />
        <div 
          className="absolute rounded-full"
          style={{ 
            width: '200px', 
            height: '200px', 
            background: 'radial-gradient(circle, rgba(40, 106, 173, 0.1) 0%, transparent 70%)',
            bottom: '-100px',
            left: '-100px'
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="inline-flex items-center justify-center mb-6"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                <Folder className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-white mb-6"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            >
              {category.name}
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 text-blue-100 text-lg"
            >
              <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center gap-2">
                <FileText size={16} />
                {posts.length} منشور
              </span>
            </motion.div>
          </div>
        </div>

        {/* Wave Shape Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]" style={{ height: '60px' }}>
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            style={{ width: '100%', height: '60px', transform: 'rotate(180deg)' }}
          >
            <path 
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
              fill="#f9fafb" 
            />
          </svg>
        </div>
      </section>

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 -mt-8 relative z-20 mb-12">
        <motion.nav 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-100/50 max-w-3xl mx-auto"
        >
          <ol className="flex items-center justify-center flex-wrap gap-2 text-sm text-slate-600 px-4 py-2">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50">
                <Home className="w-4 h-4" />
                <span>الرئيسية</span>
              </Link>
            </li>
            <ChevronLeft className="w-4 h-4 text-slate-300" />
            <li>
              <Link href={`/${countryCode}/posts`} className="hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50">
                المنشورات
              </Link>
            </li>
            <ChevronLeft className="w-4 h-4 text-slate-300" />
            <li className="font-bold text-slate-900 bg-slate-50 px-4 py-1.5 rounded-lg">
              {category.name}
            </li>
          </ol>
        </motion.nav>

        {/* Posts Grid */}
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </div>
              أحدث المنشورات
              <span className="text-sm font-normal text-slate-500 mr-2">
                (الصفحة {currentPage} من {totalPages})
              </span>
            </h3>
          </div>

          {posts.length > 0 ? (
            <>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
              {posts.map((post: any) => {
                  return (
                    <motion.div
                      key={post.id}
                      variants={itemVariants}
                      className="h-full"
                    >
                      <Link 
                        href={`/${countryCode}/posts/${post.id}`}
                        className={`group block bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-100/50 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col shadow-lg hover:shadow-blue-100/50`}
                      >
                        {/* Image/Icon Section */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
                          {post.image_url ? (
                            <Image 
                              src={post.image_url} 
                              alt={post.title}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <FileText size={48} />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 z-10">
                            <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-blue-600 text-xs font-bold rounded-lg border border-blue-100 shadow-sm">
                              جديد
                            </span>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-5 flex flex-col flex-1">
                          {/* Date & Views */}
                          <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(post.created_at).toLocaleDateString('ar-EG')}
                            </span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                            {post.views > 0 && (
                              <span className="flex items-center gap-1">
                                <Eye size={12} />
                                {post.views} مشاهدة
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {post.title}
                          </h3>

                          {/* Excerpt */}
                          <p className="text-slate-600 text-sm line-clamp-2 mb-4 flex-1">
                            {post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                          </p>

                          {/* Read More */}
                          <div className="flex items-center text-blue-600 text-sm font-bold mt-auto pt-4 border-t border-slate-100 group-hover:text-blue-700 transition-colors">
                            اقرأ المزيد
                            <ChevronLeft size={16} className="mr-auto group-hover:-translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center mt-16 gap-6">
                  <div className="flex items-center gap-2 p-1 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-100/50">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>السابق</span>
                    </button>

                    <div className="w-px h-8 bg-slate-200 mx-2" />

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Logic to show pages with ellipsis
                        // Always show first, last, current, and neighbors
                        const isFirst = page === 1;
                        const isLast = page === totalPages;
                        const isCurrent = page === currentPage;
                        const isNearCurrent = page >= currentPage - 1 && page <= currentPage + 1;
                        const isEllipsis = 
                          (page === currentPage - 2 && page > 1) || 
                          (page === currentPage + 2 && page < totalPages);

                        if (isFirst || isLast || isNearCurrent) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`w-12 h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
                                isCurrent
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50 scale-105'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (isEllipsis) {
                          return (
                            <span key={page} className="w-8 flex justify-center text-slate-300 select-none">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <div className="w-px h-8 bg-slate-200 mx-2" />

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <span>التالي</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-sm text-slate-500">
                    صفحة {currentPage} من {totalPages}
                  </div>
                </div>
              )}
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-100/50 shadow-lg"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Folder className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">القائمة فارغة</h3>
              <p className="text-slate-600 max-w-md mx-auto text-lg">
                لم يتم إضافة أي منشورات في هذا القسم بعد.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

