import {
  collection,
  doc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { seedRecipes } from '../data/recipes';
import type { PlannerWeek, Recipe, ShoppingItem } from '../types';
import { db } from './firebase';
import { writePlannerWeek } from '../store/planner';
import { writeRecipes, writeSeedsIfEmpty } from '../store/recipes';
import { writeShoppingItems } from '../store/shopping';

let unsubscribes: Unsubscribe[] = [];
let started = false;

export function startFirestoreSync(): void {
  if (started) return;
  started = true;

  unsubscribes.push(
    onSnapshot(
      collection(db, 'recipes'),
      async (snap) => {
        const recipes: Recipe[] = snap.docs.map(
          (d) => d.data() as Recipe,
        );
        writeRecipes(recipes);
        // Bootstrap seeds the very first time (only if collection truly empty
        // and we're not still loading cached data).
        if (snap.empty && !snap.metadata.fromCache) {
          await writeSeedsIfEmpty(seedRecipes);
        }
      },
      (err) => {
        console.warn('recipes snapshot error', err);
      },
    ),
  );

  unsubscribes.push(
    onSnapshot(
      doc(db, 'planner', 'week'),
      (snap) => {
        const data = snap.data() as { week?: PlannerWeek } | undefined;
        writePlannerWeek(data?.week ?? {});
      },
      (err) => {
        console.warn('planner snapshot error', err);
      },
    ),
  );

  unsubscribes.push(
    onSnapshot(
      collection(db, 'shopping'),
      (snap) => {
        const items: ShoppingItem[] = snap.docs.map(
          (d) => d.data() as ShoppingItem,
        );
        writeShoppingItems(items);
      },
      (err) => {
        console.warn('shopping snapshot error', err);
      },
    ),
  );
}

export function stopFirestoreSync(): void {
  unsubscribes.forEach((u) => {
    try {
      u();
    } catch {
      // ignore
    }
  });
  unsubscribes = [];
  started = false;
  writeRecipes([]);
  writePlannerWeek({});
  writeShoppingItems([]);
}
