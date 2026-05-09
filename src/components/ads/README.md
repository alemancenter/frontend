# Google AdSense Component

## مكون الإعلانات الاحترافي المتوافق مع سياسات Google AdSense

### الاستخدام

```tsx
import GoogleAdSense from '@/components/ads/GoogleAdSense';

// في أي صفحة
<GoogleAdSense slotType="download_1" className="w-full" />
```

### الأنواع المتاحة (Slot Types)

| Slot Type | الوصف | الاستخدام |
|-----------|-------|-----------|
| `download_1` | إعلان التحميل الأول | أعلى صفحة التحميل |
| `download_2` | إعلان التحميل الثاني | أسفل صفحة التحميل |
| `download_sidebar` | إعلان جانبي | في الـ sidebar |

### ربط الإعدادات

يقوم المكون بجلب أكواد الإعلانات تلقائياً من إعدادات الداشبورد:

#### Desktop
- `google_ads_desktop_download` → download_1
- `google_ads_desktop_download_2` → download_2

#### Mobile
- `google_ads_mobile_download` → download_1
- `google_ads_mobile_download_2` → download_2

### الميزات

✅ متوافق 100% مع سياسات Google AdSense
✅ responsive (ديسكتوب و موبايل)
✅ تصنيف واضح "إعلان"
✅ فصل واضح عن المحتوى
✅ لا توجد عناصر جذب انتباه
✅ Base64 decoding للأكواد
✅ معالجة الأخطاء
✅ placeholder في development

### مثال كامل

```tsx
import GoogleAdSense from '@/components/ads/GoogleAdSense';

export default function DownloadPage() {
  return (
    <div>
      {/* محتوى الصفحة */}

      {/* إعلان أعلى */}
      <GoogleAdSense slotType="download_1" className="mb-8" />

      {/* المحتوى الرئيسي */}
      <div>...</div>

      {/* إعلان أسفل */}
      <GoogleAdSense slotType="download_2" className="mt-12" />
    </div>
  );
}
```

### إضافة slot جديد

1. أضف الـ settings في الداشبورد
2. أضف الـ slot type في interface:
```typescript
interface GoogleAdSenseProps {
  slotType: 'download_1' | 'download_2' | 'download_sidebar' | 'newslot';
}
```

3. أضف mapping في settingsKeyMap:
```typescript
const settingsKeyMap: Record<string, { desktop: string; mobile: string }> = {
  newslot: {
    desktop: 'google_ads_desktop_newslot',
    mobile: 'google_ads_mobile_newslot',
  },
};
```

### الامتثال لسياسات Google

راجع [ADSENSE_COMPLIANCE.md](../../ADSENSE_COMPLIANCE.md) للتفاصيل الكاملة.

### الدعم

لأي استفسارات، راجع توثيق Google AdSense:
https://support.google.com/adsense
