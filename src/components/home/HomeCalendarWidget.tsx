'use client';

import { useEffect, useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { calendarService } from '@/lib/api/services/calendar';
import type { HomeCountry } from './HomeTypes';

type CalendarEvent = {
  id: number;
  title: string;
  description: string;
  start_date: string;
  database: string;
};

const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function HomeCalendarSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomeCalendarWidget({ country }: { country: HomeCountry }) {
  const [mounted, setMounted] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date(0));
  const [selectedDate, setSelectedDate] = useState('1970-01-01');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventModalDate, setEventModalDate] = useState('1970-01-01');

  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const now = new Date();
    setCalendarDate(now);
    setSelectedDate(format(now, 'yyyy-MM-dd'));
    setEventModalDate(format(now, 'yyyy-MM-dd'));
    setMounted(true);
  }, []);

  const monthStart = useMemo(() => startOfMonth(calendarDate), [calendarDate]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);
  const startDate = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 0 }), [monthStart]);
  const endDate = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 0 }), [monthEnd]);

  const calendarDays = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

  useEffect(() => {
    let ignore = false;

    const fetchMonthEvents = async () => {
      try {
        const start = format(startDate, 'yyyy-MM-dd');
        const end = format(endDate, 'yyyy-MM-dd');
        const res = await calendarService.getHomeEvents({ database: country.code, start, end });
        const mapped = (res || [])
          .map((item: any) => ({
            id: Number(item.id),
            title: String(item.title ?? ''),
            description: String(item.extendedProps?.description ?? ''),
            start_date: String(item.start ?? '').split('T')[0],
            database: String(item.extendedProps?.database ?? country.code),
          }))
          .filter((e) => e.title && e.start_date && e.start_date !== 'Invalid Date');
        if (!ignore) setEvents(mapped);
      } catch {
        if (!ignore) setEvents([]);
      }
    };

    fetchMonthEvents();
    return () => {
      ignore = true;
    };
  }, [country.code, startDate, endDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const list = map.get(e.start_date) || [];
      list.push(e);
      map.set(e.start_date, list);
    });
    return map;
  }, [events]);

  const eventModalEvents = useMemo(() => eventsByDate.get(eventModalDate) || [], [eventsByDate, eventModalDate]);

  const upcomingEvents = useMemo(() => {
    const parsed = events
      .map((e) => ({ ...e, date: new Date(e.start_date) }))
      .filter((e) => !Number.isNaN(e.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return parsed.slice(0, 4);
  }, [events]);

  if (!mounted) return <HomeCalendarSkeleton />;

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm text-blue-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-800 text-lg">{format(calendarDate, 'MMMM yyyy', { locale: arSA })}</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
              className="w-9 h-9 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 border border-transparent hover:border-slate-100"
              aria-label="الشهر السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
              className="w-9 h-9 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 border border-transparent hover:border-slate-100"
              aria-label="الشهر التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 mb-4">
            {daysAr.map((day) => (
              <div key={day} className="text-center text-xs font-bold text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const dKey = format(day, 'yyyy-MM-dd');
              const isCurrMonth = isSameMonth(day, calendarDate);
              const isSel = selectedDate === dKey;
              const hasEv = (eventsByDate.get(dKey) || []).length > 0;
              const isT = isToday(day);

              return (
                <button
                  key={dKey}
                  onClick={() => {
                    setSelectedDate(dKey);
                    if (hasEv) {
                      setEventModalDate(dKey);
                      setIsEventModalOpen(true);
                    }
                  }}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-all duration-200 ${
                    !isCurrMonth ? 'text-slate-500' : 'text-slate-700 hover:bg-slate-50'
                  } ${isSel ? 'ring-2 ring-blue-500 ring-offset-2 z-10' : ''} ${
                    isT ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg scale-105' : ''
                  } ${hasEv && !isT ? 'bg-blue-50 font-bold text-blue-600 border border-blue-100' : ''}`}
                >
                  <span className="relative z-10">{format(day, 'd')}</span>
                  {hasEv && <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isT ? 'bg-white' : 'bg-blue-500'}`} />}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-blue-500" />
              أحداث قادمة
            </h3>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-2">
                {upcomingEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-white flex flex-col items-center justify-center text-xs border border-slate-100 shadow-sm">
                      <span className="font-bold text-slate-700">{format(e.date, 'd')}</span>
                      <span className="text-slate-500 text-[10px]">{format(e.date, 'MMM', { locale: arSA })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-sm truncate">{e.title}</div>
                      <div className="text-slate-500 text-xs truncate">{e.description || 'لا يوجد وصف'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">لا توجد أحداث قادمة قريباً</p>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={`أحداث ${format(parseISO(eventModalDate), 'EEEE d MMMM yyyy', { locale: arSA })}`}
        description={country.name}
        size="md"
      >
        {eventModalEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <CalendarIcon className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500">لا توجد أحداث مجدولة لهذا اليوم</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-auto custom-scrollbar p-1">
            {eventModalEvents.map((e) => (
              <div key={e.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                <div className="pl-3">
                  <div className="font-bold text-slate-900 mb-1 text-lg">{e.title}</div>
                  {e.description ? (
                    <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{e.description}</div>
                  ) : (
                    <div className="text-xs text-slate-500 italic">لا يوجد تفاصيل إضافية</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex justify-end pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => setIsEventModalOpen(false)}>
            إغلاق النافذة
          </Button>
        </div>
      </Modal>
    </>
  );
}
