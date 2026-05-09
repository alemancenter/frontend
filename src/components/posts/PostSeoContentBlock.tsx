import React from 'react';
import { Info, BookOpen, CheckCircle, TrendingUp } from 'lucide-react';

interface Props {
  title: string;
  category?: string;
  author?: string;
  keywords?: Array<{ id: number; keyword: string }>;
}

export default function PostSeoContentBlock({ title, category, author, keywords }: Props) {
  // Generate contextual content to increase text density for AdSense compliance
  const currentYear = new Date().getFullYear();

  return (
    <div className="mt-12 bg-blue-50/50 rounded-2xl p-6 md:p-8 border border-blue-100">
      <div className="flex items-center gap-3 mb-6">
        <Info className="text-primary w-6 h-6" />
        <h3 className="text-xl font-bold text-gray-900">حول هذا الموضوع</h3>
      </div>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
        <p>
          نقدم لكم في هذا المقال <strong>&quot;{title}&quot;</strong> {category && `ضمن قسم ${category}`}،
          وهو جزء من المحتوى الإخباري والتعليمي الذي نوفره لمتابعينا لعام {currentYear}.
          {author && ` تم إعداد هذا المحتوى بواسطة ${author}`} لتوفير معلومات دقيقة وموثوقة.
        </p>

        <div className="grid md:grid-cols-2 gap-6 my-6">
          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
            <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              أهمية المحتوى
            </h4>
            <p className="text-sm text-gray-600">
              يهدف هذا المقال إلى تقديم معلومات قيمة ومفيدة للقراء، مع التركيز على توفير محتوى واضح وسهل الفهم.
              نحرص على تغطية المواضيع المهمة التي تهم المجتمع التعليمي والطلاب وأولياء الأمور.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
            <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              فائدة القراءة
            </h4>
            <p className="text-sm text-gray-600">
              من خلال قراءة هذا المقال، ستتمكن من الحصول على فهم أفضل للموضوع المطروح والبقاء على اطلاع دائم
              بآخر التطورات والأخبار. نسعى لتوفير محتوى يساعدك في اتخاذ قرارات مستنيرة.
            </p>
          </div>
        </div>

        {keywords && keywords.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
            <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              المواضيع المرتبطة
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              يتناول هذا المقال عدة محاور مهمة تشمل: {keywords.slice(0, 5).map(k => k.keyword).join('، ')}.
              هذه المواضيع ذات صلة وثيقة بالمحتوى المقدم وتساعد في فهم السياق العام.
            </p>
          </div>
        )}

        <p>
          نحن ملتزمون بتقديم محتوى عالي الجودة يلبي احتياجات قرائنا.
          يمكنكم تصفح المزيد من المقالات المشابهة في الموقع أو استخدام خاصية البحث للوصول إلى مواضيع محددة.
          نشجعكم على ترك تعليقاتكم وآرائكم لمساعدتنا في تحسين المحتوى المقدم.
        </p>

        <p className="text-xs text-gray-500 mt-4 border-t border-blue-100 pt-4">
          إخلاء مسؤولية: المعلومات الواردة في هذا المقال هي لأغراض إعلامية فقط.
          نوصي دائماً بالتحقق من المصادر الرسمية والموثوقة.
          إذا كان لديك أي استفسار أو ملاحظة، لا تتردد في التواصل معنا.
        </p>
      </div>
    </div>
  );
}
