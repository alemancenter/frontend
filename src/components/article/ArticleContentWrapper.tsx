'use client';

import { ReactNode } from 'react';

interface ArticleContentWrapperProps {
  children: ReactNode;
}

export default function ArticleContentWrapper({
  children,
}: ArticleContentWrapperProps) {
  return <>{children}</>;
}
