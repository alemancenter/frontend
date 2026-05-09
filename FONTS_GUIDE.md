# دليل استخدام الخطوط في المشروع

## الخط الحالي: Cairo

تم إعداد المشروع لاستخدام خط **Cairo** من Google Fonts كخط افتراضي لجميع النصوص العربية والإنجليزية.

## ⚡ التحسينات المطبقة

### 1. تحميل الخط من Google Fonts CDN
- استخدام `@import` في `src/styles/fonts.css`
- تحميل جميع الأوزان (200-900) مع `display=swap` لمنع النص الخفي
- تحسين السرعة عبر `preconnect` في layout.tsx

### 2. إعداد Tailwind CSS
- تم تعريف الخط في `globals.css` عبر المتغير `--font-sans`
- يتم استخدام Cairo تلقائياً كخط افتراضي لـ `font-sans`

### 3. تحسينات الأداء
```tsx
// في layout.tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
```

## 📁 الملفات المتأثرة

1. **`src/app/globals.css`**
   - يحتوي على `@import` لخط Cairo من Google Fonts
   - تعريف `--font-sans` لاستخدام Cairo كخط افتراضي
   - متغيرات Tailwind CSS v4

2. **`src/app/layout.tsx`**
   - روابط `preconnect` و `dns-prefetch` لتسريع تحميل الخط

3. **`public/fonts/`**
   - مجلد جاهز لاستضافة خطوط محلية إن لزم الأمر
   - يحتوي على `README.md` بتعليمات إضافة الخطوط المحلية

## 🎨 استخدام أوزان الخط

```tsx
// في مكونات React أو ملفات CSS
<p className="font-light">   {/* 300 */}
<p className="font-normal">  {/* 400 */}
<p className="font-medium">  {/* 500 */}
<p className="font-semibold">{/* 600 */}
<p className="font-bold">    {/* 700 */}
<p className="font-extrabold">{/* 800 */}
<p className="font-black">   {/* 900 */}
```

## 🔄 التبديل إلى خطوط محلية (اختياري)

إذا كنت تريد استضافة الخطوط محلياً بدلاً من Google Fonts:

### الخطوة 1: تحميل ملفات الخط
```bash
# تحميل خط Cairo بصيغة WOFF2
cd website/public/fonts
# قم بتحميل الملفات من Google Fonts أو مصادر أخرى
```

### الخطوة 2: تحديث globals.css
```css
/* في src/app/globals.css */
/* استبدل @import url من Google Fonts بـ @font-face للخطوط المحلية */

@import "tailwindcss";

/* بدلاً من: @import url('https://fonts.googleapis.com/...') */
/* استخدم: */
@font-face {
  font-family: 'Cairo';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/Cairo-Regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Cairo';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/Cairo-Bold.woff2') format('woff2');
}
/* أضف المزيد من الأوزان حسب الحاجة */

@theme {
  --font-sans: 'Cairo', ui-sans-serif, system-ui, sans-serif;
  /* ... بقية التكوين */
}
```

### الخطوة 3: تحديث layout.tsx
```tsx
// أضف preload للخطوط المحلية
<link
  rel="preload"
  href="/fonts/Cairo-Regular.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

## 🌐 إضافة خط إضافي

لإضافة خط آخر (مثل Tajawal):

### في fonts.css
```css
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap');
```

### في globals.css
```css
@theme {
  --font-sans: 'Cairo', ui-sans-serif, system-ui, sans-serif;
  --font-tajawal: 'Tajawal', ui-sans-serif, system-ui, sans-serif;
}
```

### الاستخدام
```tsx
<div className="font-[family-name:var(--font-tajawal)]">
  نص بخط Tajawal
</div>
```

## 📊 مقارنة الخيارات

| الطريقة | المزايا | العيوب |
|---------|---------|--------|
| **Google Fonts CDN** | ✅ سهولة الإعداد<br>✅ تحديثات تلقائية<br>✅ CDN سريع | ❌ يتطلب اتصال إنترنت<br>❌ طلب خارجي |
| **خطوط محلية** | ✅ عمل بدون إنترنت<br>✅ تحكم كامل<br>✅ خصوصية أفضل | ❌ حجم أكبر للمشروع<br>❌ صيانة يدوية |

## 🚀 أفضل الممارسات

1. **استخدم WOFF2 فقط** - أفضل ضغط ومدعوم من جميع المتصفحات الحديثة
2. **حدد الأوزان المطلوبة فقط** - لا تحمل جميع الأوزان إذا كنت تستخدم 2-3 فقط
3. **font-display: swap** - لمنع النص الخفي أثناء تحميل الخط
4. **preconnect لـ CDN** - تسريع الاتصال بخوادم الخطوط
5. **استخدم subset** - قلل حجم الملف بتضمين الأحرف المطلوبة فقط

## 🔍 اختبار الخطوط

افتح المتصفح وتحقق من:
```javascript
// في console المتصفح
getComputedStyle(document.body).fontFamily
// يجب أن يظهر: "Cairo", ...
```

## 📝 ملاحظات

- الخط الحالي **Cairo** مناسب تماماً للنصوص العربية
- يدعم جميع الأحرف العربية والإنجليزية
- متوافق مع RTL (من اليمين لليسار)
- خط عصري واحترافي للواجهات الحديثة
