import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';

export interface CalendarDatabase {
  code: string;
  name: string;
}

interface EventFormData {
  title: string;
  description?: string;
  event_date: string;
  eventDatabase: string;
}

export interface EventResponse {
  id: number;
  title: string;
  start: string;
  allDay: boolean;
  extendedProps: {
    description: string;
    database: string;
  };
}

export const calendarService = {
  /**
   * Get available databases for calendar.
   * Backend returns [{ id, code, name }]; normalise to CalendarDatabase[].
   */
  async getDatabases(): Promise<CalendarDatabase[]> {
    const response = await apiClient.get<any>(API_ENDPOINTS.CALENDAR.DATABASES);
    const list: unknown = response.data?.data;
    if (!Array.isArray(list)) return [];
    return (list as any[]).map((db) => ({
      code: String(db.code ?? db),
      name: String(db.name ?? db.code ?? db),
    }));
  },

  /**
   * Get events for a date range.
   * Backend returns models.Event[] with event_date; normalise to EventResponse[].
   */
  async getEvents(params: {
    database?: string;
    start?: string;
    end?: string;
  }): Promise<EventResponse[]> {
    const response = await apiClient.get<any>(API_ENDPOINTS.CALENDAR.EVENTS, params);
    const outer: unknown = response.data?.data;
    const raw: any[] = Array.isArray(outer)
      ? outer
      : Array.isArray((outer as any)?.data)
      ? (outer as any).data
      : [];
    return raw.map((item: any) => ({
      id: Number(item.id),
      title: String(item.title ?? ''),
      start: String(item.event_date ?? item.start ?? ''),
      allDay: true,
      extendedProps: {
        description: String(item.description ?? ''),
        database: params.database ?? 'jo',
      },
    }));
  },

  async getHomeEvents(params: {
    database?: string;
    start?: string;
    end?: string;
  }): Promise<EventResponse[]> {
    const response = await apiClient.get<any>(API_ENDPOINTS.HOME.CALENDAR, params);
    const outer: unknown = response.data?.data;
    const raw: any[] = Array.isArray(outer)
      ? outer
      : Array.isArray((outer as any)?.data)
      ? (outer as any).data
      : [];
    return raw.map((item: any) => ({
      id: Number(item.id),
      title: String(item.title ?? ''),
      start: String(item.event_date ?? item.start ?? ''),
      allDay: true,
      extendedProps: {
        description: String(item.description ?? ''),
        database: params.database ?? 'jo',
      },
    }));
  },

  /**
   * Create new calendar event
   */
  async create(data: EventFormData): Promise<EventResponse> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.CALENDAR.STORE,
      data
    );
    return response.data?.data?.data || response.data?.data || response.data;
  },

  /**
   * Update calendar event
   */
  async update(id: number | string, data: EventFormData): Promise<EventResponse> {
    const response = await apiClient.put<any>(
      API_ENDPOINTS.CALENDAR.UPDATE(id),
      data
    );
    return response.data?.data?.data || response.data?.data || response.data;
  },

  /**
   * Delete calendar event
   */
  async delete(id: number | string, database: string): Promise<{ message: string }> {
    const response = await apiClient.delete(API_ENDPOINTS.CALENDAR.DELETE(id), { database });
    return {
      message: response.message || 'Deleted successfully'
    };
  },
};

export default calendarService;
