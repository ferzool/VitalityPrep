import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
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

function mergeRecipeIntoItems(
  items: ShoppingItem[],
  recipe: Recipe,
): { items: ShoppingItem[]; touched: number } {
  const map = new Map(items.map((it) => [it.id, it]));
  const next = [...items];
  let touched = 0;
  recipe.ingredients.forEach((ingredient, idx) => {
    const key = makeKey(recipe.id, ingredient.id);
    const existing = map.get(key);
    if (existing) {
      const at = next.findIndex((it) => it.id === key);
      if (at !== -1) next[at] = { ...existing, quantity: existing.quantity + 1 };
    } else {
      next.unshift({
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
      });
    }
    touched += 1;
  });
  return { items: next, touched };
}

export const useShopping = create<ShoppingState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      addIngredient: (recipe, ingredient) =>
        set((state) => {
          const key = makeKey(recipe.id, ingredient.id);
          const existing = state.items.find((it) => it.id === key);
          if (existing) {
            return {
              items: state.items.map((it) =>
                it.id === key ? { ...it, quantity: it.quantity + 1 } : it,
              ),
            };
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
          return { items: [newItem, ...state.items] };
        }),
      addRecipeAll: (recipe) => {
        let touched = 0;
        set((state) => {
          const res = mergeRecipeIntoItems(state.items, recipe);
          touched = res.touched;
          return { items: res.items };
        });
        return touched;
      },
      addRecipesAll: (recipes) => {
        let touched = 0;
        set((state) => {
          let acc = state.items;
          recipes.forEach((r) => {
            const res = mergeRecipeIntoItems(acc, r);
            acc = res.items;
            touched += res.touched;
          });
          return { items: acc };
        });
        return touched;
      },
      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id ? { ...it, quantity: Math.max(1, Math.round(quantity)) } : it,
          ),
        })),
      increment: (id) =>
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id ? { ...it, quantity: it.quantity + 1 } : it,
          ),
        })),
      decrement: (id) =>
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it,
          ),
        })),
      toggle: (id) =>
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id ? { ...it, checked: !it.checked } : it,
          ),
        })),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((it) => it.id !== id) })),
      clearChecked: () =>
        set((state) => ({ items: state.items.filter((it) => !it.checked) })),
      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'vitality-prep:shopping',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (rehydrated) => {
        const items = rehydrated?.items;
        if (items) {
          const migrated = items.map((it) => ({
            ...it,
            quantity:
              typeof it.quantity === 'number' && it.quantity > 0 ? it.quantity : 1,
          }));
          useShopping.setState({ items: migrated, hydrated: true });
        } else {
          useShopping.setState({ hydrated: true });
        }
      },
    },
  ),
);
