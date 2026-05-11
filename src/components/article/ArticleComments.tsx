'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { MessageSquare, Edit3, Info, AlertTriangle, X, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';
import { commentsService } from '@/lib/api/services/comments';
import { Badge } from '@/components/ui/design-system';
import ProfileCompletionPrompt from '@/components/common/ProfileCompletionPrompt';

interface ArticleCommentsProps {
  articleId: number | string;
  countryCode: string;
  authorId?: number; // To highlight the author if they comment
}

export default function ArticleComments({ articleId, countryCode, authorId }: ArticleCommentsProps) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const isProfileComplete = !!(user?.country && user?.gender);
  const [isMounted, setIsMounted] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch Comments
  useEffect(() => {
    setIsMounted(true);
    async function fetchComments() {
      if (!articleId) return;
      try {
        const res = await commentsService.getAll(countryCode, {
          commentable_id: articleId,
          commentable_type: 'App\\Models\\Article',
          per_page: 50
        });
        setComments(res.data || []);
      } catch (e) {
        console.error("Failed to fetch comments", e);
      }
    }
    fetchComments();
  }, [articleId, countryCode]);

  const handleCommentSubmit = async () => {
    if (!commentBody.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      await commentsService.create(countryCode, {
        body: commentBody,
        commentable_id: Number(articleId),
        commentable_type: 'App\\Models\\Article'
      });

      setCommentBody('');
      setSuccessMessage('تم إرسال التعليق وسيظهر بعد مراجعته.');
    } catch (e: any) {
      // Extract error message from API response
      const apiMessage = e?.message || 'حدث خطأ أثناء إرسال التعليق. الرجاء المحاولة مرة أخرى.';
      setErrorMessage(apiMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.7 }}
      className="mt-12"
    >
      {/* Error Alert Modal */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setErrorMessage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">تنبيه</h3>
                  <p className="text-gray-600">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setErrorMessage(null)}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  حسناً
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          
          {isMounted && isAuthenticated && isProfileComplete ? (
            <>
              <textarea
                id="comment-body"
                name="comment-body"
                value={commentBody}
                onChange={(e) => {
                  setCommentBody(e.target.value);
                  setSuccessMessage(null);
                }}
                placeholder="شاركنا رأيك حول هذا المقال..."
                className="w-full h-32 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
              {successMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>{successMessage}</span>
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
          ) : isMounted && isAuthenticated ? (
            <ProfileCompletionPrompt
              description="يرجى تحديد دولتك وجنسك لتتمكن من التعليق على المقالات"
            />
          ) : (
            <div className="text-center py-6 bg-white/50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
                <Info className="w-5 h-5" />
                <span>يجب تسجيل الدخول لإضافة تعليق</span>
              </div>
              <Link
                href={`/login?return=${encodeURIComponent(pathname || '')}`}
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
                      {(authorId && comment.user?.id === authorId) && (
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
            <p className="text-gray-500 text-sm">كن أول من يعلق على هذا المقال</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

