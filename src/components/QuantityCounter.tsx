import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { useTranslation } from '../hooks/useTranslation';
import { colors, radius, spacing } from '../theme';

interface QuantityCounterProps {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
  disabled?: boolean;
}

export function QuantityCounter({
  value,
  onDecrement,
  onIncrement,
  min = 1,
  disabled = false,
}: QuantityCounterProps) {
  const { fonts, isRTL } = useTranslation();
  const canDecrement = value > min && !disabled;
  return (
    <View
      style={[
        styles.wrap,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Pressable
        onPress={onDecrement}
        disabled={!canDecrement}
        hitSlop={6}
        style={({ pressed }) => [
          styles.btn,
          !canDecrement && styles.btnDisabled,
          pressed && canDecrement && styles.btnPressed,
        ]}
        accessibilityLabel="decrease"
      >
        <Icon
          name="remove"
          size={16}
          color={canDecrement ? colors.onPrimaryContainer : colors.outline}
        />
      </Pressable>
      <View style={styles.valueWrap}>
        <Text
          style={[
            fonts.numericData,
            { color: colors.onSurface, textAlign: 'center', minWidth: 24 },
          ]}
        >
          {value}
        </Text>
      </View>
      <Pressable
        onPress={onIncrement}
        disabled={disabled}
        hitSlop={6}
        style={({ pressed }) => [
          styles.btn,
          pressed && !disabled && styles.btnPressed,
        ]}
        accessibilityLabel="increase"
      >
        <Icon name="add" size={16} color={colors.onPrimaryContainer} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    height: 32,
  },
  btn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPressed: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  valueWrap: {
    paddingHorizontal: spacing.stackSm,
  },
});
