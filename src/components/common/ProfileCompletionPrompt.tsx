'use client';

import { useState } from 'react';
import { ChevronDown, Check, Loader2, UserCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useStore';
import { authService } from '@/lib/api/services/auth';

const COUNTRIES = [
  { value: 'الأردن', label: 'الأردن' },
  { value: 'السعودية', label: 'السعودية' },
  { value: 'مصر', label: 'مصر' },
  { value: 'فلسطين', label: 'فلسطين' },
  { value: 'الكويت', label: 'الكويت' },
  { value: 'الإمارات', label: 'الإمارات' },
  { value: 'البحرين', label: 'البحرين' },
  { value: 'قطر', label: 'قطر' },
  { value: 'سلطنة عُمان', label: 'سلطنة عُمان' },
  { value: 'العراق', label: 'العراق' },
  { value: 'سوريا', label: 'سوريا' },
  { value: 'لبنان', label: 'لبنان' },
  { value: 'اليمن', label: 'اليمن' },
  { value: 'ليبيا', label: 'ليبيا' },
  { value: 'تونس', label: 'تونس' },
  { value: 'الجزائر', label: 'الجزائر' },
  { value: 'المغرب', label: 'المغرب' },
  { value: 'موريتانيا', label: 'موريتانيا' },
  { value: 'السودان', label: 'السودان' },
];

interface Props {
  description?: string;
  onComplete?: () => void;
}

export default function ProfileCompletionPrompt({ description, onComplete }: Props) {
  const { user, login } = useAuthStore();
  const [country, setCountry] = useState(user?.country ?? '');
  const [gender, setGender] = useState(user?.gender ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!country || !gender) {
      setError('يرجى اختيار الدولة والجنس');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await authService.updateProfile({ country, gender });
      login({ ...user!, ...updated });
      onComplete?.();
    } catch {
      setError('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserCircle className="w-7 h-7 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">أكمل بياناتك الشخصية</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description ?? 'يرجى تحديد دولتك وجنسك للمتابعة'}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            الدولة <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            >
              <option value="">اختر الدولة</option>
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            الجنس <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors ${
                gender === 'male'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background border-border text-foreground hover:bg-secondary/50'
              }`}
            >
              {gender === 'male' && <Check className="w-4 h-4" />}
              ذكر
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors ${
                gender === 'female'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background border-border text-foreground hover:bg-secondary/50'
              }`}
            >
              {gender === 'female' && <Check className="w-4 h-4" />}
              أنثى
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !country || !gender}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
          ) : (
            'حفظ والمتابعة'
          )}
        </button>
      </div>
    </div>
  );
}
