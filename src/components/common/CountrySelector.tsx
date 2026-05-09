'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion-lite';
import { Check, ChevronDown } from 'lucide-react';
import Image from '@/components/common/AppImage';
import { useCountryStore } from '@/store/useStore';
import { COUNTRIES } from '@/lib/api/config';
import { cn } from '@/lib/utils';

const FLAG_MAPPING: Record<string, string> = {
  jo: 'jordan.svg',
  sa: 'saudi.svg',
  eg: 'egypt.svg',
  ps: 'palestine.svg',
};

function getFlagUrl(code: string) {
  return `/assets/img/flags/${FLAG_MAPPING[code.toLowerCase()] || 'jordan.svg'}`;
}

export default function CountrySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { country: selectedCountry, setCountry } = useCountryStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const shouldReloadRef = useRef(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country: typeof COUNTRIES[number]) => {
    shouldReloadRef.current = true;
    setCountry(country);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!shouldReloadRef.current) return;
    document.cookie = `country_id=${selectedCountry.id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    document.cookie = `country_code=${selectedCountry.code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

    // Check if URL contains country code and update it
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/');
    const countryCodes = COUNTRIES.map(c => c.code);

    // pathParts[0] is empty because path starts with /
    if (pathParts.length > 1 && countryCodes.includes(pathParts[1] as any)) {
      pathParts[1] = selectedCountry.code;
      const newPath = pathParts.join('/');
      window.location.href = newPath + window.location.search + window.location.hash;
    } else {
      window.location.reload();
    }
  }, [selectedCountry]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors border border-transparent hover:border-border"
        aria-label="اختر الدولة"
        title={selectedCountry.name}
      >
        <div className="w-6 h-6 rounded-full overflow-hidden shadow-sm flex items-center justify-center bg-white relative">
          <Image 
            src={getFlagUrl(selectedCountry.code)} 
            alt={selectedCountry.name}
            fill
            sizes="24px"
            className="object-cover"
          />
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 w-56 max-h-80 overflow-y-auto bg-card border border-border rounded-xl shadow-lg py-1 z-50 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent"
          >
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
              اختر الدولة
            </div>
            {COUNTRIES.map((country) => (
              <button
                key={country.id}
                onClick={() => handleSelect(country)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-secondary/50",
                  selectedCountry.id === country.id ? "text-primary font-medium bg-primary/5" : "text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full overflow-hidden shadow-sm flex items-center justify-center bg-white relative">
                    <Image 
                      src={getFlagUrl(country.code)} 
                      alt={country.name}
                      fill
                      sizes="20px"
                      className="object-cover"
                    />
                  </div>
                  <span>{country.name}</span>
                </div>
                {selectedCountry.id === country.id && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

