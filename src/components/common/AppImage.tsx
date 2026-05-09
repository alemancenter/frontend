'use client';

import NextImage, { ImageProps } from 'next/image';

type AppImageProps = ImageProps & {
  eager?: boolean;
};

function isAbsoluteRemoteSrc(src: ImageProps['src']): boolean {
  if (typeof src !== 'string') return false;
  return /^https?:\/\//i.test(src);
}

function isSvgSrc(src: ImageProps['src']): boolean {
  return typeof src === 'string' && src.split('?')[0].toLowerCase().endsWith('.svg');
}

export default function AppImage({
  loading,
  priority,
  eager,
  unoptimized,
  ...props
}: AppImageProps) {
  const resolvedLoading = loading ?? (eager ? 'eager' : undefined);
  const resolvedUnoptimized = unoptimized ?? (isAbsoluteRemoteSrc(props.src) || isSvgSrc(props.src));

  return (
    <NextImage
      {...props}
      loading={resolvedLoading}
      priority={priority}
      unoptimized={resolvedUnoptimized}
    />
  );
}
