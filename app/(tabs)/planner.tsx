import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/AppHeader';
import { CategoryFilter } from '../../src/components/CategoryFilter';
import { Icon } from '../../src/components/Icon';
import { SearchBar } from '../../src/components/SearchBar';
import { useTranslation, type TranslationKey } from '../../src/hooks/useTranslation';
import { usePlanner } from '../../src/store/planner';
import { useRecipes } from '../../src/store/recipes';
import { useShopping } from '../../src/store/shopping';
import { cardShadow, colors, radius, spacing } from '../../src/theme';
import {
  DAYS,
  MEAL_SLOTS,
  type Category,
  type Day,
  type MealSlot,
  type Recipe,
} from '../../src/types';

interface PickerTarget {
  day: Day;
  slot: MealSlot;
}

export default function PlannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fonts, t, tr, isRTL } = useTranslation();
  const recipes = useRecipes((s) => s.recipes);
  const week = usePlanner((s) => s.week);
  const setMeal = usePlanner((s) => s.setMeal);
  const removeMeal = usePlanner((s) => s.removeMeal);
  const clearWeek = usePlanner((s) => s.clearWeek);
  const addRecipesAll = useShopping((s) => s.addRecipesAll);

  const recipesById = useMemo(() => {
    const m = new Map<string, Recipe>();
    recipes.forEach((r) => m.set(r.id, r));
    return m;
  }, [recipes]);

  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerCategory, setPickerCategory] = useState<Category | 'all'>('all');

  const plannedRecipes = useMemo(() => {
    const list: Recipe[] = [];
    DAYS.forEach((day) => {
      const dayPlan = week[day];
      if (!dayPlan) return;
      MEAL_SLOTS.forEach((slot) => {
        const id = dayPlan[slot];
        if (!id) return;
        const r = recipesById.get(id);
        if (r) list.push(r);
      });
    });
    return list;
  }, [week, recipesById]);

  const onAddToShopping = () => {
    if (plannedRecipes.length === 0) {
      Alert.alert(t('planner.title'), t('planner.empty'));
      return;
    }
    const added = addRecipesAll(plannedRecipes);
    if (added > 0) {
      Alert.alert(t('planner.allAdded'), `+${added}`);
    }
  };

  const onClearWeek = () => {
    Alert.alert(t('planner.title'), t('planner.clearWeekConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: clearWeek },
    ]);
  };

  const onAddSlot = (day: Day, slot: MealSlot) => {
    setPickerQuery('');
    setPickerCategory('all');
    setPicker({ day, slot });
  };

  const onOpenSlot = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const onRemoveSlot = (day: Day, slot: MealSlot) => {
    Alert.alert(
      t('planner.title'),
      t('planner.removeConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('planner.remove'),
          style: 'destructive',
          onPress: () => removeMeal(day, slot),
        },
      ],
    );
  };

  const onPickRecipe = (recipe: Recipe) => {
    if (!picker) return;
    setMeal(picker.day, picker.slot, recipe.id);
    setPicker(null);
  };

  const filteredPickerRecipes = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    return recipes.filter((r) => {
      if (pickerCategory !== 'all' && r.category !== pickerCategory) return false;
      if (q.length === 0) return true;
      return tr(r.name).toLowerCase().includes(q);
    });
  }, [recipes, pickerQuery, pickerCategory, tr]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.marginMobile,
          paddingBottom: spacing.marginMobile + 60 + insets.bottom,
          gap: spacing.stackLg,
        }}
      >
        <View>
          <Text
            style={[
              fonts.displayLgMobile,
              { color: colors.onSurface },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
          >
            {t('planner.title')}
          </Text>
          <Text
            style={[
              fonts.bodyLg,
              { color: colors.secondary, marginTop: spacing.stackSm },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
          >
            {t('planner.subtitle')}
          </Text>
        </View>

        {plannedRecipes.length > 0 ? (
          <View
            style={[
              styles.actionsRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Pressable
              onPress={onAddToShopping}
              style={({ pressed }) => [
                styles.primaryAction,
                pressed && { opacity: 0.85 },
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <Icon name="basket" size={18} color={colors.onPrimary} filled />
              <Text style={[fonts.labelCaps, { color: colors.onPrimary }]}>
                {t('planner.addAllToList')}
              </Text>
            </Pressable>
            <Pressable
              onPress={onClearWeek}
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[fonts.labelCaps, { color: colors.error }]}>
                {t('planner.clearWeek')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {DAYS.map((day) => {
          const dayPlan = week[day] ?? {};
          const hasAny = MEAL_SLOTS.some((slot) => dayPlan[slot]);
          return (
            <View key={day} style={styles.dayCard}>
              <View
                style={[
                  styles.dayHeader,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <Text
                  style={[
                    fonts.headlineMd,
                    { color: colors.onSurface },
                    isRTL && { writingDirection: 'rtl' },
                  ]}
                >
                  {t(`day.${day}` as TranslationKey)}
                </Text>
                {!hasAny ? (
                  <Text style={[fonts.labelCaps, { color: colors.outline }]}>
                    {t('planner.empty')}
                  </Text>
                ) : null}
              </View>
              <View style={{ gap: spacing.stackSm }}>
                {MEAL_SLOTS.map((slot) => {
                  const id = dayPlan[slot];
                  const recipe = id ? recipesById.get(id) : undefined;
                  if (recipe) {
                    return (
                      <Pressable
                        key={slot}
                        onPress={() => onOpenSlot(recipe.id)}
                        style={({ pressed }) => [
                          styles.slot,
                          styles.slotFilled,
                          pressed && { opacity: 0.85 },
                          { flexDirection: isRTL ? 'row-reverse' : 'row' },
                        ]}
                      >
                        <View style={styles.slotLabelWrap}>
                          <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                            style={[
                              fonts.labelCaps,
                              { color: colors.onSurfaceVariant },
                            ]}
                          >
                            {t(`meal.${slot}` as TranslationKey)}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.slotContent,
                            { flexDirection: isRTL ? 'row-reverse' : 'row' },
                          ]}
                        >
                          <Image
                            source={recipe.imageUrl}
                            style={styles.slotThumb}
                            contentFit="cover"
                            transition={120}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              numberOfLines={1}
                              style={[
                                fonts.bodyLg,
                                { color: colors.onSurface },
                                isRTL && {
                                  writingDirection: 'rtl',
                                  textAlign: 'right',
                                },
                              ]}
                            >
                              {tr(recipe.name)}
                            </Text>
                            <Text
                              style={[
                                fonts.bodySm,
                                { color: colors.secondary },
                                isRTL && {
                                  writingDirection: 'rtl',
                                  textAlign: 'right',
                                },
                              ]}
                            >
                              {recipe.caloriesPer100g !== undefined
                                ? `${recipe.caloriesPer100g} ${t('recipe.kcalPer100g')}`
                                : `${recipe.calories} ${t('recipe.kcal')}`}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => onRemoveSlot(day, slot)}
                            hitSlop={12}
                            style={({ pressed }) => [
                              styles.removeBtn,
                              pressed && { opacity: 0.6 },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={t('planner.remove')}
                          >
                            <Icon name="close" size={18} color={colors.outline} />
                          </Pressable>
                        </View>
                      </Pressable>
                    );
                  }
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => onAddSlot(day, slot)}
                      style={({ pressed }) => [
                        styles.slot,
                        styles.slotEmpty,
                        pressed && { opacity: 0.85 },
                        { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      ]}
                    >
                      <View style={styles.slotLabelWrap}>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.8}
                          style={[
                            fonts.labelCaps,
                            { color: colors.onSurfaceVariant },
                          ]}
                        >
                          {t(`meal.${slot}` as TranslationKey)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.addRow,
                          { flexDirection: isRTL ? 'row-reverse' : 'row' },
                        ]}
                      >
                        <Icon name="add" size={18} color={colors.primary} />
                        <Text
                          style={[fonts.labelCaps, { color: colors.primary }]}
                        >
                          {t('planner.add')}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={picker !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPicker(null)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={[
              styles.modalHeader,
              {
                paddingTop: insets.top + spacing.stackMd,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            <Text
              style={[fonts.headlineMd, { color: colors.onSurface, flex: 1 }]}
            >
              {t('planner.pickRecipe')}
            </Text>
            <Pressable onPress={() => setPicker(null)} hitSlop={10}>
              <Icon name="close" size={26} color={colors.onSurface} />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: spacing.marginMobile, gap: spacing.stackMd }}>
            <SearchBar value={pickerQuery} onChangeText={setPickerQuery} />
            <CategoryFilter value={pickerCategory} onChange={setPickerCategory} />
          </View>
          <FlatList
            data={filteredPickerRecipes}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{
              padding: spacing.marginMobile,
              paddingBottom: spacing.marginMobile + insets.bottom,
              gap: spacing.stackMd,
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Icon name="search" size={40} color={colors.outline} />
                <Text
                  style={[
                    fonts.bodyLg,
                    {
                      color: colors.onSurfaceVariant,
                      marginTop: spacing.gutter,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {t('recipes.noResults')}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onPickRecipe(item)}
                style={({ pressed }) => [
                  styles.pickerCard,
                  pressed && { opacity: 0.9 },
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <Image
                  source={item.imageUrl}
                  style={styles.pickerThumb}
                  contentFit="cover"
                  transition={120}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    numberOfLines={1}
                    style={[
                      fonts.bodyLg,
                      { color: colors.onSurface },
                      isRTL && { writingDirection: 'rtl', textAlign: 'right' },
                    ]}
                  >
                    {tr(item.name)}
                  </Text>
                  <Text
                    style={[
                      fonts.bodySm,
                      { color: colors.secondary },
                      isRTL && { writingDirection: 'rtl', textAlign: 'right' },
                    ]}
                  >
                    {item.calories} {t('recipe.kcal')} • {item.prepTimeMinutes}{' '}
                    {t('recipe.min')}
                  </Text>
                </View>
                <View style={styles.pickerCategoryPill}>
                  <Text
                    numberOfLines={1}
                    style={[
                      fonts.labelCaps,
                      { color: colors.onSecondaryContainer },
                    ]}
                  >
                    {t(`category.${item.category}` as TranslationKey)}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    alignItems: 'center',
    gap: spacing.stackMd,
  },
  primaryAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.pill,
    ...cardShadow,
  },
  secondaryAction: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.errorContainer,
  },
  dayCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.gutter,
    gap: spacing.stackMd,
    ...cardShadow,
  },
  dayHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slot: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: spacing.stackMd,
    alignItems: 'center',
    gap: spacing.stackMd,
    minHeight: 56,
  },
  slotEmpty: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderStyle: 'dashed',
  },
  slotFilled: {
    backgroundColor: colors.secondaryFixed,
  },
  slotLabelWrap: {
    width: 96,
  },
  slotContent: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.stackMd,
  },
  slotThumb: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceContainer,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  modalHeader: {
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.gutter,
    alignItems: 'center',
    gap: spacing.stackMd,
  },
  pickerCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.stackMd,
    alignItems: 'center',
    gap: spacing.stackMd,
  },
  pickerThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceContainer,
  },
  pickerCategoryPill: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  empty: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
