import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { create } from 'zustand';
import { seedRecipes } from '../data/recipes';
import { auth, db, storage } from '../lib/firebase';
import { commitInBatches, messageFromError } from '../lib/firestoreBatch';
import type { Recipe } from '../types';
import type { PlannerWeek } from '../types';

interface RecipesState {
  recipes: Recipe[];
  hydrated: boolean;
  syncError: string | null;
  addRecipe: (recipe: Recipe) => Promise<void>;
  removeRecipe: (id: string) => Promise<void>;
  updateRecipe: (id: string, patch: Partial<Recipe>) => Promise<void>;
  resetCustom: () => Promise<void>;
  getById: (id: string) => Recipe | undefined;
  findByName: (deName?: string, faName?: string) => Recipe | undefined;
  addOrUpdateByName: (recipe: Recipe) => Promise<{ id: string; isUpdate: boolean }>;
}

function normalizeName(name?: string): string {
  return (name ?? '').trim().toLowerCase();
}

function findByNames(
  recipes: Recipe[],
  deName?: string,
  faName?: string,
): Recipe | undefined {
  const de = normalizeName(deName);
  const fa = normalizeName(faName);
  if (!de && !fa) return undefined;
  return recipes.find((r) => {
    const rDe = normalizeName(r.name.de);
    const rFa = normalizeName(r.name.fa);
    if (de && rDe && rDe === de) return true;
    if (fa && rFa && rFa === fa) return true;
    return false;
  });
}

function prepareRecipe(recipe: Recipe): Recipe {
  const user = auth.currentUser;
  return {
    ...recipe,
    addedAt: recipe.addedAt ?? Date.now(),
    ...(recipe.isCustom && !recipe.ownerId && user
      ? { ownerId: user.uid, ownerName: user.displayName ?? undefined }
      : {}),
  };
}

async function writeRecipeDoc(recipe: Recipe): Promise<void> {
  const doc$ = doc(db, 'recipes', recipe.id);
  await setDoc(doc$, recipe);
}

async function cleanupOwnedImage(imageUrl: string): Promise<void> {
  if (!imageUrl.includes('firebasestorage')) return;
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) return;
  const imageRef = ref(storage, imageUrl);
  if (!imageRef.fullPath.startsWith(`recipe-images/${currentUid}/`)) return;
  await deleteObject(imageRef).catch((error) => {
    if ((error as { code?: string }).code !== 'storage/object-not-found') {
      console.warn('recipe image cleanup failed', error);
    }
  });
}

async function reconcileRecipeShopping(recipe: Recipe): Promise<void> {
  const snapshot = await getDocs(
    query(collection(db, 'shopping'), where('recipeId', '==', recipe.id)),
  );
  const ingredients = new Map(recipe.ingredients.map((item) => [item.id, item]));
  const operations = snapshot.docs.map((document) => {
    const item = document.data() as import('../types').ShoppingItem;
    const ingredient = ingredients.get(item.ingredientId);
    return { document, item, ingredient };
  });
  await commitInBatches(operations, (batch, operation) => {
    if (!operation.ingredient) {
      batch.delete(operation.document.ref);
      return;
    }
    batch.set(operation.document.ref, {
      ...operation.item,
      recipeName: recipe.name,
      name: operation.ingredient.name,
      amount: operation.ingredient.amount,
      unit: operation.ingredient.unit,
    });
  });
}

async function deleteRecipeCascade(recipe: Recipe): Promise<void> {
  const plannerRef = doc(db, 'planner', 'week');
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(plannerRef);
    const data = snapshot.data() as { week?: PlannerWeek } | undefined;
    const week = data?.week ?? {};
    const next: PlannerWeek = {};
    Object.entries(week).forEach(([day, dayPlan]) => {
      if (!dayPlan) return;
      const clean = Object.fromEntries(
        Object.entries(dayPlan).filter(([, recipeId]) => recipeId !== recipe.id),
      );
      if (Object.keys(clean).length > 0) {
        next[day as keyof PlannerWeek] = clean;
      }
    });
    transaction.set(plannerRef, { week: next });
  });

  const shopping = await getDocs(
    query(collection(db, 'shopping'), where('recipeId', '==', recipe.id)),
  );
  const refs = [doc(db, 'recipes', recipe.id), ...shopping.docs.map((item) => item.ref)];
  await commitInBatches(refs, (batch, documentRef) => batch.delete(documentRef));

  await cleanupOwnedImage(recipe.imageUrl);
}

export const useRecipes = create<RecipesState>()((set, get) => ({
  recipes: [],
  hydrated: false,
  syncError: null,
  addRecipe: async (recipe) => {
    const previous = get().recipes;
    const next = prepareRecipe({ ...recipe, isCustom: true });
    set({ recipes: [...previous.filter((item) => item.id !== next.id), next], syncError: null });
    try {
      await writeRecipeDoc(next);
    } catch (error) {
      set({ recipes: previous, syncError: messageFromError(error) });
      throw error;
    }
  },
  removeRecipe: async (id) => {
    const previous = get().recipes;
    const recipe = previous.find((item) => item.id === id);
    if (!recipe) return;
    set({ recipes: previous.filter((item) => item.id !== id), syncError: null });
    try {
      await deleteRecipeCascade(recipe);
    } catch (error) {
      set({ recipes: previous, syncError: messageFromError(error) });
      throw error;
    }
  },
  updateRecipe: async (id, patch) => {
    const previous = get().recipes;
    const existing = previous.find((r) => r.id === id);
    if (!existing) return;
    const next = prepareRecipe({ ...existing, ...patch });
    set({
      recipes: previous.map((item) => (item.id === id ? next : item)),
      syncError: null,
    });
    try {
      await writeRecipeDoc(next);
      if (existing.imageUrl !== next.imageUrl) await cleanupOwnedImage(existing.imageUrl);
      await reconcileRecipeShopping(next).catch((error) =>
        set({ syncError: messageFromError(error) }),
      );
    } catch (error) {
      set({ recipes: previous, syncError: messageFromError(error) });
      throw error;
    }
  },
  resetCustom: async () => {
    const recipes = get().recipes;
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) throw new Error('not signed in');
    const seedIds = new Set(seedRecipes.map((r) => r.id));
    const owned = recipes.filter((r) => !seedIds.has(r.id) && r.ownerId === currentUid);
    set({
      recipes: recipes.filter((r) => !owned.some((ownedRecipe) => ownedRecipe.id === r.id)),
      syncError: null,
    });
    try {
      for (const recipe of owned) await deleteRecipeCascade(recipe);
      await commitInBatches(seedRecipes, (batch, recipe) =>
        batch.set(doc(db, 'recipes', recipe.id), recipe),
      );
    } catch (error) {
      set({ recipes, syncError: messageFromError(error) });
      throw error;
    }
  },
  getById: (id) => get().recipes.find((r) => r.id === id),
  findByName: (deName, faName) => findByNames(get().recipes, deName, faName),
  addOrUpdateByName: async (recipe) => {
    const existing = findByNames(
      get().recipes,
      recipe.name.de,
      recipe.name.fa,
    );
    if (existing) {
      const next = prepareRecipe({
        ...existing,
        name: recipe.name,
        description: recipe.description,
        category: recipe.category,
        imageUrl: recipe.imageUrl || existing.imageUrl,
        calories: recipe.calories,
        prepTimeMinutes: recipe.prepTimeMinutes,
        servings: recipe.servings,
        macros: recipe.macros,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        isCustom: true,
      });
      const previous = get().recipes;
      set({
        recipes: previous.map((item) => (item.id === existing.id ? next : item)),
        syncError: null,
      });
      try {
        await writeRecipeDoc(next);
        if (existing.imageUrl !== next.imageUrl) await cleanupOwnedImage(existing.imageUrl);
        await reconcileRecipeShopping(next).catch((error) =>
          set({ syncError: messageFromError(error) }),
        );
      } catch (error) {
        set({ recipes: previous, syncError: messageFromError(error) });
        throw error;
      }
      return { id: existing.id, isUpdate: true };
    }
    const newId = recipe.id?.startsWith('custom-')
      ? recipe.id
      : `custom-${Math.random().toString(36).slice(2, 10)}`;
    const added = prepareRecipe({ ...recipe, id: newId, isCustom: true });
    const previous = get().recipes;
    set({ recipes: [...previous, added], syncError: null });
    try {
      await writeRecipeDoc(added);
    } catch (error) {
      set({ recipes: previous, syncError: messageFromError(error) });
      throw error;
    }
    return { id: newId, isUpdate: false };
  },
}));

export function writeRecipes(recipes: Recipe[]): void {
  useRecipes.setState({ recipes, hydrated: true, syncError: null });
}

export function writeRecipesSyncError(error: unknown): void {
  useRecipes.setState({ syncError: messageFromError(error) });
}

export async function writeSeedsIfEmpty(seeds: Recipe[]): Promise<void> {
  await commitInBatches(seeds, (batch, recipe) =>
    batch.set(doc(db, 'recipes', recipe.id), recipe),
  );
}
