import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation, type TranslationKey } from '../hooks/useTranslation';
import { colors, radius, spacing } from '../theme';
import { CATEGORIES, type Category } from '../types';

interface CategoryFilterProps {
  value: Category | 'all';
  onChange: (value: Category | 'all') => void;
}

const ITEMS: Array<{ id: Category | 'all'; key: TranslationKey }> = [
  { id: 'all', key: 'category.all' },
  ...CATEGORIES.map((c) => ({
    id: c,
    key: `category.${c}` as TranslationKey,
  })),
];

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const { t, fonts, isRTL } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.row,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      {ITEMS.map((it) => {
        const active = value === it.id;
        return (
          <Pressable
            key={it.id}
            onPress={() => onChange(it.id)}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipInactive,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                fonts.labelCaps,
                {
                  color: active ? colors.onPrimary : colors.onSurfaceVariant,
                },
              ]}
            >
              {t(it.key)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.stackSm,
    paddingVertical: spacing.stackSm,
  },
  chip: {
    paddingHorizontal: spacing.gutter,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
  },
});
