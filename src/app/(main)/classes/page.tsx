'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from '@/lib/motion-lite';
import {
  GraduationCap,
  BookOpen,
  ChevronLeft,
  Loader2,
  Globe,
  Search,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { CustomSelect } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, COUNTRIES } from '@/lib/api/config';

interface SchoolClass {
  id: number;
  grade_name: string;
  grade_level: number;
  slug?: string;
  subjects_count?: number;
  description?: string;
}

export default function ClassesPage() {
  const [selectedDatabase, setSelectedDatabase] = useState<string>('jo');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<{ data: SchoolClass[] } | SchoolClass[]>(
        API_ENDPOINTS.FRONTEND.CLASSES,
        { database: selectedDatabase }
      );

      // Handle both response formats
      const data = response.data;
      if (Array.isArray(data)) {
        setClasses(data);
      } else if (data && 'data' in data) {
        setClasses(data.data);
      } else {
        setClasses([]);
      }
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل الصفوف الدراسية');
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDatabase]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const filteredClasses = classes.filter((cls) =>
    cls.grade_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const databaseOptions = COUNTRIES.map((country) => ({
    value: country.code,
    label: country.name,
    icon: <Globe className="w-4 h-4" />,
  }));

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Grade level colors
  const getGradientColor = (level: number) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-amber-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-violet-500',
      'from-teal-500 to-cyan-500',
      'from-fuchsia-500 to-pink-500',
      'from-lime-500 to-green-500',
      'from-sky-500 to-blue-500',
      'from-amber-500 to-yellow-500',
      'from-rose-500 to-red-500',
    ];
    return colors[(level - 1) % colors.length];
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">الصفوف الدراسية</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              اختر الصف الدراسي للوصول إلى المواد والملفات التعليمية
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="container mx-auto px-4 -mt-8">
        <Card className="shadow-lg">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 w-full">
                <Input
                  placeholder="ابحث عن صف دراسي..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              {/* Database Selector */}
              <div className="w-full md:w-48">
                <CustomSelect
                  options={databaseOptions}
                  value={selectedDatabase}
                  onChange={(value) => setSelectedDatabase(value as string)}
                  placeholder="اختر الدولة"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Grid */}
      <div className="container mx-auto px-4 mt-12">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <span className="text-muted-foreground">جاري تحميل الصفوف...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <p className="text-error mb-4">{error}</p>
              <button
                onClick={loadClasses}
                className="text-primary hover:underline"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد صفوف دراسية'}
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredClasses.map((cls) => (
              <motion.div key={cls.id} variants={itemVariants}>
                <Link href={`/classes/${cls.id}?database=${selectedDatabase}`}>
                  <Card
                    hover
                    className="h-full group cursor-pointer overflow-hidden"
                  >
                    <div
                      className={cn(
                        'h-2 bg-gradient-to-r',
                        getGradientColor(cls.grade_level)
                      )}
                    />
                    <CardHeader className="pt-6">
                      <div className="flex items-center justify-between">
                        <div
                          className={cn(
                            'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xl shadow-lg',
                            getGradientColor(cls.grade_level)
                          )}
                        >
                          {cls.grade_level}
                        </div>
                        <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:-translate-x-1 transition-all" />
                      </div>
                      <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                        {cls.grade_name}
                      </CardTitle>
                      {cls.description && (
                        <CardDescription className="line-clamp-2">
                          {cls.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4" />
                        <span>
                          {cls.subjects_count || 0} مادة دراسية
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

