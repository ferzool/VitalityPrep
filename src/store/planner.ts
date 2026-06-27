import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Day, MealSlot, PlannerWeek } from '../types';

interface PlannerState {
  week: PlannerWeek;
  hydrated: boolean;
  setMeal: (day: Day, slot: MealSlot, recipeId: string) => void;
  removeMeal: (day: Day, slot: MealSlot) => void;
  clearDay: (day: Day) => void;
  clearWeek: () => void;
  getRecipeIds: () => string[];
}

export const usePlanner = create<PlannerState>()(
  persist(
    (set, get) => ({
      week: {},
      hydrated: false,
      setMeal: (day, slot, recipeId) =>
        set((state) => {
          const dayPlan = { ...(state.week[day] ?? {}) };
          dayPlan[slot] = recipeId;
          return { week: { ...state.week, [day]: dayPlan } };
        }),
      removeMeal: (day, slot) =>
        set((state) => {
          const dayPlan = { ...(state.week[day] ?? {}) };
          delete dayPlan[slot];
          const nextWeek = { ...state.week };
          if (Object.keys(dayPlan).length === 0) {
            delete nextWeek[day];
          } else {
            nextWeek[day] = dayPlan;
          }
          return { week: nextWeek };
        }),
      clearDay: (day) =>
        set((state) => {
          const nextWeek = { ...state.week };
          delete nextWeek[day];
          return { week: nextWeek };
        }),
      clearWeek: () => set({ week: {} }),
      getRecipeIds: () => {
        const ids: string[] = [];
        const week = get().week;
        Object.values(week).forEach((dayPlan) => {
          if (!dayPlan) return;
          Object.values(dayPlan).forEach((id) => {
            if (id) ids.push(id);
          });
        });
        return ids;
      },
    }),
    {
      name: 'vitality-prep:planner',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ week: state.week }),
      onRehydrateStorage: () => () => {
        usePlanner.setState({ hydrated: true });
      },
    },
  ),
);
