import { doc, runTransaction } from 'firebase/firestore';
import { create } from 'zustand';
import { db } from '../lib/firebase';
import { messageFromError } from '../lib/firestoreBatch';
import { clearWeekDay, moveWeekMeal, removeWeekMeal, setWeekMeal } from '../lib/plannerWeek';
import type { Day, MealSlot, PlannerWeek } from '../types';

interface PlannerState {
  week: PlannerWeek;
  hydrated: boolean;
  syncError: string | null;
  setMeal: (day: Day, slot: MealSlot, recipeId: string) => void;
  removeMeal: (day: Day, slot: MealSlot) => void;
  moveMeal: (fromDay: Day, fromSlot: MealSlot, toDay: Day, toSlot: MealSlot) => void;
  clearDay: (day: Day) => void;
  clearWeek: () => void;
  getRecipeIds: () => string[];
}

type WeekMutation = (week: PlannerWeek) => PlannerWeek;

async function persistMutation(mutate: WeekMutation): Promise<void> {
  const ref = doc(db, 'planner', 'week');
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data() as { week?: PlannerWeek } | undefined;
    transaction.set(ref, { week: mutate(data?.week ?? {}) });
  });
}

export const usePlanner = create<PlannerState>()((set, get) => ({
  week: {},
  hydrated: false,
  syncError: null,
  setMeal: (day, slot, recipeId) => {
    const mutate: WeekMutation = (week) => setWeekMeal(week, day, slot, recipeId);
    set({ week: mutate(get().week), syncError: null });
    void persistMutation(mutate).catch((error) =>
      set({ syncError: messageFromError(error) }),
    );
  },
  removeMeal: (day, slot) => {
    const mutate: WeekMutation = (week) => removeWeekMeal(week, day, slot);
    set({ week: mutate(get().week), syncError: null });
    void persistMutation(mutate).catch((error) =>
      set({ syncError: messageFromError(error) }),
    );
  },
  moveMeal: (fromDay, fromSlot, toDay, toSlot) => {
    if (fromDay === toDay && fromSlot === toSlot) return;
    const mutate: WeekMutation = (week) =>
      moveWeekMeal(week, fromDay, fromSlot, toDay, toSlot);
    set({ week: mutate(get().week), syncError: null });
    void persistMutation(mutate).catch((error) =>
      set({ syncError: messageFromError(error) }),
    );
  },
  clearDay: (day) => {
    const mutate: WeekMutation = (week) => clearWeekDay(week, day);
    set({ week: mutate(get().week), syncError: null });
    void persistMutation(mutate).catch((error) =>
      set({ syncError: messageFromError(error) }),
    );
  },
  clearWeek: () => {
    const mutate: WeekMutation = () => ({});
    set({ week: {}, syncError: null });
    void persistMutation(mutate).catch((error) =>
      set({ syncError: messageFromError(error) }),
    );
  },
  getRecipeIds: () => {
    const ids: string[] = [];
    Object.values(get().week).forEach((dayPlan) => {
      if (!dayPlan) return;
      Object.values(dayPlan).forEach((id) => {
        if (id) ids.push(id);
      });
    });
    return ids;
  },
}));

export function writePlannerWeek(week: PlannerWeek): void {
  usePlanner.setState({ week, hydrated: true, syncError: null });
}

export function writePlannerSyncError(error: unknown): void {
  usePlanner.setState({ syncError: messageFromError(error) });
}
