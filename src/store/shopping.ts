import { deleteDoc, doc, runTransaction } from 'firebase/firestore';
import { create } from 'zustand';
import { db } from '../lib/firebase';
import { commitInBatches, messageFromError } from '../lib/firestoreBatch';
import { requiredShoppingItems } from '../lib/shoppingPlan';
import type { Ingredient, Recipe, ShoppingItem } from '../types';

interface ShoppingState {
  items: ShoppingItem[];
  hydrated: boolean;
  syncError: string | null;
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

async function deleteItem(id: string): Promise<void> {
  await deleteDoc(doc(db, 'shopping', id));
}

async function mutateItem(
  id: string,
  mutate: (item: ShoppingItem) => ShoppingItem,
): Promise<void> {
  const itemRef = doc(db, 'shopping', id);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(itemRef);
    if (!snapshot.exists()) return;
    transaction.set(itemRef, mutate(snapshot.data() as ShoppingItem));
  });
}

async function upsertItems(
  items: readonly ShoppingItem[],
  exactQuantity = false,
): Promise<void> {
  const chunkSize = 100;
  for (let start = 0; start < items.length; start += chunkSize) {
    const chunk = items.slice(start, start + chunkSize);
    await runTransaction(db, async (transaction) => {
      const refs = chunk.map((item) => doc(db, 'shopping', item.id));
      const snapshots = await Promise.all(refs.map((itemRef) => transaction.get(itemRef)));
      snapshots.forEach((snapshot, index) => {
        const desired = chunk[index]!;
        const remote = snapshot.exists() ? snapshot.data() as ShoppingItem : undefined;
        transaction.set(refs[index]!, remote
          ? {
              ...remote,
              recipeName: desired.recipeName,
              name: desired.name,
              amount: desired.amount,
              unit: desired.unit,
              quantity: exactQuantity
                ? desired.quantity
                : Math.max(remote.quantity, desired.quantity),
              checked: false,
            }
          : desired);
      });
    });
  }
}

export const useShopping = create<ShoppingState>()((set, get) => ({
  items: [],
  hydrated: false,
  syncError: null,
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
    set({ items: [...items, newItem], syncError: null });
    void upsertItems([newItem]).catch((error) =>
      set({ syncError: messageFromError(error) }),
    );
  },
  addRecipeAll: (recipe) => {
    const items = get().items;
    const nextById = new Map(items.map((item) => [item.id, item]));
    const changedItems: ShoppingItem[] = [];
    recipe.ingredients.forEach((ingredient, idx) => {
      const key = makeKey(recipe.id, ingredient.id);
      const existing = nextById.get(key);
      const next: ShoppingItem = existing
        ? {
            ...existing,
            recipeName: recipe.name,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            checked: false,
          }
        : {
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
      if (existing && JSON.stringify(existing) === JSON.stringify(next)) return;
      nextById.set(key, next);
      changedItems.push(next);
    });
    if (changedItems.length > 0) {
      set({ items: Array.from(nextById.values()), syncError: null });
      void upsertItems(changedItems).catch((error) =>
        set({ syncError: messageFromError(error) }),
      );
    }
    return changedItems.length;
  },
  addRecipesAll: (recipes) => {
    const items = get().items;
    const nextById = new Map(items.map((item) => [item.id, item]));
    const changedItems: ShoppingItem[] = [];
    let addedAt = Date.now();
    requiredShoppingItems(recipes).forEach(({ key, recipe, ingredient, quantity }) => {
      const existing = nextById.get(key);
      const next: ShoppingItem = existing
        ? {
            ...existing,
            recipeName: recipe.name,
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            quantity,
            checked: false,
          }
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
      if (!existing || JSON.stringify(existing) !== JSON.stringify(next)) {
        changedItems.push(next);
      }
    });

    if (changedItems.length > 0) {
      set({ items: Array.from(nextById.values()), syncError: null });
      void upsertItems(changedItems, true).catch((error) =>
        set({ syncError: messageFromError(error) }),
      );
    }
    return changedItems.length;
  },
  setQuantity: (id, quantity) => {
    const items = get().items;
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const next = { ...item, quantity: Math.max(1, Math.round(quantity)) };
    set({ items: items.map((it) => (it.id === id ? next : it)), syncError: null });
    void mutateItem(id, (remote) => ({ ...remote, quantity: next.quantity })).catch((error) =>
      set({ syncError: messageFromError(error) }),
    );
  },
  increment: (id) => {
    const items = get().items;
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const next = { ...item, quantity: item.quantity + 1 };
    set({ items: items.map((it) => (it.id === id ? next : it)), syncError: null });
    void mutateItem(id, (remote) => ({ ...remote, quantity: remote.quantity + 1 })).catch((error) =>
      set({ syncError: messageFromError(error) }),
    );
  },
  decrement: (id) => {
    const items = get().items;
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const next = { ...item, quantity: Math.max(1, item.quantity - 1) };
    set({ items: items.map((it) => (it.id === id ? next : it)), syncError: null });
    void mutateItem(id, (remote) => ({
      ...remote,
      quantity: Math.max(1, remote.quantity - 1),
    })).catch((error) =>
      set({ syncError: messageFromError(error) }),
    );
  },
  toggle: (id) => {
    const items = get().items;
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const next = { ...item, checked: !item.checked };
    set({ items: items.map((it) => (it.id === id ? next : it)), syncError: null });
    void mutateItem(id, (remote) => ({ ...remote, checked: !remote.checked })).catch((error) =>
      set({ syncError: messageFromError(error) }),
    );
  },
  remove: (id) => {
    set({ items: get().items.filter((it) => it.id !== id), syncError: null });
    void deleteItem(id).catch((error) =>
      set({ syncError: messageFromError(error) }),
    );
  },
  clearChecked: () => {
    const items = get().items;
    const checked = items.filter((it) => it.checked);
    set({ items: items.filter((it) => !it.checked), syncError: null });
    void commitInBatches(checked, (batch, item) =>
      batch.delete(doc(db, 'shopping', item.id)),
    ).catch((error) => set({ syncError: messageFromError(error) }));
  },
  clearAll: () => {
    const items = get().items;
    set({ items: [], syncError: null });
    void commitInBatches(items, (batch, item) =>
      batch.delete(doc(db, 'shopping', item.id)),
    ).catch((error) => set({ syncError: messageFromError(error) }));
  },
}));

export function writeShoppingItems(items: ShoppingItem[]): void {
  useShopping.setState({ items, hydrated: true, syncError: null });
}

export function writeShoppingSyncError(error: unknown): void {
  useShopping.setState({ syncError: messageFromError(error) });
}
