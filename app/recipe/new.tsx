import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryDropdown } from '../../src/components/CategoryDropdown';
import { Icon } from '../../src/components/Icon';
import { useTranslation, type TranslationKey } from '../../src/hooks/useTranslation';
import { confirmAction } from '../../src/lib/confirmAction';
import { uploadRecipeImage } from '../../src/lib/imageUpload';
import { useRecipes } from '../../src/store/recipes';
import { cardShadow, colors, radius, spacing } from '../../src/theme';
import {
  CATEGORIES,
  type Category,
  type Ingredient,
  type Localized,
  type Recipe,
  type Unit,
} from '../../src/types';

interface DraftIngredient {
  id: string;
  name: string;
  nameFa?: string;
  amount: string;
  unit: Unit;
  calories?: string;
}

interface DraftStep {
  id: string;
  text: string;
  textFa?: string;
}

interface ImageSource {
  kind: 'url' | 'local' | 'none';
  uri: string;
}

const UNITS: Unit[] = ['g', 'kg', 'ml', 'l', 'piece', 'tsp', 'tbsp', 'cup', 'pinch'];
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1080&q=80';

const uid = () => Math.random().toString(36).slice(2, 10);

const toLocalized = (value: unknown): Localized<string> | null => {
  if (typeof value === 'string') return { de: value, fa: value };
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { de?: unknown }).de === 'string' &&
    typeof (value as { fa?: unknown }).fa === 'string'
  ) {
    return {
      de: (value as { de: string }).de,
      fa: (value as { fa: string }).fa,
    };
  }
  return null;
};

interface ImportedDraft {
  name?: string;
  nameFa?: string;
  descriptionDe?: string;
  descriptionFa?: string;
  category?: Category;
  calories?: string;
  caloriesPer100g?: string;
  prepTime?: string;
  servings?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
  ingredients?: DraftIngredient[];
  steps?: DraftStep[];
}

function parseJsonImport(raw: string): ImportedDraft | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  const draft: ImportedDraft = {};

  const name = toLocalized(obj.name);
  if (name) {
    draft.name = name.de;
    if (name.fa && name.fa !== name.de) draft.nameFa = name.fa;
  }

  const description = toLocalized(obj.description);
  if (description) {
    draft.descriptionDe = description.de;
    if (description.fa && description.fa !== description.de) {
      draft.descriptionFa = description.fa;
    }
  }

  if (typeof obj.category === 'string' && (CATEGORIES as string[]).includes(obj.category)) {
    draft.category = obj.category as Category;
  }

  if (typeof obj.calories === 'number') draft.calories = String(obj.calories);
  if (typeof (obj as { caloriesPer100g?: unknown }).caloriesPer100g === 'number') {
    draft.caloriesPer100g = String((obj as { caloriesPer100g: number }).caloriesPer100g);
  }
  const prep =
    (obj as { prepTimeMinutes?: unknown }).prepTimeMinutes ??
    (obj as { prepTime?: unknown }).prepTime;
  if (typeof prep === 'number') draft.prepTime = String(prep);
  if (typeof obj.servings === 'number') draft.servings = String(obj.servings);

  const macros = obj.macros as Record<string, unknown> | undefined;
  if (macros) {
    if (typeof macros.protein === 'number') draft.protein = String(macros.protein);
    if (typeof macros.carbs === 'number') draft.carbs = String(macros.carbs);
    if (typeof macros.fat === 'number') draft.fat = String(macros.fat);
  }

  if (Array.isArray(obj.ingredients)) {
    draft.ingredients = obj.ingredients
      .map((raw): DraftIngredient | null => {
        if (!raw || typeof raw !== 'object') return null;
        const r = raw as Record<string, unknown>;
        const nm = toLocalized(r.name);
        if (!nm) return null;
        return {
          id: uid(),
          name: nm.de,
          nameFa: nm.fa && nm.fa !== nm.de ? nm.fa : undefined,
          amount: typeof r.amount === 'number' ? String(r.amount) : '',
          unit: (UNITS as string[]).includes(r.unit as string) ? (r.unit as Unit) : 'g',
          calories: typeof r.calories === 'number' ? String(r.calories) : undefined,
        };
      })
      .filter((it): it is DraftIngredient => it !== null);
  }

  if (Array.isArray(obj.instructions)) {
    draft.steps = obj.instructions
      .map((raw): DraftStep | null => {
        const lp = toLocalized(raw);
        if (!lp) return null;
        return {
          id: uid(),
          text: lp.de,
          textFa: lp.fa && lp.fa !== lp.de ? lp.fa : undefined,
        };
      })
      .filter((it): it is DraftStep => it !== null);
  }

  return draft;
}

export default function AddRecipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fonts, t, isRTL } = useTranslation();
  const addOrUpdateByName = useRecipes((s) => s.addOrUpdateByName);
  const updateRecipe = useRecipes((s) => s.updateRecipe);
  const removeRecipe = useRecipes((s) => s.removeRecipe);
  const [saving, setSaving] = useState(false);
  const { edit: editParam } = useLocalSearchParams<{ edit?: string }>();
  const editId =
    typeof editParam === 'string' && editParam.length > 0 ? editParam : null;
  const recipeToEdit = useRecipes((s) =>
    editId ? s.recipes.find((r) => r.id === editId) : undefined,
  );
  const isEditMode = !!editId && !!recipeToEdit;

  const [name, setName] = useState('');
  const [nameFa, setNameFa] = useState('');
  const [descriptionDe, setDescriptionDe] = useState('');
  const [descriptionFa, setDescriptionFa] = useState('');
  const [category, setCategory] = useState<Category>('main');
  const [imageSource, setImageSource] = useState<ImageSource>({ kind: 'none', uri: '' });
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [calories, setCalories] = useState('');
  const [caloriesPer100g, setCaloriesPer100g] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('2');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([
    { id: uid(), name: '', amount: '', unit: 'g' },
  ]);
  const [steps, setSteps] = useState<DraftStep[]>([{ id: uid(), text: '' }]);

  useEffect(() => {
    if (!recipeToEdit) return;
    setName(recipeToEdit.name.de);
    setNameFa(
      recipeToEdit.name.fa && recipeToEdit.name.fa !== recipeToEdit.name.de
        ? recipeToEdit.name.fa
        : '',
    );
    setDescriptionDe(recipeToEdit.description?.de ?? '');
    setDescriptionFa(
      recipeToEdit.description?.fa &&
        recipeToEdit.description.fa !== recipeToEdit.description?.de
        ? recipeToEdit.description.fa
        : '',
    );
    setCategory(recipeToEdit.category);
    setCalories(String(recipeToEdit.calories));
    setCaloriesPer100g(
      recipeToEdit.caloriesPer100g !== undefined
        ? String(recipeToEdit.caloriesPer100g)
        : '',
    );
    setPrepTime(String(recipeToEdit.prepTimeMinutes));
    setServings(String(recipeToEdit.servings));
    setProtein(String(recipeToEdit.macros.protein));
    setCarbs(String(recipeToEdit.macros.carbs));
    setFat(String(recipeToEdit.macros.fat));
    setIngredients(
      recipeToEdit.ingredients.length > 0
        ? recipeToEdit.ingredients.map((i) => ({
            id: uid(),
            name: i.name.de,
            nameFa: i.name.fa !== i.name.de ? i.name.fa : undefined,
            amount: String(i.amount),
            unit: i.unit,
            calories: i.calories !== undefined ? String(i.calories) : undefined,
          }))
        : [{ id: uid(), name: '', amount: '', unit: 'g' }],
    );
    setSteps(
      recipeToEdit.instructions.length > 0
        ? recipeToEdit.instructions.map((s) => ({
            id: uid(),
            text: s.de,
            textFa: s.de !== s.fa ? s.fa : undefined,
          }))
        : [{ id: uid(), text: '' }],
    );
    if (recipeToEdit.imageUrl) {
      if (recipeToEdit.imageUrl.startsWith('file://')) {
        setImageMode('file');
        setImageSource({ kind: 'local', uri: recipeToEdit.imageUrl });
      } else {
        setImageMode('url');
        setImageUrlInput(recipeToEdit.imageUrl);
        setImageSource({ kind: 'url', uri: recipeToEdit.imageUrl });
      }
    }
  }, [recipeToEdit?.id]);

  const previewUri = useMemo(() => {
    if (imageSource.kind === 'local') return imageSource.uri;
    if (imageMode === 'url' && imageUrlInput.trim()) return imageUrlInput.trim();
    if (imageSource.kind === 'url') return imageSource.uri;
    return null;
  }, [imageSource, imageMode, imageUrlInput]);

  const updateIngredient = (id: string, patch: Partial<DraftIngredient>) => {
    setIngredients((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  };

  const removeIngredient = (id: string) =>
    setIngredients((prev) => prev.filter((it) => it.id !== id));

  const addIngredient = () =>
    setIngredients((prev) => [
      ...prev,
      { id: uid(), name: '', amount: '', unit: 'g' },
    ]);

  const updateStep = (id: string, text: string) =>
    setSteps((prev) => prev.map((it) => (it.id === id ? { ...it, text } : it)));

  const removeStep = (id: string) =>
    setSteps((prev) => prev.filter((it) => it.id !== id));

  const addStep = () => setSteps((prev) => [...prev, { id: uid(), text: '' }]);

  const onPickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('addRecipe.title'), t('addRecipe.imagePermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset) {
      setImageMode('file');
      setImageSource({ kind: 'local', uri: asset.uri });
    }
  };

  const onApplyJson = () => {
    const draft = parseJsonImport(jsonText);
    if (!draft) {
      setJsonError(t('addRecipe.jsonError'));
      return;
    }
    setJsonError(null);
    // In edit mode the user expects the JSON to fully replace every field
    // (except the image). Wipe defaults first so stale data from the recipe
    // does not bleed through when the JSON omits a field.
    setName(draft.name ?? '');
    setNameFa(draft.nameFa ?? '');
    setDescriptionDe(draft.descriptionDe ?? '');
    setDescriptionFa(draft.descriptionFa ?? '');
    setCategory(draft.category ?? 'main');
    setCalories(draft.calories ?? '');
    setCaloriesPer100g(draft.caloriesPer100g ?? '');
    setPrepTime(draft.prepTime ?? '');
    setServings(draft.servings ?? '2');
    setProtein(draft.protein ?? '');
    setCarbs(draft.carbs ?? '');
    setFat(draft.fat ?? '');
    setIngredients(
      draft.ingredients && draft.ingredients.length > 0
        ? draft.ingredients
        : [{ id: uid(), name: '', amount: '', unit: 'g' }],
    );
    setSteps(
      draft.steps && draft.steps.length > 0
        ? draft.steps
        : [{ id: uid(), text: '' }],
    );
    Alert.alert(t('addRecipe.jsonImport'), t('addRecipe.jsonApplied'));
  };

  const onSave = async () => {
    if (saving) return;
    const cleanIngredients: Ingredient[] = ingredients
      .filter((it) => it.name.trim() !== '' && it.amount.trim() !== '')
      .map((it) => {
        const kcal =
          it.calories !== undefined && it.calories.trim() !== ''
            ? Number(it.calories.replace(',', '.'))
            : NaN;
        return {
          id: uid(),
          name: {
            de: it.name.trim(),
            fa: it.nameFa?.trim() || it.name.trim(),
          },
          amount: Number(it.amount.replace(',', '.')) || 0,
          unit: it.unit,
          ...(Number.isFinite(kcal) ? { calories: kcal } : {}),
        };
      });

    if (!name.trim() || cleanIngredients.length === 0) {
      Alert.alert(t('addRecipe.title'), t('addRecipe.required'));
      return;
    }

    const cleanSteps = steps
      .filter((s) => s.text.trim() !== '')
      .map((s) => ({
        de: s.text.trim(),
        fa: s.textFa?.trim() || s.text.trim(),
      }));

    setSaving(true);
    let finalImage: string;
    try {
      if (imageSource.kind === 'local') {
        const localUri = imageSource.uri;
        // Already a public URL (e.g. previously-saved Firebase Storage link).
        if (/^https?:\/\//.test(localUri)) {
          finalImage = localUri;
        } else {
          finalImage = await uploadRecipeImage(localUri);
        }
      } else if (imageMode === 'url' && imageUrlInput.trim()) {
        finalImage = imageUrlInput.trim();
      } else {
        finalImage = DEFAULT_IMAGE;
      }
    } catch (err) {
      setSaving(false);
      Alert.alert(t('addRecipe.title'), (err as Error).message);
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescDe = descriptionDe.trim();
    const trimmedDescFa = descriptionFa.trim();
    const hasDescription = trimmedDescDe.length > 0 || trimmedDescFa.length > 0;

    const parsedPer100 = Number(caloriesPer100g.replace(',', '.'));
    const recipe: Recipe = {
      id: isEditMode && editId ? editId : `custom-${uid()}`,
      name: {
        de: trimmedName,
        fa: nameFa.trim() || trimmedName,
      },
      description: hasDescription
        ? {
            de: trimmedDescDe || trimmedDescFa,
            fa: trimmedDescFa || trimmedDescDe,
          }
        : undefined,
      category,
      imageUrl: finalImage,
      calories: Number(calories) || 0,
      ...(Number.isFinite(parsedPer100) && parsedPer100 > 0
        ? { caloriesPer100g: parsedPer100 }
        : {}),
      prepTimeMinutes: Number(prepTime) || 0,
      servings: Number(servings) || 1,
      macros: {
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
      },
      ingredients: cleanIngredients,
      instructions: cleanSteps,
      isCustom: true,
    };

    if (isEditMode && editId) {
      updateRecipe(editId, {
        name: recipe.name,
        description: recipe.description,
        category: recipe.category,
        imageUrl: recipe.imageUrl,
        calories: recipe.calories,
        caloriesPer100g: recipe.caloriesPer100g,
        prepTimeMinutes: recipe.prepTimeMinutes,
        servings: recipe.servings,
        macros: recipe.macros,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
      });
      router.back();
      return;
    }

    addOrUpdateByName(recipe);
    router.back();
  };

  const onDeleteFromEdit = () => {
    if (!isEditMode || !editId) return;
    confirmAction({
      title: t('recipe.delete'),
      message: t('recipe.deleteConfirm'),
      cancelText: t('common.cancel'),
      confirmText: t('common.delete'),
      onConfirm: () => {
        removeRecipe(editId);
        router.replace('/');
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.stackMd,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Icon name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[fonts.headlineMd, { color: colors.onSurface }]}>
          {isEditMode ? t('addRecipe.editTitle') : t('addRecipe.title')}
        </Text>
        <Pressable
          onPress={onSave}
          disabled={saving}
          hitSlop={10}
          style={({ pressed }) => [
            styles.saveBtn,
            { opacity: saving ? 0.6 : pressed ? 0.85 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[fonts.labelCaps, { color: colors.onPrimary }]}>
              {t('addRecipe.save')}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.marginMobile,
          paddingBottom: spacing.marginMobile + insets.bottom + 40,
          gap: spacing.stackLg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.jsonCard}>
          <View
            style={[
              styles.sectionHeaderRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={[fonts.labelCaps, { color: colors.onSecondaryContainer }]}>
              {t('addRecipe.jsonImport')}
            </Text>
          </View>
          <Text
            style={[
              fonts.bodySm,
              { color: colors.secondary, marginBottom: spacing.stackSm },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
          >
            {t('addRecipe.jsonHint')}
          </Text>
          <TextInput
            value={jsonText}
            onChangeText={(v) => {
              setJsonText(v);
              if (jsonError) setJsonError(null);
            }}
            placeholder={t('addRecipe.jsonPlaceholder')}
            placeholderTextColor={colors.outline}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              fonts.bodySm,
              styles.input,
              styles.jsonInput,
            ]}
          />
          {jsonError ? (
            <Text
              style={[
                fonts.bodySm,
                { color: colors.error, marginTop: spacing.stackSm },
                isRTL && { writingDirection: 'rtl', textAlign: 'right' },
              ]}
            >
              {jsonError}
            </Text>
          ) : null}
          <Pressable
            onPress={onApplyJson}
            disabled={jsonText.trim().length === 0}
            style={({ pressed }) => [
              styles.jsonApplyBtn,
              jsonText.trim().length === 0 && { opacity: 0.5 },
              pressed && jsonText.trim().length > 0 && { opacity: 0.85 },
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Icon name="check" size={16} color={colors.onPrimary} />
            <Text style={[fonts.labelCaps, { color: colors.onPrimary }]}>
              {t('addRecipe.jsonApply')}
            </Text>
          </Pressable>
        </View>

        <Field label={t('addRecipe.name')}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('addRecipe.namePlaceholder')}
            placeholderTextColor={colors.outline}
            style={[fonts.bodyLg, styles.input]}
          />
        </Field>

        <Field label={t('addRecipe.category')}>
          <CategoryDropdown value={category} onChange={setCategory} />
        </Field>

        <Field label={t('addRecipe.image')}>
          <View style={{ gap: spacing.stackMd }}>
            <View
              style={[
                styles.toggleRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <Pressable
                onPress={() => setImageMode('url')}
                style={({ pressed }) => [
                  styles.toggleChip,
                  imageMode === 'url'
                    ? styles.toggleChipActive
                    : styles.toggleChipInactive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    fonts.labelCaps,
                    {
                      color:
                        imageMode === 'url'
                          ? colors.onPrimary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {t('addRecipe.imageSourceUrl')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setImageMode('file')}
                style={({ pressed }) => [
                  styles.toggleChip,
                  imageMode === 'file'
                    ? styles.toggleChipActive
                    : styles.toggleChipInactive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    fonts.labelCaps,
                    {
                      color:
                        imageMode === 'file'
                          ? colors.onPrimary
                          : colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {t('addRecipe.imageSourceFile')}
                </Text>
              </Pressable>
            </View>

            {imageMode === 'url' ? (
              <TextInput
                value={imageUrlInput}
                onChangeText={(v) => {
                  setImageUrlInput(v);
                  setImageSource({ kind: 'url', uri: v.trim() });
                }}
                placeholder={t('addRecipe.imageUrlPlaceholder')}
                placeholderTextColor={colors.outline}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={[fonts.bodyLg, styles.input]}
              />
            ) : (
              <Pressable
                onPress={onPickImage}
                style={({ pressed }) => [
                  styles.pickerBtn,
                  pressed && { opacity: 0.85 },
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <Icon name="photo-camera" size={20} color={colors.primary} />
                <Text style={[fonts.labelCaps, { color: colors.primary }]}>
                  {imageSource.kind === 'local'
                    ? t('addRecipe.imagePicked')
                    : t('addRecipe.imageSourceFile')}
                </Text>
              </Pressable>
            )}

            {previewUri ? (
              <View style={styles.previewWrap}>
                <Image
                  source={previewUri}
                  style={styles.preview}
                  contentFit="cover"
                  transition={150}
                />
              </View>
            ) : null}
          </View>
        </Field>

        <View style={[styles.rowGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.gridItem}>
            <Field label={t('addRecipe.calories')}>
              <TextInput
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                style={[fonts.bodyLg, styles.input]}
                placeholder="0"
                placeholderTextColor={colors.outline}
              />
            </Field>
          </View>
          <View style={styles.gridItem}>
            <Field label={t('addRecipe.prepTime')}>
              <TextInput
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="numeric"
                style={[fonts.bodyLg, styles.input]}
                placeholder="0"
                placeholderTextColor={colors.outline}
              />
            </Field>
          </View>
        </View>

        <View style={[styles.rowGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.gridItem}>
            <Field label={t('addRecipe.protein')}>
              <TextInput
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                style={[fonts.bodyLg, styles.input]}
                placeholder="0"
                placeholderTextColor={colors.outline}
              />
            </Field>
          </View>
          <View style={styles.gridItem}>
            <Field label={t('addRecipe.carbs')}>
              <TextInput
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
                style={[fonts.bodyLg, styles.input]}
                placeholder="0"
                placeholderTextColor={colors.outline}
              />
            </Field>
          </View>
          <View style={styles.gridItem}>
            <Field label={t('addRecipe.fat')}>
              <TextInput
                value={fat}
                onChangeText={setFat}
                keyboardType="numeric"
                style={[fonts.bodyLg, styles.input]}
                placeholder="0"
                placeholderTextColor={colors.outline}
              />
            </Field>
          </View>
        </View>

        <View>
          <Text
            style={[
              fonts.headlineMd,
              { color: colors.onSurface, marginBottom: spacing.gutter },
            ]}
          >
            {t('addRecipe.ingredients')}
          </Text>
          <View style={{ gap: spacing.stackMd }}>
            {ingredients.map((it) => (
              <View key={it.id} style={styles.ingredientCard}>
                <TextInput
                  value={it.name}
                  onChangeText={(v) => updateIngredient(it.id, { name: v })}
                  placeholder={t('addRecipe.ingredientName')}
                  placeholderTextColor={colors.outline}
                  style={[fonts.bodyLg, styles.input, { marginBottom: spacing.base }]}
                />
                <View style={[styles.rowGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      value={it.amount}
                      onChangeText={(v) => updateIngredient(it.id, { amount: v })}
                      placeholder={t('addRecipe.amount')}
                      placeholderTextColor={colors.outline}
                      keyboardType="decimal-pad"
                      style={[fonts.bodyLg, styles.input]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <UnitPicker
                      value={it.unit}
                      onChange={(unit) => updateIngredient(it.id, { unit })}
                    />
                  </View>
                </View>
                {ingredients.length > 1 ? (
                  <Pressable
                    onPress={() => removeIngredient(it.id)}
                    style={({ pressed }) => [
                      styles.miniRemove,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Icon name="close" size={16} color={colors.outline} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
          <Pressable
            onPress={addIngredient}
            style={({ pressed }) => [
              styles.addBtn,
              { opacity: pressed ? 0.7 : 1, flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Icon name="add" size={18} color={colors.primary} />
            <Text style={[fonts.labelCaps, { color: colors.primary }]}>
              {t('addRecipe.addIngredient')}
            </Text>
          </Pressable>
        </View>

        <View>
          <Text
            style={[
              fonts.headlineMd,
              { color: colors.onSurface, marginBottom: spacing.gutter },
            ]}
          >
            {t('addRecipe.instructions')}
          </Text>
          <View style={{ gap: spacing.stackMd }}>
            {steps.map((s, idx) => (
              <View key={s.id} style={styles.stepCard}>
                <Text style={[fonts.labelCaps, { color: colors.secondary, marginBottom: 6 }]}>
                  {t('addRecipe.step')} {idx + 1}
                </Text>
                <TextInput
                  value={s.text}
                  onChangeText={(v) => updateStep(s.id, v)}
                  multiline
                  textAlignVertical="top"
                  style={[fonts.bodyLg, styles.input, { minHeight: 60 }]}
                />
                {steps.length > 1 ? (
                  <Pressable
                    onPress={() => removeStep(s.id)}
                    style={({ pressed }) => [
                      styles.miniRemove,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Icon name="close" size={16} color={colors.outline} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
          <Pressable
            onPress={addStep}
            style={({ pressed }) => [
              styles.addBtn,
              { opacity: pressed ? 0.7 : 1, flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Icon name="add" size={18} color={colors.primary} />
            <Text style={[fonts.labelCaps, { color: colors.primary }]}>
              {t('addRecipe.addStep')}
            </Text>
          </Pressable>
        </View>

        {isEditMode ? (
          <Pressable
            onPress={onDeleteFromEdit}
            style={({ pressed }) => [
              styles.deleteFormBtn,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Icon name="delete" size={18} color={colors.error} />
            <Text style={[fonts.labelCaps, { color: colors.error }]}>
              {t('recipe.delete')}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { fonts, isRTL } = useTranslation();
  return (
    <View>
      <Text
        style={[
          fonts.labelCaps,
          { color: colors.onSurfaceVariant, marginBottom: spacing.base },
          isRTL && { writingDirection: 'rtl', textAlign: 'right' },
        ]}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function UnitPicker({
  value,
  onChange,
}: {
  value: Unit;
  onChange: (unit: Unit) => void;
}) {
  const { fonts, t } = useTranslation();
  const next = () => {
    const i = UNITS.indexOf(value);
    onChange(UNITS[(i + 1) % UNITS.length]);
  };
  return (
    <Pressable
      onPress={next}
      style={({ pressed }) => [
        styles.input,
        styles.unitBtn,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[fonts.bodyLg, { color: colors.onSurface }]}>
        {t(`unit.${value}` as TranslationKey)}
      </Text>
      <Icon name="chevron-right" size={18} color={colors.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.gutter,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  input: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.gutter,
    paddingVertical: 12,
    color: colors.onSurface,
  },
  rowGrid: {
    gap: spacing.stackMd,
  },
  gridItem: {
    flex: 1,
  },
  ingredientCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.gutter,
    ...cardShadow,
  },
  stepCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.gutter,
    ...cardShadow,
  },
  addBtn: {
    marginTop: spacing.stackMd,
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.pill,
  },
  unitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  jsonCard: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.xl,
    padding: spacing.gutter,
    gap: spacing.stackSm,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jsonInput: {
    minHeight: 100,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    backgroundColor: '#ffffff',
  },
  jsonApplyBtn: {
    marginTop: spacing.stackSm,
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  categoryRow: {
    flexWrap: 'wrap',
    gap: spacing.stackSm,
  },
  categoryChip: {
    paddingHorizontal: spacing.gutter,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipInactive: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
  },
  deleteFormBtn: {
    marginTop: spacing.stackLg,
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.errorContainer,
    borderRadius: radius.pill,
  },
  toggleRow: {
    gap: spacing.stackSm,
  },
  toggleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleChipInactive: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
  },
  pickerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg,
  },
  previewWrap: {
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
});
