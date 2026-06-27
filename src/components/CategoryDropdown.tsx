import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Icon } from './Icon';
import { useTranslation, type TranslationKey } from '../hooks/useTranslation';
import { cardShadow, colors, radius, spacing } from '../theme';
import { CATEGORIES, type Category } from '../types';

interface CategoryDropdownProps {
  value: Category;
  onChange: (category: Category) => void;
}

export function CategoryDropdown({ value, onChange }: CategoryDropdownProps) {
  const { fonts, t, isRTL } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.field,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            fonts.bodyLg,
            { color: colors.onSurface, flex: 1 },
            isRTL && { writingDirection: 'rtl', textAlign: 'right' },
          ]}
        >
          {t(`category.${value}` as TranslationKey)}
        </Text>
        <Icon name="chevron-down" size={20} color={colors.outline} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            {CATEGORIES.map((c) => {
              const active = c === value;
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.item,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    pressed && { backgroundColor: colors.secondaryFixed },
                  ]}
                >
                  <Text
                    style={[
                      fonts.bodyLg,
                      {
                        flex: 1,
                        color: active ? colors.primary : colors.onSurface,
                      },
                      isRTL && { writingDirection: 'rtl', textAlign: 'right' },
                    ]}
                  >
                    {t(`category.${c}` as TranslationKey)}
                  </Text>
                  {active ? (
                    <Icon name="check" size={20} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.gutter,
    paddingVertical: 12,
    minHeight: 48,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.marginMobile + 24,
    paddingTop: spacing.stackSm,
    ...cardShadow,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: spacing.stackMd,
  },
  item: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.stackMd,
    borderRadius: radius.lg,
    gap: spacing.stackMd,
  },
});
