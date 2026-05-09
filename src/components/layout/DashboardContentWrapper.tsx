'use client';

import { useSidebarStore } from '@/store/useStore';
import Header from '@/components/layout/Header';
import { useUserRefresh } from '@/hooks/useUserRefresh';

export default function DashboardContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useUserRefresh();
  const { isOpen } = useSidebarStore();
  const sidebarWidthClass = isOpen ? 'lg:mr-72' : 'lg:mr-20';

  return (
    <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out
            ${sidebarWidthClass}
        `}
    >
      {/* Top Header */}
      <Header />

      {/* Page Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto min-h-[calc(100vh-4rem)]">
        <div className="max-w-[1600px] mx-auto space-y-6 animate-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
