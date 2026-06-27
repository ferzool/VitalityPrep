import {
  collection,
  deleteDoc,
  doc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { create } from 'zustand';
import { seedRecipes } from '../data/recipes';
import { db } from '../lib/firebase';
import type { Recipe } from '../types';

interface RecipesState {
  recipes: Recipe[];
  hydrated: boolean;
  addRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  updateRecipe: (id: string, patch: Partial<Recipe>) => void;
  resetCustom: () => Promise<void>;
  getById: (id: string) => Recipe | undefined;
  findByName: (deName?: string, faName?: string) => Recipe | undefined;
  addOrUpdateByName: (recipe: Recipe) => { id: string; isUpdate: boolean };
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

async function writeRecipeDoc(recipe: Recipe): Promise<void> {
  const doc$ = doc(db, 'recipes', recipe.id);
  // Stamp addedAt only on first save (never overwrite an existing timestamp).
  const withTs: Recipe = recipe.addedAt
    ? recipe
    : { ...recipe, addedAt: Date.now() };
  await setDoc(doc$, withTs);
}

async function deleteRecipeDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'recipes', id));
}

export const useRecipes = create<RecipesState>()((set, get) => ({
  recipes: [],
  hydrated: false,
  addRecipe: (recipe) => {
    const next: Recipe = { ...recipe, isCustom: true };
    void writeRecipeDoc(next);
  },
  removeRecipe: (id) => {
    void deleteRecipeDoc(id);
  },
  updateRecipe: (id, patch) => {
    const existing = get().recipes.find((r) => r.id === id);
    if (!existing) return;
    void writeRecipeDoc({ ...existing, ...patch });
  },
  resetCustom: async () => {
    const recipes = get().recipes;
    const seedIds = new Set(seedRecipes.map((r) => r.id));
    const batch = writeBatch(db);
    recipes.forEach((r) => {
      if (!seedIds.has(r.id)) {
        batch.delete(doc(db, 'recipes', r.id));
      }
    });
    seedRecipes.forEach((r) => {
      batch.set(doc(db, 'recipes', r.id), r);
    });
    await batch.commit();
  },
  getById: (id) => get().recipes.find((r) => r.id === id),
  findByName: (deName, faName) => findByNames(get().recipes, deName, faName),
  addOrUpdateByName: (recipe) => {
    const existing = findByNames(
      get().recipes,
      recipe.name.de,
      recipe.name.fa,
    );
    if (existing) {
      const next: Recipe = {
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
      };
      void writeRecipeDoc(next);
      return { id: existing.id, isUpdate: true };
    }
    const newId = recipe.id?.startsWith('custom-')
      ? recipe.id
      : `custom-${Math.random().toString(36).slice(2, 10)}`;
    const added: Recipe = { ...recipe, id: newId, isCustom: true };
    void writeRecipeDoc(added);
    return { id: newId, isUpdate: false };
  },
}));

export function writeRecipes(recipes: Recipe[]): void {
  useRecipes.setState({ recipes, hydrated: true });
}

export async function writeSeedsIfEmpty(seeds: Recipe[]): Promise<void> {
  const batch = writeBatch(db);
  seeds.forEach((r) => {
    batch.set(doc(collection(db, 'recipes'), r.id), r);
  });
  await batch.commit();
}
