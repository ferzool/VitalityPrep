import type { Day, MealSlot, PlannerWeek } from '../types';

export function setWeekMeal(
  week: PlannerWeek,
  day: Day,
  slot: MealSlot,
  recipeId: string,
): PlannerWeek {
  return { ...week, [day]: { ...(week[day] ?? {}), [slot]: recipeId } };
}

export function removeWeekMeal(
  week: PlannerWeek,
  day: Day,
  slot: MealSlot,
): PlannerWeek {
  const dayPlan = { ...(week[day] ?? {}) };
  delete dayPlan[slot];
  const next = { ...week };
  if (Object.keys(dayPlan).length === 0) delete next[day];
  else next[day] = dayPlan;
  return next;
}

export function moveWeekMeal(
  week: PlannerWeek,
  fromDay: Day,
  fromSlot: MealSlot,
  toDay: Day,
  toSlot: MealSlot,
): PlannerWeek {
  if (fromDay === toDay && fromSlot === toSlot) return week;
  const recipeId = week[fromDay]?.[fromSlot];
  if (!recipeId) return week;
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
  return next;
}

export function clearWeekDay(week: PlannerWeek, day: Day): PlannerWeek {
  const next = { ...week };
  delete next[day];
  return next;
}
