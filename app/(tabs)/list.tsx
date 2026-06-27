import { useMemo } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/AppHeader';
import { Icon } from '../../src/components/Icon';
import { QuantityCounter } from '../../src/components/QuantityCounter';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useShopping } from '../../src/store/shopping';
import { cardShadow, colors, radius, spacing } from '../../src/theme';
import type { ShoppingItem, Unit } from '../../src/types';

function formatAmount(amount: number) {
  if (Number.isInteger(amount)) return String(amount);
  return amount.toFixed(1).replace(/\.0$/, '');
}

const unitTranslationKey = (unit: Unit) => `unit.${unit}` as const;

function Row({ item }: { item: ShoppingItem }) {
  const { fonts, tr, t, isRTL } = useTranslation();
  const toggle = useShopping((s) => s.toggle);
  const remove = useShopping((s) => s.remove);
  const increment = useShopping((s) => s.increment);
  const decrement = useShopping((s) => s.decrement);

  return (
    <View
      style={[
        styles.row,
        item.checked && styles.rowChecked,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      <Pressable
        onPress={() => toggle(item.id)}
        hitSlop={6}
        style={[styles.checkbox, item.checked && styles.checkboxChecked]}
      >
        {item.checked ? <Icon name="check" size={16} color={colors.onPrimary} /> : null}
      </Pressable>
      <Pressable
        onPress={() => toggle(item.id)}
        style={styles.body}
      >
        <Text
          style={[
            fonts.bodyLg,
            { color: colors.onSurface },
            item.checked && styles.strike,
            isRTL && { writingDirection: 'rtl', textAlign: 'right' },
          ]}
          numberOfLines={1}
        >
          {tr(item.name)}
        </Text>
        <View style={[styles.subRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text
            style={[
              fonts.bodySm,
              styles.amount,
              item.checked && styles.strike,
            ]}
          >
            {item.quantity}× {formatAmount(item.amount)} {t(unitTranslationKey(item.unit))}
          </Text>
          <Text style={[fonts.bodySm, { color: colors.outline }]}>•</Text>
          <Text
            style={[
              fonts.bodySm,
              { color: colors.outline, flexShrink: 1 },
              isRTL && { writingDirection: 'rtl' },
            ]}
            numberOfLines={1}
          >
            {tr(item.recipeName)}
          </Text>
        </View>
      </Pressable>
      <QuantityCounter
        value={item.quantity}
        onIncrement={() => increment(item.id)}
        onDecrement={() => decrement(item.id)}
        disabled={item.checked}
      />
      <Pressable
        hitSlop={10}
        onPress={() => remove(item.id)}
        accessibilityLabel="Remove"
        style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Icon name="close" size={18} color={colors.outline} />
      </Pressable>
    </View>
  );
}

export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const { fonts, t, isRTL } = useTranslation();
  const items = useShopping((s) => s.items);
  const clearChecked = useShopping((s) => s.clearChecked);
  const clearAll = useShopping((s) => s.clearAll);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return b.addedAt - a.addedAt;
    });
  }, [items]);

  const remaining = items.filter((i) => !i.checked).length;
  const total = items.length;

  const confirmClearChecked = () => {
    Alert.alert(t('shopping.title'), t('shopping.confirmClearChecked'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: clearChecked },
    ]);
  };

  const confirmClearAll = () => {
    Alert.alert(t('shopping.title'), t('shopping.confirmClearAll'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: clearAll },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader />
      <FlatList
        data={sorted}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{
          padding: spacing.marginMobile,
          paddingBottom: spacing.marginMobile + 60 + insets.bottom,
          gap: spacing.stackMd,
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.stackMd, gap: spacing.stackMd }}>
            <Text
              style={[
                fonts.displayLgMobile,
                { color: colors.onSurface },
                isRTL && { writingDirection: 'rtl', textAlign: 'right' },
              ]}
            >
              {t('shopping.title')}
            </Text>
            {total > 0 ? (
              <View
                style={[
                  styles.summaryRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <Text style={[fonts.bodySm, { color: colors.secondary }]}>
                  {remaining} / {total} {t('shopping.remaining')}
                </Text>
                <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {items.some((i) => i.checked) ? (
                    <Pressable
                      onPress={confirmClearChecked}
                      style={({ pressed }) => [
                        styles.actionBtn,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Text style={[fonts.labelCaps, { color: colors.primary }]}>
                        {t('shopping.clearChecked')}
                      </Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={confirmClearAll}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={[fonts.labelCaps, { color: colors.error }]}>
                      {t('shopping.clearAll')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="basket" size={48} color={colors.outline} />
            <Text
              style={[
                fonts.bodyLg,
                {
                  color: colors.onSurfaceVariant,
                  textAlign: 'center',
                  marginTop: spacing.gutter,
                  paddingHorizontal: spacing.gutter,
                },
              ]}
            >
              {t('shopping.empty')}
            </Text>
          </View>
        }
        renderItem={({ item }) => <Row item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.gutter,
    paddingHorizontal: spacing.gutter,
    alignItems: 'center',
    gap: spacing.stackMd,
    ...cardShadow,
  },
  rowChecked: {
    backgroundColor: colors.secondaryFixed,
    shadowOpacity: 0,
    elevation: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  subRow: {
    gap: spacing.base,
    alignItems: 'center',
  },
  amount: {
    color: colors.secondary,
  },
  strike: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    gap: spacing.gutter,
    alignItems: 'center',
  },
  actionBtn: {
    paddingVertical: 4,
  },
  empty: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
