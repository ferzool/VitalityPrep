import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
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
import { useTranslation } from '../../src/hooks/useTranslation';
import { useRecipes } from '../../src/store/recipes';
import { cardShadow, colors, radius, spacing } from '../../src/theme';
import type { Category, Recipe } from '../../src/types';

function RecipeListCard({ recipe }: { recipe: Recipe }) {
  const { fonts, tr, t, isRTL } = useTranslation();
  return (
    <Link href={`/recipe/${recipe.id}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      >
        <View style={styles.imageWrap}>
          <Image
            source={recipe.imageUrl}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            placeholder={undefined}
          />
          <View style={styles.gradient} />
          <View
            style={[
              styles.pillsRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={styles.kcalPill}>
              <Icon name="fire" size={14} color={colors.onPrimary} filled />
              <Text style={[fonts.labelCaps, styles.kcalText]}>
                {recipe.caloriesPer100g !== undefined
                  ? `${recipe.caloriesPer100g} ${t('recipe.kcalPer100g')}`
                  : `${recipe.calories} ${t('recipe.kcal')}`}
              </Text>
            </View>
            <View style={styles.timePill}>
              <Icon name="schedule" size={14} color={colors.onSurface} />
              <Text style={[fonts.labelCaps, { color: colors.onSurface }]}>
                {recipe.prepTimeMinutes} {t('recipe.min')}
              </Text>
            </View>
            <View style={styles.categoryPill}>
              <Text
                numberOfLines={1}
                style={[fonts.labelCaps, { color: colors.onSecondaryContainer }]}
              >
                {t(`category.${recipe.category}`)}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text
            numberOfLines={2}
            style={[
              fonts.headlineMd,
              { color: colors.onSurface },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
          >
            {tr(recipe.name)}
          </Text>
          {recipe.description ? (
            <Text
              numberOfLines={2}
              style={[
                fonts.bodySm,
                { color: colors.secondary, marginTop: spacing.stackSm },
                isRTL && { writingDirection: 'rtl', textAlign: 'right' },
              ]}
            >
              {tr(recipe.description)}
            </Text>
          ) : null}
          <View
            style={[
              styles.macroRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <MacroChip label={t('recipe.protein')} value={`${recipe.macros.protein}g`} />
            <MacroChip label={t('recipe.carbs')} value={`${recipe.macros.carbs}g`} />
            <MacroChip label={t('recipe.fat')} value={`${recipe.macros.fat}g`} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function MacroChip({ label, value }: { label: string; value: string }) {
  const { fonts } = useTranslation();
  return (
    <View style={styles.chip}>
      <Text
        style={[fonts.labelCaps, { color: colors.onSecondaryFixedVariant }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {label}
      </Text>
      <Text
        style={[
          fonts.numericData,
          { color: colors.primary, fontSize: 14, lineHeight: 18 },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

export default function RecipesScreen() {
  const router = useRouter();
  const { fonts, t, tr, isRTL } = useTranslation();
  const recipes = useRecipes((s) => s.recipes);
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [sort, setSort] = useState<'newest' | 'calAsc' | 'calDesc'>('newest');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = recipes.filter((r) => {
      if (category !== 'all' && r.category !== category) return false;
      if (q.length === 0) return true;
      const haystack = [tr(r.name), r.description ? tr(r.description) : '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
    return [...list].sort((a, b) => {
      if (sort === 'newest') return (b.addedAt ?? 0) - (a.addedAt ?? 0);
      if (sort === 'calAsc') return a.calories - b.calories;
      return b.calories - a.calories;
    });
  }, [recipes, query, category, sort, tr]);

  const isFiltering = query.trim().length > 0 || category !== 'all';

  const SORTS = [
    { key: 'newest', label: t('recipes.sortNewest') },
    { key: 'calAsc', label: t('recipes.sortCalAsc') },
    { key: 'calDesc', label: t('recipes.sortCalDesc') },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader />
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{
          padding: spacing.marginMobile,
          paddingBottom: spacing.marginMobile + 80 + insets.bottom,
          gap: spacing.gutter,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.stackMd, gap: spacing.stackMd }}>
            <View>
              <Text
                style={[
                  fonts.displayLgMobile,
                  { color: colors.onSurface },
                  isRTL && { writingDirection: 'rtl', textAlign: 'right' },
                ]}
              >
                {t('recipes.title')}
              </Text>
              <Text
                style={[
                  fonts.bodyLg,
                  { color: colors.secondary, marginTop: spacing.stackSm },
                  isRTL && { writingDirection: 'rtl', textAlign: 'right' },
                ]}
              >
                {t('recipes.subtitle')}
              </Text>
            </View>
            <SearchBar value={query} onChangeText={setQuery} />
            <CategoryFilter value={category} onChange={setCategory} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 8,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              }}
            >
              {SORTS.map((s) => (
                <Pressable
                  key={s.key}
                  onPress={() => setSort(s.key)}
                  style={[
                    styles.sortPill,
                    sort === s.key && styles.sortPillActive,
                  ]}
                >
                  <Text
                    style={[
                      fonts.labelCaps,
                      {
                        color:
                          sort === s.key
                            ? colors.onPrimary
                            : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon
              name={isFiltering ? 'search' : 'restaurant'}
              size={48}
              color={colors.outline}
            />
            <Text
              style={[
                fonts.bodyLg,
                {
                  color: colors.onSurfaceVariant,
                  textAlign: 'center',
                  marginTop: spacing.gutter,
                },
              ]}
            >
              {isFiltering ? t('recipes.noResults') : t('recipes.empty')}
            </Text>
          </View>
        }
        renderItem={({ item }) => <RecipeListCard recipe={item} />}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('recipes.add')}
        onPress={() => router.push('/recipe/new')}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: 72 + insets.bottom,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <LinearGradient
          colors={['#5c6f63', '#3f5247']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Icon name="add" size={28} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    ...cardShadow,
  },
  imageWrap: {
    height: 180,
    width: '100%',
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  pillsRow: {
    position: 'absolute',
    bottom: spacing.stackMd,
    left: spacing.stackMd,
    right: spacing.stackMd,
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  kcalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  kcalText: {
    color: colors.onPrimary,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  categoryPill: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  cardBody: {
    padding: spacing.gutter,
    gap: spacing.stackSm,
  },
  macroRow: {
    marginTop: spacing.stackMd,
    gap: spacing.base,
  },
  chip: {
    flex: 1,
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.stackMd,
    paddingVertical: spacing.base,
    alignItems: 'center',
    gap: 2,
  },
  empty: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  sortPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  fab: {
    position: 'absolute',
    right: spacing.marginMobile,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
});
