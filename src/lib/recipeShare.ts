import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';

import type { Recipe } from '../types';

export const RECIPE_FILE_EXT = 'myrecipe';
export const RECIPE_UTI = 'com.example.vitalityprep.myrecipe';
export const RECIPE_MIME = 'application/x-myrecipe';
const APP_TAG = 'vitality-prep';
const KIND = 'recipe';
const VERSION = 1;
const BUNDLED_PREFIX = 'bundled-image';
const IMPORT_DIR_NAME = 'imported-recipe-images';

export class ShareCancelled extends Error {
  constructor() {
    super('cancelled');
    this.name = 'ShareCancelled';
  }
}
export class ShareInvalid extends Error {
  constructor() {
    super('invalid');
    this.name = 'ShareInvalid';
  }
}
export class ShareUnavailable extends Error {
  constructor() {
    super('unavailable');
    this.name = 'ShareUnavailable';
  }
}

interface RecipeFile {
  version: number;
  app: string;
  kind: 'recipe';
  exportedAt: number;
  recipe: Recipe;
}

function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://');
}

function extensionFromUri(uri: string): string {
  const clean = uri.split('?')[0].split('#')[0];
  const m = clean.match(/\.([a-zA-Z0-9]{2,5})$/);
  return m ? m[1].toLowerCase() : 'jpg';
}

function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned.slice(0, 40) || 'recipe';
}

export function recipeToCleanJson(recipe: Recipe): string {
  const { id: _id, isCustom: _isCustom, ...rest } = recipe;
  const clone = JSON.parse(JSON.stringify(rest)) as Omit<Recipe, 'id' | 'isCustom'>;
  if (clone.imageUrl && isLocalUri(clone.imageUrl)) {
    clone.imageUrl = '';
  }
  return JSON.stringify(clone, null, 2);
}

export async function copyRecipeAsJson(recipe: Recipe): Promise<void> {
  await Clipboard.setStringAsync(recipeToCleanJson(recipe));
}

async function buildRecipeFile(recipe: Recipe): Promise<string> {
  const zip = new JSZip();
  let imageUrl = recipe.imageUrl;
  if (isLocalUri(recipe.imageUrl)) {
    try {
      const ext = extensionFromUri(recipe.imageUrl);
      const b64 = await FileSystem.readAsStringAsync(recipe.imageUrl, {
        encoding: 'base64',
      });
      zip.file(`image.${ext}`, b64, { base64: true });
      imageUrl = `${BUNDLED_PREFIX}.${ext}`;
    } catch {
      // image unavailable; keep original
    }
  }

  const payload: RecipeFile = {
    version: VERSION,
    app: APP_TAG,
    kind: KIND,
    exportedAt: Date.now(),
    recipe: { ...recipe, imageUrl },
  };
  zip.file('recipe.json', JSON.stringify(payload, null, 2));

  const base64Zip = await zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const baseName = sanitizeFilename(recipe.name.de || recipe.name.fa || 'recipe');
  const fileName = `${baseName}.${RECIPE_FILE_EXT}`;
  const baseDir =
    FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
  const outUri = `${baseDir}${fileName}`;
  await FileSystem.writeAsStringAsync(outUri, base64Zip, { encoding: 'base64' });
  return outUri;
}

export async function shareRecipe(recipe: Recipe): Promise<string> {
  const uri = await buildRecipeFile(recipe);
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new ShareUnavailable();
  await Sharing.shareAsync(uri, {
    UTI: RECIPE_UTI,
    mimeType: RECIPE_MIME,
    dialogTitle: recipe.name.de || recipe.name.fa || 'Recipe',
  });
  return uri;
}

async function ensureImportDir(): Promise<string> {
  const docDir = FileSystem.documentDirectory ?? '';
  const dir = `${docDir}${IMPORT_DIR_NAME}/`;
  try {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  } catch {
    // already exists
  }
  return dir;
}

export async function readRecipeFromUri(uri: string): Promise<Recipe> {
  let zip: JSZip;
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    zip = await JSZip.loadAsync(base64, { base64: true });
  } catch {
    throw new ShareInvalid();
  }

  const dataEntry = zip.file('recipe.json');
  if (!dataEntry) throw new ShareInvalid();
  const text = await dataEntry.async('string');

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ShareInvalid();
  }
  if (!parsed || typeof parsed !== 'object') throw new ShareInvalid();
  const file = parsed as RecipeFile;
  if (file.app !== APP_TAG || file.kind !== 'recipe' || !file.recipe) {
    throw new ShareInvalid();
  }

  let recipe = file.recipe;
  if (recipe.imageUrl?.startsWith(BUNDLED_PREFIX)) {
    const ext = recipe.imageUrl.split('.').pop() || 'jpg';
    const imgEntry = zip.file(`image.${ext}`);
    if (imgEntry) {
      const dir = await ensureImportDir();
      const id = recipe.id || `imp-${Date.now()}`;
      const dest = `${dir}${id}.${ext}`;
      const imgB64 = await imgEntry.async('base64');
      await FileSystem.writeAsStringAsync(dest, imgB64, { encoding: 'base64' });
      recipe = { ...recipe, imageUrl: dest };
    } else {
      recipe = { ...recipe, imageUrl: '' };
    }
  }
  return recipe;
}

export async function importRecipeFromPicker(): Promise<Recipe> {
  const pick = await DocumentPicker.getDocumentAsync({
    type: ['*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (pick.canceled || !pick.assets || pick.assets.length === 0) {
    throw new ShareCancelled();
  }
  return readRecipeFromUri(pick.assets[0].uri);
}

export function isRecipeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().split('?')[0].split('#')[0];
  return lower.endsWith(`.${RECIPE_FILE_EXT}`);
}
