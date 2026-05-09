'use client';

import { createContext, useContext } from 'react';
import type { FrontSettings } from '@/lib/front-settings';

const FrontSettingsContext = createContext<FrontSettings | null>(null);

export function FrontSettingsProvider({
  settings,
  children,
}: {
  settings: FrontSettings;
  children: React.ReactNode;
}) {
  return (
    <FrontSettingsContext.Provider value={settings}>
      {children}
    </FrontSettingsContext.Provider>
  );
}

export function useFrontSettings(): FrontSettings {
  return useContext(FrontSettingsContext) ?? {};
}

