export function normalizeArray<T>(response: any): T[] {
  if (!response) return [];

  if (Array.isArray(response)) return response;

  if (Array.isArray(response.data)) return response.data;

  if (Array.isArray(response.data?.data)) return response.data.data;

  if (Array.isArray(response.result)) return response.result;

  if (Array.isArray(response.payload)) return response.payload;

  return [];
}

export function normalizeObject<T>(response: any): T | null {
  if (!response) return null;

  if (response.data?.data) return response.data.data as T;

  if (response.data) return response.data as T;

  return response as T;
}