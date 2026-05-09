'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface ThemeState {
  isDarkMode: boolean;
  primaryColor: string;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  setPrimaryColor: (color: string) => void;
}

interface SidebarState {
  isOpen: boolean;
  toggleSidebar: () => void;
  setSidebar: (value: boolean) => void;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

interface SettingsState {
  siteName: string;
  siteEmail: string;
  siteUrl: string;
  siteLogo: string | null;
  siteFavicon: string | null;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  recaptchaSiteKey: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    whatsapp?: string;
    youtube?: string;
    tiktok?: string;
  };
  setSiteName: (name: string) => void;
  setSiteLogo: (logo: string) => void;
  setSiteFavicon: (favicon: string) => void;
  setSettings: (settings: Partial<SettingsState>) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      primaryColor: '#696cff',
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (value) => set({ isDarkMode: value }),
      setPrimaryColor: (color) => set({ primaryColor: color }),
    }),
    {
      name: 'theme-storage',
      skipHydration: true,
    }
  )
);

interface CountryState {
  country: {
    id: string;
    code: string;
    name: string;
  };
  setCountry: (country: CountryState['country']) => void;
}

export const useCountryStore = create<CountryState>()(
  persist(
    (set) => ({
      country: { id: '1', code: 'jo', name: 'الأردن' },
      setCountry: (country) => set({ country }),
    }),
    {
      name: 'country-storage',
      skipHydration: true,
    }
  )
);

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  setSidebar: (value) => set({ isOpen: value }),
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'auth-storage',
      skipHydration: true,
    }
  )
);

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      siteName: '',
      siteEmail: '',
      siteUrl: '',
      siteLogo: null,
      siteFavicon: null,
      siteDescription: '',
      contactEmail: '',
      contactPhone: '',
      contactAddress: '',
      recaptchaSiteKey: '',
      socialLinks: {},
      setSiteName: (name) => set({ siteName: name }),
      setSiteLogo: (logo) => set({ siteLogo: logo }),
      setSiteFavicon: (favicon) => set({ siteFavicon: favicon }),
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: 'settings-storage',
      skipHydration: true,
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState;
        const siteNameValue = typeof persistedState.siteName === 'string' ? persistedState.siteName.trim() : '';
        if (siteNameValue.toLowerCase() === 'rank') {
          return { ...persistedState, siteName: '' };
        }
        return persistedState;
      },
    }
  )
);
