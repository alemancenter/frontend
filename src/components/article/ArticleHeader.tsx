import Link from 'next/link';
import { Calendar, Eye, User, BookOpen, ChevronLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  category: string;
  date: string;
  views: number;
  author?: string;
  subject?: string;
  className?: string;
  countryCode: string;
}

export default function ArticleHeader({ 
  title, 
  category, 
  date, 
  views, 
  author, 
  subject,
  className
}: Props) {
  return (
    <div className={cn("w-full bg-white border-b border-gray-100 pt-28", className)}>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home size={14} />
            <span>الرئيسية</span>
          </Link>
          
          <ChevronLeft size={14} className="text-gray-300" />
          
          {subject && (
            <>
              <span className="hover:text-primary transition-colors cursor-pointer">{subject}</span>
              <ChevronLeft size={14} className="text-gray-300" />
            </>
          )}
          
          <span className="text-primary font-medium bg-primary/5 px-2 py-0.5 rounded-full">{category}</span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-500 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={16} />
            </div>
            <span className="font-medium text-gray-900">{author || 'المسؤول'}</span>
          </div>

          <div className="w-px h-4 bg-gray-200 hidden md:block" />

          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span suppressHydrationWarning>{new Date(date).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <div className="flex items-center gap-2">
            <Eye size={16} />
            <span>{views} مشاهدة</span>
          </div>

          {subject && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
              <BookOpen size={14} />
              <span>{subject}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
