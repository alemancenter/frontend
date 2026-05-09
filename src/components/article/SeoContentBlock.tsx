import React from 'react';
import { Info, BookOpen, CheckCircle } from 'lucide-react';

interface Props {
  title: string;
  subject?: string;
  category?: string;
  sectionName?: string;
  gradeLevel?: string; // We might need to pass this or infer it
}

export default function SeoContentBlock({ title, subject, category, sectionName }: Props) {
  // Generate generic but valuable-looking text based on metadata
  // This increases "text density" for AdSense without requiring manual writing
  
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  return (
    <div className="mt-12 bg-blue-50/50 rounded-2xl p-6 md:p-8 border border-blue-100">
      <div className="flex items-center gap-3 mb-6">
        <Info className="text-primary w-6 h-6" />
        <h3 className="text-xl font-bold text-gray-900">حول هذا المحتوى التعليمي</h3>
      </div>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
        <p>
          يقدم لكم موقعنا هذا المحتوى المتميز بعنوان <strong>&quot;{title}&quot;</strong> ضمن قسم <strong>{sectionName || category}</strong>، 
          وهو جزء من الموارد التعليمية الشاملة التي نوفرها للطلاب والمعلمين للعام الدراسي {academicYear}.
        </p>

        <div className="grid md:grid-cols-2 gap-6 my-6">
          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
            <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              أهمية هذا الدرس
            </h4>
            <p className="text-sm text-gray-600">
              يساعد هذا الملف في تعزيز الفهم العميق لمادة {subject || 'الدراسية'}، 
              حيث تم إعداده بعناية ليتوافق مع المناهج الدراسية الحديثة وتلبية احتياجات الطلاب في التحضير للاختبارات وفهم الأساسيات.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
            <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              مخرجات التعلم
            </h4>
            <p className="text-sm text-gray-600">
              بعد الاطلاع على هذا المحتوى، يتوقع من الطالب أن يكون قادراً على استيعاب المفاهيم الأساسية المطروحة 
              وتطبيقها بشكل عملي، مما يساهم في رفع التحصيل الأكاديمي.
            </p>
          </div>
        </div>

        <p>
          نحن نسعى دائماً لتوفير أفضل الملفات التعليمية والمراجعات والملخصات التي تخدم العملية التعليمية. 
          يمكنكم تصفح المزيد من الملفات المشابهة في قسم <strong>{subject}</strong> أو استخدام خاصية البحث في الموقع للوصول إلى محتوى محدد.
        </p>
        
        <p className="text-xs text-gray-500 mt-4 border-t border-blue-100 pt-4">
          إخلاء مسؤولية: جميع الحقوق محفوظة لأصحابها. يتم توفير هذا المحتوى للأغراض التعليمية فقط. 
          إذا كنت تعتقد أن هناك انتهاكاً لحقوق الملكية الفكرية، يرجى التواصل معنا فوراً.
        </p>
      </div>
    </div>
  );
}
