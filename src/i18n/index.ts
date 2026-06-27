import { de, type TranslationKey } from './de';
import { fa } from './fa';
import type { Locale, Unit } from '../types';

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  de,
  fa,
};

export type { TranslationKey };

export const unitKey = (unit: Unit): TranslationKey => `unit.${unit}` as TranslationKey;
