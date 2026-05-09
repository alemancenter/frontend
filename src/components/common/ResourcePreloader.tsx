'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default function ResourcePreloader() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/') {
      router.prefetch('/jo/posts/category/101');
    }
  }, [pathname, router]);

  return null;
}
