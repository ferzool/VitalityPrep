import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { Locale } from '../types';

interface SettingsState {
  locale: Locale;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const safeStorage: StateStorage =
  Platform.OS === 'web' && typeof window === 'undefined'
    ? noopStorage
    : AsyncStorage;

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      locale: 'de',
      hydrated: false,
      setLocale: (locale) => set({ locale }),
      toggleLocale: () =>
        set({ locale: get().locale === 'de' ? 'fa' : 'de' }),
    }),
    {
      name: 'vitality-prep:settings',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setLocale(state.locale);
        useSettings.setState({ hydrated: true });
      },
    },
  ),
);
