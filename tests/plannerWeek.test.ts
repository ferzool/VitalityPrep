import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearWeekDay,
  moveWeekMeal,
  removeWeekMeal,
  setWeekMeal,
} from '../src/lib/plannerWeek';
import type { PlannerWeek } from '../src/types';

test('moves a meal across days without losing unrelated slots', () => {
  const week: PlannerWeek = {
    mon: { breakfast: 'a', dinner: 'b' },
    tue: { lunch: 'c' },
  };
  assert.deepEqual(moveWeekMeal(week, 'mon', 'breakfast', 'wed', 'lunch'), {
    mon: { dinner: 'b' },
    tue: { lunch: 'c' },
    wed: { lunch: 'a' },
  });
});

test('swaps occupied slots atomically', () => {
  const week: PlannerWeek = {
    mon: { breakfast: 'a' },
    tue: { dinner: 'b' },
  };
  assert.deepEqual(moveWeekMeal(week, 'mon', 'breakfast', 'tue', 'dinner'), {
    mon: { breakfast: 'b' },
    tue: { dinner: 'a' },
  });
});

test('set, remove, and clear preserve immutable input', () => {
  const week: PlannerWeek = { mon: { breakfast: 'a', dinner: 'b' } };
  const withLunch = setWeekMeal(week, 'tue', 'lunch', 'c');
  const removed = removeWeekMeal(withLunch, 'mon', 'breakfast');
  const cleared = clearWeekDay(removed, 'tue');
  assert.deepEqual(week, { mon: { breakfast: 'a', dinner: 'b' } });
  assert.deepEqual(cleared, { mon: { dinner: 'b' } });
});
