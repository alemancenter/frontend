'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'placeholder'> {
  fallbackSrc?: string;
}

/**
 * Optimized Image component with lazy loading, blur placeholder, and fallback
 */
export default function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc = '/assets/img/front-pages/icons/articles_default_image.webp',
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={imgSrc}
        alt={alt}
        className={cn(
          'transition-all duration-300',
          isLoading && 'blur-sm scale-105',
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setImgSrc(fallbackSrc);
          setIsLoading(false);
        }}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        quality={85}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      )}
    </div>
  );
}
