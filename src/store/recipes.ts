import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { seedRecipes } from '../data/recipes';
import type { Recipe } from '../types';

interface RecipesState {
  recipes: Recipe[];
  deletedSeedIds: string[];
  hydrated: boolean;
  addRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  updateRecipe: (id: string, patch: Partial<Recipe>) => void;
  resetCustom: () => void;
  getById: (id: string) => Recipe | undefined;
  findByName: (deName?: string, faName?: string) => Recipe | undefined;
  addOrUpdateByName: (recipe: Recipe) => { id: string; isUpdate: boolean };
}

const seedIds = new Set(seedRecipes.map((r) => r.id));

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

export const useRecipes = create<RecipesState>()(
  persist(
    (set, get) => ({
      recipes: seedRecipes,
      deletedSeedIds: [],
      hydrated: false,
      addRecipe: (recipe) =>
        set((state) => ({
          recipes: [{ ...recipe, isCustom: true }, ...state.recipes],
        })),
      removeRecipe: (id) =>
        set((state) => {
          const isSeed = seedIds.has(id);
          return {
            recipes: state.recipes.filter((r) => r.id !== id),
            deletedSeedIds: isSeed && !state.deletedSeedIds.includes(id)
              ? [...state.deletedSeedIds, id]
              : state.deletedSeedIds,
          };
        }),
      updateRecipe: (id, patch) =>
        set((state) => ({
          recipes: state.recipes.map((r) =>
            r.id === id ? { ...r, ...patch } : r,
          ),
        })),
      resetCustom: () =>
        set(() => {
          return { recipes: seedRecipes, deletedSeedIds: [] };
        }),
      getById: (id) => get().recipes.find((r) => r.id === id),
      findByName: (deName, faName) =>
        findByNames(get().recipes, deName, faName),
      addOrUpdateByName: (recipe) => {
        const existing = findByNames(
          get().recipes,
          recipe.name.de,
          recipe.name.fa,
        );
        if (existing) {
          const patch: Partial<Recipe> = {
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
          set((state) => ({
            recipes: state.recipes.map((r) =>
              r.id === existing.id ? { ...r, ...patch } : r,
            ),
          }));
          return { id: existing.id, isUpdate: true };
        }
        const newId = recipe.id?.startsWith('custom-')
          ? recipe.id
          : `custom-${Math.random().toString(36).slice(2, 10)}`;
        const added: Recipe = { ...recipe, id: newId, isCustom: true };
        set((state) => ({ recipes: [added, ...state.recipes] }));
        return { id: newId, isUpdate: false };
      },
    }),
    {
      name: 'vitality-prep:recipes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recipes: state.recipes,
        deletedSeedIds: state.deletedSeedIds,
      }),
      onRehydrateStorage: () => () => {
        useRecipes.setState({ hydrated: true });
      },
      merge: (persisted, current) => {
        const persistedState = (persisted ?? {}) as Partial<RecipesState>;
        const persistedRecipes = persistedState.recipes ?? [];
        const deletedSeedIds = persistedState.deletedSeedIds ?? [];
        const persistedIds = new Set(persistedRecipes.map((r) => r.id));
        const deletedSet = new Set(deletedSeedIds);
        const missingSeeds = seedRecipes.filter(
          (s) => !persistedIds.has(s.id) && !deletedSet.has(s.id),
        );
        return {
          ...current,
          ...persistedState,
          recipes: [...persistedRecipes, ...missingSeeds],
          deletedSeedIds,
        };
      },
    },
  ),
);
