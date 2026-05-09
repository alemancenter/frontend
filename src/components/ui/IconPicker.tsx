'use client';

import { useState, useMemo, useId } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const uniqueId = useId();
  const inputId = `icon-picker-input-${uniqueId}`;
  const searchId = `icon-picker-search-${uniqueId}`;

  // Get all valid icon names
  const iconList = useMemo(() => {
    return Object.keys(LucideIcons)
      .filter((key) => key !== 'createLucideIcon' && key !== 'default') // Filter out utility functions if any
      .sort();
  }, []);

  const filteredIcons = useMemo(() => {
    if (!search) return iconList.slice(0, 100); // Show first 100 by default for performance
    const lowerSearch = search.toLowerCase();
    return iconList.filter((name) => name.toLowerCase().includes(lowerSearch)).slice(0, 100);
  }, [iconList, search]);

  const SelectedIcon = value && (LucideIcons as any)[value] ? (LucideIcons as any)[value] : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={inputId}
            name="icon"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="اسم الأيقونة (مثلاً Home)"
            className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm pl-10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {SelectedIcon ? <SelectedIcon className="w-5 h-5" /> : <Search className="w-4 h-4" />}
          </div>
        </div>
        <Button onClick={() => setIsOpen(true)} variant="outline" type="button">
          اختر أيقونة
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="مكتبة الأيقونات"
        size="lg"
      >
        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              id={searchId}
              name="icon-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن أيقونة..."
              className="w-full rounded-lg border border-border bg-muted px-4 py-3 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
            {filteredIcons.map((iconName) => {
              const Icon = (LucideIcons as any)[iconName];
              if (!Icon) return null;
              
              return (
                <button
                  key={iconName}
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                  className={`
                    flex flex-col items-center justify-center gap-2 p-2 rounded-lg border transition-all hover:bg-primary/5 hover:border-primary/50
                    ${value === iconName ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'border-transparent hover:shadow-sm'}
                  `}
                    title={iconName}
                    aria-label={iconName}
                    type="button"
                  >
                  <Icon className="w-6 h-6 text-slate-700" />
                </button>
              );
            })}
            {filteredIcons.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                لا توجد أيقونات تطابق بحثك
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-border">
             <span className="text-xs text-muted-foreground">
               يتم عرض {filteredIcons.length} من أصل {iconList.length} أيقونة
             </span>
             <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
               إغلاق
             </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
