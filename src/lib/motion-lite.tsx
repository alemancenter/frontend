'use client';

import React, { forwardRef } from 'react';

export type Variants = Record<string, unknown>;
export type HTMLMotionProps<T extends keyof React.JSX.IntrinsicElements> =
  React.ComponentPropsWithoutRef<T> & MotionOnlyProps;

type MotionOnlyProps = {
  animate?: unknown;
  drag?: unknown;
  exit?: unknown;
  initial?: unknown;
  layout?: unknown;
  layoutId?: unknown;
  transition?: unknown;
  variants?: unknown;
  viewport?: unknown;
  whileFocus?: unknown;
  whileHover?: unknown;
  whileInView?: unknown;
  whileTap?: unknown;
};

const motionOnlyProps = new Set([
  'animate',
  'drag',
  'exit',
  'initial',
  'layout',
  'layoutId',
  'transition',
  'variants',
  'viewport',
  'whileFocus',
  'whileHover',
  'whileInView',
  'whileTap',
]);

function stripMotionProps(props: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  Object.entries(props).forEach(([key, value]) => {
    if (!motionOnlyProps.has(key)) {
      clean[key] = value;
    }
  });
  return clean;
}

function createMotionTag<T extends keyof React.JSX.IntrinsicElements>(tag: T) {
  return forwardRef<HTMLElement, HTMLMotionProps<T>>(function MotionLite(props, ref) {
    return React.createElement(tag, { ...stripMotionProps(props), ref });
  });
}

const cache = new Map<string, React.ComponentType<any>>();

export const motion = new Proxy(
  {},
  {
    get(_target, tag: string) {
      if (!cache.has(tag)) {
        cache.set(tag, createMotionTag(tag as keyof React.JSX.IntrinsicElements));
      }
      return cache.get(tag);
    },
  }
) as {
  [K in keyof React.JSX.IntrinsicElements]: React.ForwardRefExoticComponent<
    HTMLMotionProps<K> & React.RefAttributes<HTMLElement>
  >;
};

export function AnimatePresence({ children }: { children: React.ReactNode; mode?: string; initial?: boolean }) {
  return <>{children}</>;
}
