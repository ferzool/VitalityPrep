import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';

import { usePlanner } from '../store/planner';
import { useRecipes } from '../store/recipes';
import { useSettings } from '../store/settings';
import { useShopping } from '../store/shopping';
import type {
  Category,
  Locale,
  PlannerWeek,
  Recipe,
  ShoppingItem,
} from '../types';

const BACKUP_VERSION = 1;
const APP_TAG = 'vitality-prep';
const BUNDLED_PREFIX = 'bundled-images/';
const IMPORT_DIR_NAME = 'imported-images';

export class BackupCancelled extends Error {
  constructor() {
    super('cancelled');
    this.name = 'BackupCancelled';
  }
}

export class BackupInvalid extends Error {
  constructor() {
    super('invalid');
    this.name = 'BackupInvalid';
  }
}

export class BackupSharingUnavailable extends Error {
  constructor() {
    super('sharing unavailable');
    this.name = 'BackupSharingUnavailable';
  }
}

interface BackupPayload {
  version: number;
  app: string;
  exportedAt: number;
  settings: { locale: Locale };
  recipes: Recipe[];
  shopping: ShoppingItem[];
  planner: PlannerWeek;
}

export interface ImportResult {
  recipeCount: number;
  shoppingCount: number;
  plannedSlotCount: number;
}

function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://');
}

function extensionFromUri(uri: string): string {
  const clean = uri.split('?')[0].split('#')[0];
  const m = clean.match(/\.([a-zA-Z0-9]{2,5})$/);
  return m ? m[1].toLowerCase() : 'jpg';
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours(),
  )}${pad(d.getMinutes())}`;
}

export async function exportBackup(): Promise<string> {
  const recipes = useRecipes.getState().recipes;
  const shopping = useShopping.getState().items;
  const planner = usePlanner.getState().week;
  const locale = useSettings.getState().locale;

  const zip = new JSZip();
  const exportedRecipes: Recipe[] = [];

  for (const r of recipes) {
    let imageUrl = r.imageUrl;
    if (isLocalUri(r.imageUrl)) {
      try {
        const ext = extensionFromUri(r.imageUrl);
        const filename = `${r.id}.${ext}`;
        const b64 = await FileSystem.readAsStringAsync(r.imageUrl, {
          encoding: 'base64',
        });
        zip.file(`images/${filename}`, b64, { base64: true });
        imageUrl = `${BUNDLED_PREFIX}${filename}`;
      } catch {
        // image unavailable; keep original URI for traceability
      }
    }
    exportedRecipes.push({ ...r, imageUrl });
  }

  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    app: APP_TAG,
    exportedAt: Date.now(),
    settings: { locale },
    recipes: exportedRecipes,
    shopping,
    planner,
  };
  zip.file('data.json', JSON.stringify(payload, null, 2));

  const base64Zip = await zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const fileName = `vitality-prep-backup-${timestamp()}.zip`;
  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
  const outUri = `${baseDir}${fileName}`;
  await FileSystem.writeAsStringAsync(outUri, base64Zip, { encoding: 'base64' });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new BackupSharingUnavailable();
  }
  await Sharing.shareAsync(outUri, {
    mimeType: 'application/zip',
    dialogTitle: fileName,
    UTI: 'public.zip-archive',
  });
  return outUri;
}

const VALID_CATEGORIES: Category[] = [
  'breakfast',
  'main',
  'snack',
  'sauce',
  'smoothie',
];

function sanitizeRecipe(raw: unknown, imageMap: Map<string, string>): Recipe | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' ? r.id : null;
  const name = r.name as Recipe['name'] | undefined;
  if (!id || !name || typeof name !== 'object') return null;

  let imageUrl = typeof r.imageUrl === 'string' ? r.imageUrl : '';
  if (imageUrl.startsWith(BUNDLED_PREFIX)) {
    const filename = imageUrl.slice(BUNDLED_PREFIX.length);
    const restored = imageMap.get(filename);
    if (restored) imageUrl = restored;
  }

  const category =
    typeof r.category === 'string' &&
    (VALID_CATEGORIES as string[]).includes(r.category)
      ? (r.category as Category)
      : 'main';

  const macrosRaw = r.macros as Record<string, unknown> | undefined;
  const macros = {
    protein: Number(macrosRaw?.protein ?? 0) || 0,
    carbs: Number(macrosRaw?.carbs ?? 0) || 0,
    fat: Number(macrosRaw?.fat ?? 0) || 0,
  };

  const ingredients = Array.isArray(r.ingredients)
    ? (r.ingredients as Recipe['ingredients'])
    : [];
  const instructions = Array.isArray(r.instructions)
    ? (r.instructions as Recipe['instructions'])
    : [];

  return {
    id,
    name,
    description: r.description as Recipe['description'] | undefined,
    category,
    imageUrl,
    calories: Number(r.calories ?? 0) || 0,
    prepTimeMinutes: Number(r.prepTimeMinutes ?? 0) || 0,
    servings: Number(r.servings ?? 1) || 1,
    macros,
    ingredients,
    instructions,
    isCustom: r.isCustom === true ? true : undefined,
  };
}

function sanitizeShoppingItem(raw: unknown): ShoppingItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.id !== 'string' ||
    typeof r.recipeId !== 'string' ||
    typeof r.ingredientId !== 'string'
  ) {
    return null;
  }
  const quantity =
    typeof r.quantity === 'number' && r.quantity > 0
      ? Math.round(r.quantity)
      : 1;
  return {
    id: r.id,
    recipeId: r.recipeId,
    recipeName: r.recipeName as ShoppingItem['recipeName'],
    ingredientId: r.ingredientId,
    name: r.name as ShoppingItem['name'],
    amount: Number(r.amount ?? 0) || 0,
    unit: (r.unit as ShoppingItem['unit']) ?? 'g',
    quantity,
    checked: r.checked === true,
    addedAt: typeof r.addedAt === 'number' ? r.addedAt : Date.now(),
  };
}

export async function importBackup(): Promise<ImportResult> {
  const pick = await DocumentPicker.getDocumentAsync({
    type: [
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream',
      '*/*',
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (pick.canceled || !pick.assets || pick.assets.length === 0) {
    throw new BackupCancelled();
  }
  const file = pick.assets[0];

  let zip: JSZip;
  try {
    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: 'base64',
    });
    zip = await JSZip.loadAsync(base64, { base64: true });
  } catch {
    throw new BackupInvalid();
  }

  const dataEntry = zip.file('data.json');
  if (!dataEntry) throw new BackupInvalid();
  const jsonText = await dataEntry.async('string');

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new BackupInvalid();
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as { app?: unknown }).app !== APP_TAG
  ) {
    throw new BackupInvalid();
  }
  const data = parsed as Partial<BackupPayload>;

  const docDir = FileSystem.documentDirectory ?? '';
  const imageDir = `${docDir}${IMPORT_DIR_NAME}/`;
  try {
    await FileSystem.deleteAsync(imageDir, { idempotent: true });
  } catch {
    // ignore
  }
  await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });

  const imageMap = new Map<string, string>();
  const imageEntries: string[] = [];
  zip.forEach((path, entry) => {
    if (path.startsWith('images/') && !entry.dir) imageEntries.push(path);
  });
  for (const path of imageEntries) {
    const entry = zip.file(path);
    if (!entry) continue;
    const filename = path.slice('images/'.length);
    const b64 = await entry.async('base64');
    const dest = `${imageDir}${filename}`;
    await FileSystem.writeAsStringAsync(dest, b64, { encoding: 'base64' });
    imageMap.set(filename, dest);
  }

  const recipes: Recipe[] = Array.isArray(data.recipes)
    ? (data.recipes
        .map((r) => sanitizeRecipe(r, imageMap))
        .filter((r): r is Recipe => r !== null))
    : [];

  const shopping: ShoppingItem[] = Array.isArray(data.shopping)
    ? (data.shopping
        .map(sanitizeShoppingItem)
        .filter((s): s is ShoppingItem => s !== null))
    : [];

  const planner: PlannerWeek =
    data.planner && typeof data.planner === 'object' && !Array.isArray(data.planner)
      ? (data.planner as PlannerWeek)
      : {};

  useRecipes.setState({ recipes });
  useShopping.setState({ items: shopping });
  usePlanner.setState({ week: planner });

  const importedLocale = data.settings?.locale;
  if (importedLocale === 'de' || importedLocale === 'fa') {
    useSettings.getState().setLocale(importedLocale);
  }

  const plannedSlotCount = Object.values(planner).reduce(
    (acc, day) => acc + (day ? Object.keys(day).length : 0),
    0,
  );

  return {
    recipeCount: recipes.length,
    shoppingCount: shopping.length,
    plannedSlotCount,
  };
}
