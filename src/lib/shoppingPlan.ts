import type { Ingredient, Recipe } from '../types';

export interface RequiredShoppingItem {
  key: string;
  recipe: Recipe;
  ingredient: Ingredient;
  quantity: number;
}

export function requiredShoppingItems(
  recipes: readonly Recipe[],
): RequiredShoppingItem[] {
  const required = new Map<string, RequiredShoppingItem>();
  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const key = `${recipe.id}::${ingredient.id}`;
      const existing = required.get(key);
      required.set(key, {
        key,
        recipe,
        ingredient,
        quantity: (existing?.quantity ?? 0) + 1,
      });
    });
  });
  return Array.from(required.values());
}
