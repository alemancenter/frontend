'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Ban, AlertTriangle, ArrowRight, Lock } from 'lucide-react';
import { motion } from '@/lib/motion-lite';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useStore';

export default function AccessDenied() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  // Check if user is a staff member (has permissions)
  const isStaff = isAuthenticated && (
    (user?.permissions && user.permissions.length > 0) || 
    (user?.roles && user.roles.length > 0)
  );

  const [attempts] = useState(() => {
    // If server-side or staff, start with 0
    if (typeof window === 'undefined' || isStaff) return 0;
    
    // On client, calculate attempts immediately to avoid re-render
    const stored = parseInt(localStorage.getItem('security_violation_attempts') || '0');
    return stored + 1;
  });

  const isBanned = attempts >= 3;

  useEffect(() => {
    // If user is staff, don't count attempts or ban
    if (isStaff) return;

    // Persist the new attempt count
    if (attempts > 0) {
      localStorage.setItem('security_violation_attempts', attempts.toString());
      
      if (isBanned) {
        localStorage.setItem('security_banned', 'true');
      }
    }
  }, [attempts, isBanned, isStaff]);

  const handleBack = () => {
    router.push('/');
  };

  // If user is staff, show a softer message
  if (isStaff) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-100 p-6 rounded-full mb-6 dark:bg-gray-800"
        >
          <Lock size={48} className="text-gray-500" />
        </motion.div>
        
        <h1 className="text-2xl font-bold mb-2">عفواً، لا تملك الصلاحية</h1>
        
        <p className="text-muted-foreground max-w-md mb-8">
          ليس لديك الصلاحية للوصول إلى هذه الصفحة.
          <br />
          يرجى التواصل مع المدير إذا كنت تعتقد أن هذا خطأ.
        </p>

        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <ArrowRight size={18} />
          <span>العودة للرئيسية</span>
        </button>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-destructive/10 p-8 rounded-full mb-6"
        >
          <Ban size={64} className="text-destructive" />
        </motion.div>
        <h1 className="text-3xl font-bold text-destructive mb-2">تم حظر الحساب</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          لقد تجاوزت الحد المسموح به من محاولات الوصول غير المصرح. تم حظر حسابك تلقائياً لدواعي أمنية. يرجى التواصل مع الدعم الفني.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-amber-500/10 p-6 rounded-full mb-6"
      >
        <ShieldAlert size={48} className="text-amber-500" />
      </motion.div>
      
      <h1 className="text-2xl font-bold mb-2">تحذير أمني</h1>
      
      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 max-w-lg mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={20} />
          <p className="text-destructive text-sm font-medium text-right leading-relaxed">
            غير مصرح لك بالوصول إلى هذه الصفحة. لا تحاول مرة أخرى، لأنه بعد 3 محاولات سيتم حظرك تلقائياً.
          </p>
        </div>
        <div className="mt-3 text-xs text-muted-foreground text-right" suppressHydrationWarning>
          محاولة {attempts} من 3
        </div>
      </div>

      <button
        onClick={handleBack}
        className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <ArrowRight size={18} />
        <span>العودة للرئيسية</span>
      </button>
    </div>
  );
}

