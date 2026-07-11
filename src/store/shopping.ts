import { deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';
import { create } from 'zustand';
import { db } from '../lib/firebase';
import type { Ingredient, Recipe, ShoppingItem } from '../types';

interface ShoppingState {
  items: ShoppingItem[];
  hydrated: boolean;
  addIngredient: (recipe: Recipe, ingredient: Ingredient) => void;
  addRecipeAll: (recipe: Recipe) => number;
  addRecipesAll: (recipes: Recipe[]) => number;
  setQuantity: (id: string, quantity: number) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clearChecked: () => void;
  clearAll: () => void;
}

const makeKey = (recipeId: string, ingredientId: string) =>
  `${recipeId}::${ingredientId}`;

async function persistItem(item: ShoppingItem): Promise<void> {
  await setDoc(doc(db, 'shopping', item.id), item);
}

async function deleteItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'shopping', id));
}

export const useShopping = create<ShoppingState>()((set, get) => ({
  items: [],
  hydrated: false,
  addIngredient: (recipe, ingredient) => {
    const key = makeKey(recipe.id, ingredient.id);
    const items = get().items;
    if (items.some((it) => it.id === key)) return;
    const newItem: ShoppingItem = {
      id: key,
      recipeId: recipe.id,
      recipeName: recipe.name,
      ingredientId: ingredient.id,
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      quantity: 1,
      checked: false,
      addedAt: Date.now(),
    };
    set({ items: [...items, newItem] });
    void persistItem(newItem);
  },
  addRecipeAll: (recipe) => {
    const items = get().items;
    const nextById = new Map(items.map((item) => [item.id, item]));
    const batch = writeBatch(db);
    let added = 0;
    recipe.ingredients.forEach((ingredient, idx) => {
      const key = makeKey(recipe.id, ingredient.id);
      if (nextById.has(key)) return;
      const newItem: ShoppingItem = {
        id: key,
        recipeId: recipe.id,
        recipeName: recipe.name,
        ingredientId: ingredient.id,
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit,
        quantity: 1,
        checked: false,
        addedAt: Date.now() + idx,
      };
      nextById.set(key, newItem);
      batch.set(doc(db, 'shopping', key), newItem);
      added += 1;
    });
    if (added > 0) {
      set({ items: Array.from(nextById.values()) });
      void batch.commit();
    }
    return added;
  },
  addRecipesAll: (recipes) => {
    const items = get().items;
    const batch = writeBatch(db);
    const nextById = new Map(items.map((item) => [item.id, item]));
    const required = new Map<
      string,
      { recipe: Recipe; ingredient: Ingredient; quantity: number }
    >();

    recipes.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient) => {
        const key = makeKey(recipe.id, ingredient.id);
        const entry = required.get(key);
        required.set(key, {
          recipe,
          ingredient,
          quantity: (entry?.quantity ?? 0) + 1,
        });
      });
    });

    let changed = 0;
    let addedAt = Date.now();
    required.forEach(({ recipe, ingredient, quantity }, key) => {
      const existing = nextById.get(key);
      if (existing && existing.quantity >= quantity) return;
      const next: ShoppingItem = existing
        ? { ...existing, quantity }
        : {
            id: key,
            recipeId: recipe.id,
            recipeName: recipe.name,
            ingredientId: ingredient.id,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            quantity,
            checked: false,
            addedAt: addedAt++,
          };
      nextById.set(key, next);
      batch.set(doc(db, 'shopping', key), next);
      changed += 1;
    });

    if (changed > 0) {
      set({ items: Array.from(nextById.values()) });
      void batch.commit();
    }
    return changed;
  },
  setQuantity: (id, quantity) => {
    const items = get().items;
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const next = { ...item, quantity: Math.max(1, Math.round(quantity)) };
    set({ items: items.map((it) => (it.id === id ? next : it)) });
    void persistItem(next);
  },
  increment: (id) => {
    const items = get().items;
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const next = { ...item, quantity: item.quantity + 1 };
    set({ items: items.map((it) => (it.id === id ? next : it)) });
    void persistItem(next);
  },
  decrement: (id) => {
    const items = get().items;
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const next = { ...item, quantity: Math.max(1, item.quantity - 1) };
    set({ items: items.map((it) => (it.id === id ? next : it)) });
    void persistItem(next);
  },
  toggle: (id) => {
    const items = get().items;
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const next = { ...item, checked: !item.checked };
    set({ items: items.map((it) => (it.id === id ? next : it)) });
    void persistItem(next);
  },
  remove: (id) => {
    set({ items: get().items.filter((it) => it.id !== id) });
    void deleteItem(id);
  },
  clearChecked: () => {
    const items = get().items;
    const batch = writeBatch(db);
    const checked = items.filter((it) => it.checked);
    set({ items: items.filter((it) => !it.checked) });
    checked.forEach((it) => batch.delete(doc(db, 'shopping', it.id)));
    void batch.commit();
  },
  clearAll: () => {
    const items = get().items;
    const batch = writeBatch(db);
    set({ items: [] });
    items.forEach((it) => batch.delete(doc(db, 'shopping', it.id)));
    void batch.commit();
  },
}));

export function writeShoppingItems(items: ShoppingItem[]): void {
  useShopping.setState({ items, hydrated: true });
}
