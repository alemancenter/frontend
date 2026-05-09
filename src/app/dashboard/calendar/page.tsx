'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isToday as isDateToday } from 'date-fns';
import { arSA } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2,
  Edit,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { calendarService, type CalendarDatabase } from '@/lib/api/services/calendar';
import { toast } from 'react-hot-toast';
import { usePermissionGuard } from '@/hooks/usePermissionGuard';
import AccessDenied from '@/components/common/AccessDenied';

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  start_date: string; // YYYY-MM-DD
  database: string;
  // Fields not supported by backend yet, but kept for UI compatibility (optional)
  start_time?: string;
  end_time?: string;
  type?: string;
  color?: string;
  location?: string;
}

export default function CalendarPage() {
  const { isAuthorized } = usePermissionGuard('manage calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [databases, setDatabases] = useState<CalendarDatabase[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('jo');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    database: 'jo',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);

  // Fetch Databases
  useEffect(() => {
    if (!isAuthorized) return;

    const fetchDatabases = async () => {
      try {
        const dbs = await calendarService.getDatabases();
        setDatabases(dbs);
        if (dbs.length > 0) {
          setSelectedDatabase(dbs[0].code);
          setFormData(prev => ({ ...prev, database: dbs[0].code }));
        }
      } catch (error) {
        console.error('Failed to fetch databases', error);
        toast.error('فشل تحميل قواعد البيانات');
      }
    };
    fetchDatabases();
  }, [isAuthorized]);

  const fetchEvents = useCallback(async () => {
    if (!selectedDatabase) return;

    setLoading(true);
    try {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });

      const data = await calendarService.getEvents({
        database: selectedDatabase,
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
      });

      // Transform API response to CalendarEvent
      const formattedEvents: CalendarEvent[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.extendedProps.description,
        start_date: (item.start || '').split('T')[0], // Ensure YYYY-MM-DD format
        database: item.extendedProps.database,
        color: '#3B82F6', // Default color
        type: 'event'
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Failed to fetch events', error);
      toast.error('فشل تحميل الأحداث');
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedDatabase]);

  // Fetch Events when date or database changes
  useEffect(() => {
    if (!isAuthorized) return;
    fetchEvents();
  }, [fetchEvents, isAuthorized]);

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return <AccessDenied />;
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => e.start_date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      if (direction === 'prev') {
        return subMonths(prev, 1);
      } else {
        return addMonths(prev, 1);
      }
    });
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
    setFormData(prev => ({ ...prev, start_date: dateStr }));
  };

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.start_date || !formData.database) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && selectedEvent) {
        await calendarService.update(selectedEvent.id, {
          title: formData.title,
          description: formData.description,
          event_date: formData.start_date,
          eventDatabase: formData.database,
        });
        toast.success('تم تحديث الحدث بنجاح');
      } else {
        await calendarService.create({
          title: formData.title,
          description: formData.description,
          event_date: formData.start_date,
          eventDatabase: formData.database,
        });
        toast.success('تم إضافة الحدث بنجاح');
      }

      // Refresh events
      await fetchEvents();
      
      setShowEventModal(false);
      setIsEditing(false);
      setFormData({
        title: '',
        description: '',
        start_date: '',
        database: selectedDatabase || 'jo',
      });
    } catch (error) {
      console.error('Failed to save event', error);
      toast.error('حدث خطأ أثناء حفظ الحدث');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (event: CalendarEvent) => {
      setEventToDelete(event);
      setShowDeleteModal(true);
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    setSaving(true);
    try {
      await calendarService.delete(eventToDelete.id, eventToDelete.database);
      toast.success('تم حذف الحدث بنجاح');
      // Refresh
      await fetchEvents();
      if (selectedEvent?.id === eventToDelete.id) setSelectedEvent(null);
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Failed to delete event', error);
      toast.error('حدث خطأ أثناء حذف الحدث');
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      title: '',
      description: '',
      start_date: selectedDate || new Date().toISOString().split('T')[0],
      database: selectedDatabase,
    });
    setShowEventModal(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setIsEditing(true);
    setFormData({
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      database: event.database,
    });
    setShowEventModal(true);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });
  
  const upcomingEvents = events
    .filter(e => {
        const eventDate = parseISO(e.start_date);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return eventDate >= todayStart;
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">التقويم</h1>
          <p className="text-muted-foreground">إدارة المواعيد والأحداث</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-40">
                <Select
                    label=""
                    value={selectedDatabase}
                    onChange={(e) => setSelectedDatabase(e.target.value)}
                    options={databases.map(db => ({ value: db.code, label: db.name }))}
                />
            </div>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            إضافة حدث
            </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {/* Calendar */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <CardTitle className="min-w-[150px] text-center text-xl">
                  {format(currentDate, 'MMMM yyyy', { locale: arSA })}
                </CardTitle>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                اليوم
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {/* Days header */}
              <div className="grid grid-cols-7 border-b">
                {DAYS_AR.map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-4 border-l last:border-l-0">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 auto-rows-fr bg-muted/20">
                {calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isDayToday = isDateToday(day);
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateStr;

                  return (
                    <motion.div
                      key={dateStr}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className={cn(
                        'min-h-[140px] p-2 border-b border-l last:border-l-0 transition-colors cursor-pointer relative group bg-card',
                        !isCurrentMonth && 'bg-muted/10 text-muted-foreground',
                        isDayToday && 'bg-primary/5',
                        isSelected && 'ring-2 ring-primary ring-inset z-10'
                      )}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                            'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                            isDayToday ? 'bg-primary text-primary-foreground' : 'text-foreground/70'
                        )}>
                            {format(day, 'd')}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={cn(
                                "text-xs px-2 py-1 rounded-md truncate transition-all hover:opacity-80 shadow-sm",
                                "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-100 border border-blue-200 dark:border-blue-800"
                            )}
                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1 font-medium">
                            +{dayEvents.length - 3} المزيد
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Selected Date Events */}
          {selectedDate && (
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-lg">
                  {format(parseISO(selectedDate), 'EEEE, d MMMM', { locale: arSA })}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {getEventsForDate(parseISO(selectedDate)).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>لا توجد أحداث في هذا اليوم</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getEventsForDate(parseISO(selectedDate)).map(event => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border bg-card hover:border-primary/50 cursor-pointer transition-all shadow-sm"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-primary">{event.title}</p>
                            {event.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {event.description}
                                </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  className="w-full mt-4"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, start_date: selectedDate }));
                    setShowEventModal(true);
                  }}
                >
                  إضافة حدث جديد
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                الأحداث القادمة
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                    <p>لا توجد أحداث قادمة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map(event => (
                    <div
                      key={event.id}
                      className="group flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="flex flex-col items-center min-w-[3rem] bg-muted/50 rounded-lg p-2 border">
                        <span className="text-xs font-medium text-muted-foreground">
                            {format(parseISO(event.start_date), 'MMM', { locale: arSA })}
                        </span>
                        <span className="text-lg font-bold text-foreground">
                            {format(parseISO(event.start_date), 'd')}
                        </span>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors cursor-pointer" onClick={() => setSelectedEvent(event)}>
                            {event.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                             <Clock className="w-3 h-3" />
                             <span>{format(parseISO(event.start_date), 'EEEE', { locale: arSA })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Event Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={isEditing ? 'تعديل الحدث' : 'إضافة حدث جديد'}
      >
        <div className="space-y-4 mt-4">
          <Input
            label="عنوان الحدث"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="مثال: اجتماع الفريق"
          />
          <Input
            label="التاريخ"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
          <Select
            label="قاعدة البيانات"
            value={formData.database}
            onChange={(e) => setFormData({ ...formData, database: e.target.value })}
            options={databases.map(db => ({ value: db.code, label: db.name }))}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="وصف الحدث (اختياري)"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowEventModal(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button onClick={handleSaveEvent} isLoading={saving}>
              {isEditing ? 'تحديث' : 'إضافة'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="تفاصيل الحدث"
      >
        {selectedEvent && (
          <div className="space-y-4 mt-4">
            <div className="flex items-start gap-3">
              <div>
                <h3 className="font-bold text-lg">{selectedEvent.title}</h3>
                <Badge variant="info">{selectedEvent.database}</Badge>
              </div>
            </div>

            {selectedEvent.description && (
              <p className="text-muted-foreground">{selectedEvent.description}</p>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span>
                  {format(parseISO(selectedEvent.start_date), 'EEEE, d MMMM yyyy', { locale: arSA })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t mt-4">
                <Button variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => confirmDelete(selectedEvent)} isLoading={saving}>
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                    إغلاق
                  </Button>
                  <Button onClick={() => {
                    setSelectedEvent(null);
                    openEditModal(selectedEvent);
                  }}>
                    <Edit className="w-4 h-4 ml-2" />
                    تعديل
                  </Button>
                </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="تأكيد الحذف"
      >
        <div className="space-y-4 mt-4">
            <p>هل أنت متأكد من رغبتك في حذف الحدث &quot;{eventToDelete?.title}&quot;؟</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  إلغاء
              </Button>
              <Button 
                  variant="ghost" 
                  className="bg-red-600 text-white hover:bg-red-700 hover:text-white"
                  onClick={handleDeleteEvent}
                  isLoading={saving}
              >
                  حذف
              </Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
