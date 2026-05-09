'use client';

import { UserCheck } from 'lucide-react';
import Card from '@/components/ui/Card';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

export default function AttendancePage() {
  const { isAuthorized } = usePermissionGuard('manage attendance');

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">حضور الحصص</h1>
          <p className="text-muted-foreground">تسجيل ومتابعة حضور الطلاب في الحصص الدراسية</p>
        </div>
      </div>

      <Card className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <UserCheck className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">نظام الحضور قيد التطوير</h2>
        <p className="text-muted-foreground max-w-md">
          جاري العمل على صفحة تسجيل الحضور. ستتمكن قريباً من تسجيل حضور الطلاب للحصص الدراسية المختلفة من هنا.
        </p>
      </Card>
    </div>
  );
}
