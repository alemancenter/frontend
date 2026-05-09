/**
 * Debug API Connection Endpoint
 * Tests the internal API connection from Next.js SSR
 *
 * Usage: GET /api/debug/connection?country=jo
 */

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG, getApiHostname } from '@/lib/api/config';
import { internalFetch, shouldUseInternalFetch } from '@/lib/api/internal-fetch';

export async function GET(request: NextRequest) {
  const countryCode = request.nextUrl.searchParams.get('country') || 'jo';
  const countryMap: Record<string, string> = { 'jo': '1', 'sa': '2', 'eg': '3', 'ps': '4' };
  const countryId = countryMap[countryCode] || '1';

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      API_INTERNAL_URL: process.env.API_INTERNAL_URL,
      API_HOSTNAME: process.env.API_HOSTNAME,
    },
    config: {
      BASE_URL: API_CONFIG.BASE_URL,
      INTERNAL_URL: API_CONFIG.INTERNAL_URL,
      hostname: getApiHostname(),
    },
    country: {
      code: countryCode,
      id: countryId,
    },
    tests: {},
  };

  // Test 1: Internal API Connection (using custom internalFetch with SSL bypass)
  try {
    const internalUrl = `${API_CONFIG.INTERNAL_URL}/ping`;
    const startTime = Date.now();
    const useInternal = shouldUseInternalFetch(internalUrl);

    const response = await internalFetch(internalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Country-Id': countryId,
        'X-Country-Code': countryCode,
        'X-Frontend-Key': process.env.FRONTEND_API_KEY || '',
      },
      timeout: 10000,
    });

    const duration = Date.now() - startTime;
    const data = await response.text();

    results.tests.internalPing = {
      success: response.ok,
      status: response.status,
      duration: `${duration}ms`,
      url: internalUrl,
      useInternalFetch: useInternal,
      sslBypass: process.env.NODE_TLS_REJECT_UNAUTHORIZED_INTERNAL === '0',
      response: data.substring(0, 500),
    };
  } catch (error: any) {
    results.tests.internalPing = {
      success: false,
      error: error.message,
      errorStack: error.stack?.substring(0, 300),
      url: `${API_CONFIG.INTERNAL_URL}/ping`,
    };
  }

  // Test 2: School Classes API (using custom internalFetch with SSL bypass)
  try {
    const classesUrl = `${API_CONFIG.INTERNAL_URL}/school-classes/2?database=${countryCode}&country_id=${countryId}`;
    const startTime = Date.now();

    const response = await internalFetch(classesUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Country-Id': countryId,
        'X-Country-Code': countryCode,
        'X-Frontend-Key': process.env.FRONTEND_API_KEY || '',
      },
      timeout: 10000,
    });

    const duration = Date.now() - startTime;
    const data = await response.json().catch(() => null);

    results.tests.schoolClasses = {
      success: response.ok,
      status: response.status,
      duration: `${duration}ms`,
      url: classesUrl,
      hasSubjects: !!(data?.data?.subjects?.length),
      subjectsCount: data?.data?.subjects?.length || 0,
      className: data?.data?.grade_name || null,
    };
  } catch (error: any) {
    results.tests.schoolClasses = {
      success: false,
      error: error.message,
      errorStack: error.stack?.substring(0, 300),
    };
  }

  // Test 3: Public API Connection (for comparison)
  try {
    const publicUrl = `${API_CONFIG.BASE_URL}/ping`;
    const startTime = Date.now();

    const response = await fetch(publicUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Country-Id': countryId,
        'X-Frontend-Key': process.env.FRONTEND_API_KEY || '',
      },
      cache: 'no-store',
    });

    const duration = Date.now() - startTime;

    results.tests.publicPing = {
      success: response.ok,
      status: response.status,
      duration: `${duration}ms`,
      url: publicUrl,
    };
  } catch (error: any) {
    results.tests.publicPing = {
      success: false,
      error: error.message,
    };
  }

  return NextResponse.json(results, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
