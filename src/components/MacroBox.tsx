import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { cardShadow, colors, radius, spacing } from '../theme';

interface MacroBoxProps {
  label: string;
  value: number;
  unit?: string;
  percent: number;
}

export function MacroBox({ label, value, unit = 'g', percent }: MacroBoxProps) {
  const { fonts } = useTranslation();
  const clamped = Math.max(0.05, Math.min(1, percent));

  return (
    <View style={styles.card}>
      <Text
        style={[fonts.labelCaps, styles.label]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        allowFontScaling={false}
      >
        {label}
      </Text>
      <Text style={[fonts.numericData, styles.value]} numberOfLines={1}>
        {value}
        {unit}
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.gutter,
    paddingHorizontal: spacing.stackSm,
    alignItems: 'center',
    ...cardShadow,
  },
  label: {
    color: colors.secondary,
    marginBottom: spacing.stackSm,
    textAlign: 'center',
    width: '100%',
  },
  value: {
    color: colors.primary,
  },
  track: {
    marginTop: spacing.base,
    width: '100%',
    height: 4,
    backgroundColor: colors.primaryFixed,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
});
