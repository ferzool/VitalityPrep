import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
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
import { AppHeader } from '../../src/components/AppHeader';
import { CategoryFilter } from '../../src/components/CategoryFilter';
import { Icon } from '../../src/components/Icon';
import {
  PlannerDropSlot,
  type PlannerSlotAddress,
} from '../../src/components/PlannerDropSlot';
import { SearchBar } from '../../src/components/SearchBar';
import { useSafeInsets } from '../../src/hooks/useSafeInsets';
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
  const insets = useSafeInsets();
  const router = useRouter();
  const { fonts, t, tr, isRTL } = useTranslation();
  const recipes = useRecipes((s) => s.recipes);
  const week = usePlanner((s) => s.week);
  const setMeal = usePlanner((s) => s.setMeal);
  const removeMeal = usePlanner((s) => s.removeMeal);
  const moveMeal = usePlanner((s) => s.moveMeal);
  const clearDay = usePlanner((s) => s.clearDay);
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
  const [draggingSource, setDraggingSource] = useState<PlannerSlotAddress | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const slotNodes = useRef(new Map<string, View>());
  const slotRects = useRef(new Map<string, { x: number; y: number; width: number; height: number }>());

  const registerSlot = useCallback((address: PlannerSlotAddress, node: View | null) => {
    const key = `${address.day}:${address.slot}`;
    if (node) slotNodes.current.set(key, node);
    else slotNodes.current.delete(key);
  }, []);

  const findDropTarget = useCallback((pageX: number, pageY: number) => {
    for (const [key, rect] of slotRects.current) {
      if (
        pageX >= rect.x &&
        pageX <= rect.x + rect.width &&
        pageY >= rect.y &&
        pageY <= rect.y + rect.height
      ) return key;
    }
    return null;
  }, []);

  const onDragStart = useCallback((source: PlannerSlotAddress) => {
    setDraggingSource(source);
    slotRects.current.clear();
    slotNodes.current.forEach((node, key) => {
      node.measureInWindow((x, y, width, height) => {
        slotRects.current.set(key, { x, y, width, height });
      });
    });
  }, []);

  const onDragMove = useCallback((pageX: number, pageY: number) => {
    setDropTargetKey(findDropTarget(pageX, pageY));
  }, [findDropTarget]);

  const onDragEnd = useCallback((source: PlannerSlotAddress, pageX: number, pageY: number) => {
    const targetKey = findDropTarget(pageX, pageY);
    if (targetKey) {
      const [day, slot] = targetKey.split(':') as [Day, MealSlot];
      moveMeal(source.day, source.slot, day, slot);
    }
    setDraggingSource(null);
    setDropTargetKey(null);
  }, [findDropTarget, moveMeal]);

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

  const plannedCount = useMemo(
    () => DAYS.reduce((total, day) => (
      total + MEAL_SLOTS.filter((slot) => Boolean(week[day]?.[slot])).length
    ), 0),
    [week],
  );

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

  const onClearDay = (day: Day) => {
    Alert.alert(t(`day.${day}` as TranslationKey), t('planner.clearDayConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: () => clearDay(day) },
    ]);
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
        scrollEnabled={draggingSource === null}
        contentContainerStyle={{
          paddingTop: spacing.marginMobile,
          paddingHorizontal: spacing.marginMobile + Math.max(insets.left, insets.right),
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

        <View style={styles.weekSummary}>
          <View style={styles.progressCopy}>
            <Text style={[fonts.headlineMd, { color: colors.onPrimary }]}>
              {plannedCount}/21
            </Text>
            <Text style={[fonts.bodySm, { color: colors.onPrimaryContainer }]}>
              {t('planner.mealsPlanned')}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round((plannedCount / 21) * 100)}%` },
              ]}
            />
          </View>
          <Text style={[fonts.bodySm, { color: colors.onPrimaryContainer }]}>
            {t('planner.dragHint')}
          </Text>
        </View>

        {plannedCount > 0 ? (
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
                ) : (
                  <Pressable
                    onPress={() => onClearDay(day)}
                    hitSlop={8}
                    style={({ pressed }) => [styles.clearDayBtn, pressed && { opacity: 0.65 }]}
                  >
                    <Icon name="delete" size={17} color={colors.error} />
                    <Text style={[fonts.labelCaps, { color: colors.error }]}>
                      {t('planner.clearDay')}
                    </Text>
                  </Pressable>
                )}
              </View>
              <View style={{ gap: spacing.stackSm }}>
                {MEAL_SLOTS.map((slot) => {
                  const id = dayPlan[slot];
                  const recipe = id ? recipesById.get(id) : undefined;
                  if (recipe) {
                    return (
                      <PlannerDropSlot
                        key={slot}
                        address={{ day, slot }}
                        draggable
                        isDropTarget={dropTargetKey === `${day}:${slot}`}
                        isRTL={isRTL}
                        dragLabel={t('planner.dragMeal')}
                        register={registerSlot}
                        onDragStart={onDragStart}
                        onDragMove={onDragMove}
                        onDragEnd={onDragEnd}
                      >
                        <Pressable
                          onPress={() => onOpenSlot(recipe.id)}
                          style={({ pressed }) => [
                            styles.slot,
                            styles.slotFilled,
                            pressed && { opacity: 0.85 },
                            {
                              flexDirection: isRTL ? 'row-reverse' : 'row',
                              paddingLeft: isRTL ? 48 : spacing.stackMd,
                              paddingRight: isRTL ? spacing.stackMd : 48,
                            },
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
                      </PlannerDropSlot>
                    );
                  }
                  return (
                    <PlannerDropSlot
                      key={slot}
                      address={{ day, slot }}
                      isDropTarget={dropTargetKey === `${day}:${slot}`}
                      isRTL={isRTL}
                      dragLabel={t('planner.dragMeal')}
                      register={registerSlot}
                      onDragStart={onDragStart}
                      onDragMove={onDragMove}
                      onDragEnd={onDragEnd}
                    >
                      <Pressable
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
                    </PlannerDropSlot>
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
  weekSummary: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.gutter,
    gap: spacing.stackSm,
    ...cardShadow,
  },
  progressCopy: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.base,
  },
  progressTrack: {
    height: 7,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primaryFixed,
  },
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
  clearDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.errorContainer,
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
