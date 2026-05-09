'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface LinkPrefetchProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  onMouseEnter?: () => void;
}

/**
 * Enhanced Link component with aggressive prefetching
 * Prefetches on hover and viewport intersection for maximum speed
 */
export default function LinkPrefetch({
  href,
  children,
  className,
  prefetch = true,
  onMouseEnter,
  ...props
}: LinkPrefetchProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!prefetch || !linkRef.current) return;

    // Intersection Observer for viewport prefetching
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Prefetch when link enters viewport
            const link = entry.target as HTMLAnchorElement;
            if (link.href) {
              // Next.js will handle the prefetch
              link.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
            }
          }
        });
      },
      {
        rootMargin: '50px', // Start prefetching 50px before entering viewport
      }
    );

    observer.observe(linkRef.current);

    return () => {
      observer.disconnect();
    };
  }, [prefetch]);

  return (
    <Link
      ref={linkRef}
      href={href}
      className={className}
      prefetch={prefetch}
      onMouseEnter={onMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
}
