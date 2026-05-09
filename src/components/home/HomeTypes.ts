import type { Article, Category, Post, SchoolClass } from '@/types';

export type HomeCountry = {
  id: string;
  code: string;
  name: string;
};

export type HomeAdSettings = {
  googleAdsDesktop: string;
  googleAdsMobile: string;
  googleAdsDesktop2: string;
  googleAdsMobile2: string;
};

export type HomeSharedProps = {
  country: HomeCountry;
};

export type HomeContentProps = HomeSharedProps & {
  classes: SchoolClass[];
  categories?: Category[];
  articles?: Article[];
  posts?: Post[];
  featuredPosts?: Post[];
  initialSiteName?: string;
  isLoggedIn?: boolean;
  adSettings?: HomeAdSettings;
};
