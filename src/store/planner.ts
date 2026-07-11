import { doc, setDoc } from 'firebase/firestore';
import { create } from 'zustand';
import { db } from '../lib/firebase';
import type { Day, MealSlot, PlannerWeek } from '../types';

interface PlannerState {
  week: PlannerWeek;
  hydrated: boolean;
  setMeal: (day: Day, slot: MealSlot, recipeId: string) => void;
  removeMeal: (day: Day, slot: MealSlot) => void;
  moveMeal: (fromDay: Day, fromSlot: MealSlot, toDay: Day, toSlot: MealSlot) => void;
  clearDay: (day: Day) => void;
  clearWeek: () => void;
  getRecipeIds: () => string[];
}

async function persistWeek(week: PlannerWeek): Promise<void> {
  await setDoc(doc(db, 'planner', 'week'), { week });
}

export const usePlanner = create<PlannerState>()((set, get) => ({
  week: {},
  hydrated: false,
  setMeal: (day, slot, recipeId) => {
    const week = get().week;
    const dayPlan = { ...(week[day] ?? {}) };
    dayPlan[slot] = recipeId;
    const next = { ...week, [day]: dayPlan };
    set({ week: next });
    void persistWeek(next);
  },
  removeMeal: (day, slot) => {
    const week = get().week;
    const dayPlan = { ...(week[day] ?? {}) };
    delete dayPlan[slot];
    const next = { ...week };
    if (Object.keys(dayPlan).length === 0) {
      delete next[day];
    } else {
      next[day] = dayPlan;
    }
    set({ week: next });
    void persistWeek(next);
  },
  moveMeal: (fromDay, fromSlot, toDay, toSlot) => {
    if (fromDay === toDay && fromSlot === toSlot) return;
    const week = get().week;
    const recipeId = week[fromDay]?.[fromSlot];
    if (!recipeId) return;

    const sourceDay = { ...(week[fromDay] ?? {}) };
    const targetDay = fromDay === toDay
      ? sourceDay
      : { ...(week[toDay] ?? {}) };
    const replacedRecipeId = targetDay[toSlot];

    delete sourceDay[fromSlot];
    targetDay[toSlot] = recipeId;
    if (replacedRecipeId) sourceDay[fromSlot] = replacedRecipeId;

    const next = { ...week };
    if (Object.keys(sourceDay).length === 0) delete next[fromDay];
    else next[fromDay] = sourceDay;
    next[toDay] = targetDay;
    set({ week: next });
    void persistWeek(next);
  },
  clearDay: (day) => {
    const week = get().week;
    const next = { ...week };
    delete next[day];
    set({ week: next });
    void persistWeek(next);
  },
  clearWeek: () => {
    set({ week: {} });
    void persistWeek({});
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
  usePlanner.setState({ week, hydrated: true });
}
