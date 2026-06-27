import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { useShopping } from '../store/shopping';
import { cardShadow, colors, radius, spacing } from '../theme';
import type { Ingredient, Recipe, Unit } from '../types';
import { Icon } from './Icon';

interface IngredientRowProps {
  recipe: Recipe;
  ingredient: Ingredient;
}

function formatAmount(amount: number) {
  if (Number.isInteger(amount)) return String(amount);
  return amount.toFixed(amount < 1 ? 1 : 1).replace(/\.0$/, '');
}

const unitTranslationKey = (unit: Unit) => `unit.${unit}` as const;

export function IngredientRow({ recipe, ingredient }: IngredientRowProps) {
  const { fonts, tr, t, isRTL } = useTranslation();
  const items = useShopping((s) => s.items);
  const addIngredient = useShopping((s) => s.addIngredient);
  const remove = useShopping((s) => s.remove);

  const key = `${recipe.id}::${ingredient.id}`;
  const inList = items.some((it) => it.id === key);

  const onToggle = () => {
    if (inList) remove(key);
    else addIngredient(recipe, ingredient);
  };

  const unitLabel = t(unitTranslationKey(ingredient.unit));

  return (
    <View style={[styles.card, inList && styles.cardChecked]}>
      <View
        style={[
          styles.row,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <View style={[styles.labelGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text
            style={[
              fonts.bodyLg,
              { color: colors.onSurface },
              inList && styles.struck,
              isRTL && { writingDirection: 'rtl' },
            ]}
          >
            {tr(ingredient.name)}
          </Text>
          <Text
            style={[
              fonts.bodySm,
              { color: colors.secondary, marginTop: 2 },
              inList && styles.struck,
            ]}
          >
            {formatAmount(ingredient.amount)} {unitLabel}
          </Text>
        </View>
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={inList ? 'Remove from shopping list' : 'Add to shopping list'}
          style={({ pressed }) => [
            styles.iconBtn,
            inList && styles.iconBtnActive,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Icon
            name={inList ? 'check' : 'basket'}
            size={22}
            color={inList ? colors.onPrimary : colors.primary}
            filled={inList}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.gutter,
    paddingHorizontal: spacing.gutter,
    ...cardShadow,
  },
  cardChecked: {
    backgroundColor: colors.secondaryFixed,
    shadowOpacity: 0,
    elevation: 0,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelGroup: {
    flex: 1,
  },
  struck: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconBtnActive: {
    backgroundColor: colors.primary,
  },
});
