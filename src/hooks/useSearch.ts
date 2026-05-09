'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchParams {
  classId?: string;
  subjectId?: string;
  semester?: string;
  fileType?: string;
  keyword?: string;
}

interface SearchResult {
  id: string;
  title: string;
  type: 'post' | 'article' | 'lesson';
  description?: string;
  url: string;
}

export function useSearch() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (params: SearchParams) => {
    setIsSearching(true);
    setError(null);
    
    try {
      // بناء معلمات البحث
      const searchParams = new URLSearchParams();
      
      if (params.classId) searchParams.append('class', params.classId);
      if (params.subjectId) searchParams.append('subject', params.subjectId);
      if (params.semester) searchParams.append('semester', params.semester);
      if (params.fileType) searchParams.append('type', params.fileType);
      if (params.keyword) searchParams.append('q', params.keyword);
      
      // إذا كان هناك معلمات بحث، نقوم بالبحث
      if (searchParams.toString()) {
        // أولاً: جلب النتائج من API
        const response = await fetch(`/api/search?${searchParams.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setResults(data.results);
          // ثم الانتقال إلى صفحة النتائج
          router.push(`/search?${searchParams.toString()}`);
        } else {
          throw new Error(data.error || 'فشل في البحث');
        }
      }
      
    } catch (err) {
      setError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [router]);

  const quickSearch = useCallback((params: Omit<SearchParams, 'keyword'>) => {
    performSearch(params);
  }, [performSearch]);

  const keywordSearch = useCallback((keyword: string) => {
    performSearch({ keyword });
  }, [performSearch]);

  return {
    isSearching,
    results,
    error,
    performSearch,
    quickSearch,
    keywordSearch,
    clearResults: () => setResults([]),
    clearError: () => setError(null),
  };
}