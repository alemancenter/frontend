import Link from 'next/link';
import { Calendar, ArrowLeft } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  created_at: string;
  visit_count: number;
}

interface Props {
  articles: Article[];
  countryCode: string;
}

export default function RelatedArticles({ articles, countryCode }: Props) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-r-4 border-primary pr-3">
        مقالات ذات صلة
      </h3>
      <div className="space-y-4">
        {articles.map((article) => (
          <Link 
            key={article.id} 
            href={`/${countryCode}/lesson/articles/${article.id}`}
            className="group block border-b border-gray-50 last:border-0 pb-4 last:pb-0"
          >
            <h4 className="font-medium text-gray-800 group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {article.title}
            </h4>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{new Date(article.created_at).toLocaleDateString('ar-JO')}</span>
              </div>
              <ArrowLeft size={14} className="text-gray-300 group-hover:text-primary -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
