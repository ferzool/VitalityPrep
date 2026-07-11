import assert from 'node:assert/strict';
import test from 'node:test';
import { requiredShoppingItems } from '../src/lib/shoppingPlan';
import type { Recipe } from '../src/types';

const recipe: Recipe = {
  id: 'recipe-a',
  name: { de: 'A', fa: 'A' },
  category: 'main',
  imageUrl: '',
  calories: 1,
  prepTimeMinutes: 1,
  servings: 1,
  macros: { protein: 0, carbs: 0, fat: 0 },
  ingredients: [
    { id: 'rice', name: { de: 'Reis', fa: 'برنج' }, amount: 100, unit: 'g' },
    { id: 'salt', name: { de: 'Salz', fa: 'نمک' }, amount: 1, unit: 'pinch' },
  ],
  instructions: [],
};

test('weekly requirements count repeated planned recipes without duplicate rows', () => {
  const required = requiredShoppingItems([recipe, recipe, recipe]);
  assert.equal(required.length, 2);
  assert.deepEqual(
    required.map((item) => [item.key, item.quantity]),
    [['recipe-a::rice', 3], ['recipe-a::salt', 3]],
  );
});
