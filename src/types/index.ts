export type Locale = 'de' | 'fa';

export type Localized<T> = {
  de: T;
  fa: T;
};

export type Unit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'piece'
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'pinch';

export type Category = 'breakfast' | 'main' | 'snack' | 'sauce' | 'smoothie';

export const CATEGORIES: Category[] = [
  'breakfast',
  'main',
  'snack',
  'sauce',
  'smoothie',
];

export type Day = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const DAYS: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

export interface Ingredient {
  id: string;
  name: Localized<string>;
  amount: number;
  unit: Unit;
  calories?: number;
}

export interface Recipe {
  id: string;
  name: Localized<string>;
  description?: Localized<string>;
  category: Category;
  imageUrl: string;
  calories: number;
  caloriesPer100g?: number;
  prepTimeMinutes: number;
  servings: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: Ingredient[];
  instructions: Localized<string>[];
  isCustom?: boolean;
  addedAt?: number;
}

export interface ShoppingItem {
  id: string;
  recipeId: string;
  recipeName: Localized<string>;
  ingredientId: string;
  name: Localized<string>;
  amount: number;
  unit: Unit;
  quantity: number;
  checked: boolean;
  addedAt: number;
}

export type PlannerWeek = Partial<Record<Day, Partial<Record<MealSlot, string>>>>;
