'use client';

import Sidebar from '@/components/layout/Sidebar';
import DashboardContentWrapper from '@/components/layout/DashboardContentWrapper';
import { useEmailVerification } from '@/hooks/useEmailVerification';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check email verification and redirect if needed
  const { isVerified } = useEmailVerification(true);

  // Don't render dashboard until verified
  // The hook will handle the redirect
  if (isVerified === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <Sidebar />
      <DashboardContentWrapper>
        {children}
      </DashboardContentWrapper>
    </div>
  );
}
