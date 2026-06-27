import {
  collection,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
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
    const existing = get().items.find((it) => it.id === key);
    if (existing) {
      void persistItem({ ...existing, quantity: existing.quantity + 1 });
      return;
    }
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
    void persistItem(newItem);
  },
  addRecipeAll: (recipe) => {
    const items = get().items;
    const batch = writeBatch(db);
    let touched = 0;
    recipe.ingredients.forEach((ingredient, idx) => {
      const key = makeKey(recipe.id, ingredient.id);
      const existing = items.find((it) => it.id === key);
      if (existing) {
        batch.update(doc(db, 'shopping', key), {
          quantity: existing.quantity + 1,
        });
      } else {
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
        batch.set(doc(db, 'shopping', key), newItem);
      }
      touched += 1;
    });
    void batch.commit();
    return touched;
  },
  addRecipesAll: (recipes) => {
    const items = [...get().items];
    const batch = writeBatch(db);
    let touched = 0;
    let baseTime = Date.now();
    const inBatch = new Map<string, ShoppingItem>(
      items.map((it) => [it.id, it]),
    );
    recipes.forEach((recipe) => {
      recipe.ingredients.forEach((ingredient, idx) => {
        const key = makeKey(recipe.id, ingredient.id);
        const existing = inBatch.get(key);
        if (existing) {
          const next = { ...existing, quantity: existing.quantity + 1 };
          inBatch.set(key, next);
          batch.set(doc(db, 'shopping', key), next);
        } else {
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
            addedAt: baseTime + idx,
          };
          inBatch.set(key, newItem);
          batch.set(doc(db, 'shopping', key), newItem);
        }
        touched += 1;
      });
      baseTime += 1000;
    });
    void batch.commit();
    return touched;
  },
  setQuantity: (id, quantity) => {
    void updateDoc(doc(db, 'shopping', id), {
      quantity: Math.max(1, Math.round(quantity)),
    });
  },
  increment: (id) => {
    const item = get().items.find((it) => it.id === id);
    if (!item) return;
    void updateDoc(doc(db, 'shopping', id), { quantity: item.quantity + 1 });
  },
  decrement: (id) => {
    const item = get().items.find((it) => it.id === id);
    if (!item) return;
    void updateDoc(doc(db, 'shopping', id), {
      quantity: Math.max(1, item.quantity - 1),
    });
  },
  toggle: (id) => {
    const item = get().items.find((it) => it.id === id);
    if (!item) return;
    void updateDoc(doc(db, 'shopping', id), { checked: !item.checked });
  },
  remove: (id) => {
    void deleteItem(id);
  },
  clearChecked: () => {
    const items = get().items;
    const batch = writeBatch(db);
    items
      .filter((it) => it.checked)
      .forEach((it) => batch.delete(doc(db, 'shopping', it.id)));
    void batch.commit();
  },
  clearAll: () => {
    const items = get().items;
    const batch = writeBatch(db);
    items.forEach((it) => batch.delete(doc(collection(db, 'shopping'), it.id)));
    void batch.commit();
  },
}));

export function writeShoppingItems(items: ShoppingItem[]): void {
  useShopping.setState({ items, hydrated: true });
}
