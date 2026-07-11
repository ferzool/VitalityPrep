import { writeBatch, type WriteBatch } from 'firebase/firestore';
import { db } from './firebase';

const MAX_BATCH_OPERATIONS = 450;

export async function commitInBatches<T>(
  items: readonly T[],
  apply: (batch: WriteBatch, item: T) => void,
): Promise<void> {
  for (let start = 0; start < items.length; start += MAX_BATCH_OPERATIONS) {
    const batch = writeBatch(db);
    items
      .slice(start, start + MAX_BATCH_OPERATIONS)
      .forEach((item) => apply(batch, item));
    await batch.commit();
  }
}

export function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
