import 'server-only';

import { cache } from 'react';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/api/config';
import { ssrFetch, getSSRHeaders } from '@/lib/api/ssr-fetch';
import type { Category, SchoolClass, Article, Post } from '@/types';

export type HomeApiData = {
  articles: Article[];
  posts: Post[];
  featured_posts: Post[];
  categories: Category[];
  classes: SchoolClass[];
  settings: Record<string, string | null>;
};

const emptyHomeData = (): HomeApiData => ({
  articles: [],
  posts: [],
  featured_posts: [],
  categories: [],
  classes: [],
  settings: {},
});

const normalizeSettings = (value: unknown): Record<string, string | null> => {
  if (!value || typeof value !== 'object') return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      item == null ? null : String(item),
    ])
  );
};

const parseHomeData = (json: any): HomeApiData => {
  const body = json?.data ?? json;
  return {
    articles: Array.isArray(body?.articles) ? body.articles : [],
    posts: Array.isArray(body?.posts) ? body.posts : [],
    featured_posts: Array.isArray(body?.featured_posts) ? body.featured_posts : [],
    categories: Array.isArray(body?.categories) ? body.categories : [],
    classes: Array.isArray(body?.classes) ? body.classes : [],
    settings: normalizeSettings(body?.settings),
  };
};

export const getHomeData = cache(async (countryId: string): Promise<HomeApiData> => {
  const baseUrl = API_CONFIG.INTERNAL_URL.replace(/\/+$/, '');
  const url = `${baseUrl}${API_ENDPOINTS.HOME.INDEX}`;

  try {
    const res = await ssrFetch(url, {
      next: { revalidate: 60 },
      headers: getSSRHeaders(countryId),
    });

    if (!res.ok) {
      console.error('Failed to fetch home data:', res.status);
      return emptyHomeData();
    }

    const json = await res.json().catch(() => null);
    return parseHomeData(json);
  } catch (error) {
    console.error('Error fetching home data:', error);
    return emptyHomeData();
  }
});
