import type { Recipe } from '../types';

export const QR_VERSION = 1;
export const QR_APP_TAG = 'vitality-prep';
export const QR_KIND = 'recipe';

export class QrInvalid extends Error {
  constructor() {
    super('invalid');
    this.name = 'QrInvalid';
  }
}

export class QrTooLarge extends Error {
  constructor() {
    super('too-large');
    this.name = 'QrTooLarge';
  }
}

const MAX_QR_PAYLOAD = 2500;

function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://');
}

export function recipeToQrPayload(recipe: Recipe): string {
  const { id: _id, isCustom: _isCustom, ...rest } = recipe;
  const clone = JSON.parse(JSON.stringify(rest)) as Omit<
    Recipe,
    'id' | 'isCustom'
  >;
  if (clone.imageUrl && isLocalUri(clone.imageUrl)) {
    clone.imageUrl = '';
  }
  const payload = {
    v: QR_VERSION,
    a: QR_APP_TAG,
    k: QR_KIND,
    r: clone,
  };
  const text = JSON.stringify(payload);
  if (text.length > MAX_QR_PAYLOAD) {
    throw new QrTooLarge();
  }
  return text;
}

export function parseRecipeQrPayload(text: string): Recipe {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new QrInvalid();
  }
  if (!parsed || typeof parsed !== 'object') throw new QrInvalid();
  const obj = parsed as {
    v?: number;
    a?: string;
    k?: string;
    r?: Partial<Recipe>;
  };
  if (obj.a !== QR_APP_TAG || obj.k !== QR_KIND || !obj.r) {
    throw new QrInvalid();
  }
  const r = obj.r;
  if (!r.name || typeof r.name !== 'object') throw new QrInvalid();
  const nameDe = typeof (r.name as Record<string, unknown>).de === 'string'
    ? (r.name as Record<string, string>).de
    : '';
  const nameFa = typeof (r.name as Record<string, unknown>).fa === 'string'
    ? (r.name as Record<string, string>).fa
    : '';
  if (!nameDe && !nameFa) throw new QrInvalid();
  if (!Array.isArray(r.ingredients) || !Array.isArray(r.instructions)) {
    throw new QrInvalid();
  }
  return r as Recipe;
}
