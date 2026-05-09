import 'server-only';

import { cache } from 'react';
import { API_CONFIG, API_ENDPOINTS, COUNTRIES } from '@/lib/api/config';
import { ssrFetch, getSSRHeaders } from '@/lib/api/ssr-fetch';
import type { SchoolClass } from '@/types';

export type AcademicSubject = {
  id: number;
  subject_name: string;
  name?: string;
  description?: string | null;
  files_count?: number;
  articles_count?: number;
  grade_level?: number;
};

export type AcademicSemester = {
  id: number;
  semester_name: string;
  slug?: string;
  file_categories?: Array<{
    id: number | string;
    name: string;
    slug?: string;
    files_count?: number;
    articles_count?: number;
  }>;
  articles_count?: number;
  files_count?: number;
  grade_level?: number;
};

export type SubjectSemestersData = {
  subjectName: string;
  classId: string | null;
  semesters: AcademicSemester[];
};

const ACADEMIC_REVALIDATE_SECONDS = 60;

function countryIdFromCodeOrId(countryCodeOrId: string): string {
  const country = COUNTRIES.find((item) => item.code === countryCodeOrId || item.id === countryCodeOrId);
  return country?.id || countryCodeOrId || '1';
}

function apiUrl(endpoint: string): string {
  return `${API_CONFIG.INTERNAL_URL.replace(/\/+$/, '')}${endpoint}`;
}

function unwrap<T = any>(json: any): T {
  const body = json?.data ?? json;
  return (body?.data ?? body) as T;
}

async function getJson(endpoint: string, countryCodeOrId: string): Promise<any | null> {
  const countryId = countryIdFromCodeOrId(countryCodeOrId);

  try {
    const res = await ssrFetch(apiUrl(endpoint), {
      next: { revalidate: ACADEMIC_REVALIDATE_SECONDS },
      headers: getSSRHeaders(countryId),
    });

    if (!res.ok) return null;
    return res.json().catch(() => null);
  } catch (error) {
    console.error('Academic data fetch failed:', endpoint, error);
    return null;
  }
}

export const getSchoolClasses = cache(async (countryCodeOrId: string): Promise<SchoolClass[]> => {
  const json = await getJson(API_ENDPOINTS.FRONTEND.CLASSES, countryCodeOrId);
  const data = unwrap<any>(json);
  return Array.isArray(data) ? (data as SchoolClass[]) : [];
});

export const getSchoolClass = cache(async (
  countryCodeOrId: string,
  classId: string | number
): Promise<(SchoolClass & { subjects?: AcademicSubject[] }) | null> => {
  const json = await getJson(`${API_ENDPOINTS.FRONTEND.CLASS_DETAILS(classId)}?include_counts=1`, countryCodeOrId);
  const data = unwrap<any>(json);
  return data && typeof data === 'object' ? data : null;
});

export const getSubjectsForClass = cache(async (
  countryCodeOrId: string,
  classId: string | number
): Promise<AcademicSubject[]> => {
  const schoolClass = await getSchoolClass(countryCodeOrId, classId);
  return Array.isArray(schoolClass?.subjects) ? schoolClass.subjects : [];
});

export const getSubjectSemesters = cache(async (
  countryCodeOrId: string,
  subjectId: string | number
): Promise<SubjectSemestersData> => {
  const json = await getJson(API_ENDPOINTS.FILTER.SEMESTERS_BY_SUBJECT(subjectId), countryCodeOrId);
  const data = unwrap<any>(json) || {};
  const subject = data.subject || {};

  let semesters: AcademicSemester[] = [];
  if (Array.isArray(data)) {
    semesters = data;
  } else if (Array.isArray(data.semesters)) {
    semesters = data.semesters;
  } else if (Array.isArray(data.data?.semesters)) {
    semesters = data.data.semesters;
  } else if (Array.isArray(data.data)) {
    semesters = data.data;
  }

  const subjectName =
    subject.subject_name ||
    subject.name ||
    data.subject_name ||
    data.name ||
    'المادة الدراسية';

  const classId = data.class_id || subject.class_id || subject.grade_level || null;

  return {
    subjectName,
    classId: classId ? String(classId) : null,
    semesters,
  };
});
