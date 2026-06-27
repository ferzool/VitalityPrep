import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Locale } from '../types';

interface SettingsState {
  locale: Locale;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        state?.setLocale(state.locale);
        useSettings.setState({ hydrated: true });
      },
    },
  ),
);
