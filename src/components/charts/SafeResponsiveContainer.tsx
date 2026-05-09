'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';
import type { ResponsiveContainerProps } from 'recharts';

type SafeResponsiveContainerProps = ResponsiveContainerProps & {
  children: ReactNode;
};

export default function SafeResponsiveContainer({
  children,
  width = '100%',
  height = '100%',
  minWidth = 0,
  minHeight = 0,
  ...rest
}: SafeResponsiveContainerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const ready = dimensions.width > 0 && dimensions.height > 0;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const updateDimensions = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions((prev) => {
          const next = { width: Math.round(rect.width), height: Math.round(rect.height) };
          if (prev.width === next.width && prev.height === next.height) return prev;
          return next;
        });
      }
    };

    updateDimensions();

    if (typeof ResizeObserver === 'undefined') {
      updateDimensions();
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0].contentRect;
      if (w > 0 && h > 0) {
        setDimensions((prev) => {
          const next = { width: Math.round(w), height: Math.round(h) };
          if (prev.width === next.width && prev.height === next.height) return prev;
          return next;
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} style={{ width: '100%', height: '100%', minWidth: 0, minHeight }}>
      {ready ? (
        <ResponsiveContainer
          width={width}
          height={height}
          minWidth={minWidth}
          minHeight={minHeight}
          initialDimension={dimensions}
          {...rest}
        >
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
