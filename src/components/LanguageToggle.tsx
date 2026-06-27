import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from '../hooks/useTranslation';
import { useSettings } from '../store/settings';
import { colors, radius } from '../theme';

export function LanguageToggle({ variant = 'light' }: { variant?: 'light' | 'onDark' }) {
  const toggle = useSettings((s) => s.toggleLocale);
  const { locale, fonts } = useTranslation();
  const isDark = variant === 'onDark';

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(locale === 'de' ? 0 : 36, {
          duration: 240,
        }),
      },
    ],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Toggle language"
      onPress={toggle}
      style={({ pressed }) => [
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Animated.View style={[styles.slider, sliderStyle]} />
      <View style={styles.segment}>
        <Animated.Text
          style={[
            fonts.labelCaps,
            styles.label,
            locale === 'de'
              ? styles.active
              : isDark
                ? styles.inactiveDark
                : styles.inactive,
          ]}
        >
          DE
        </Animated.Text>
      </View>
      <View style={[styles.divider, isDark && styles.dividerDark]} />
      <View style={styles.segment}>
        <Animated.Text
          style={[
            fonts.labelCaps,
            styles.label,
            locale === 'fa'
              ? styles.active
              : isDark
                ? styles.inactiveDark
                : styles.inactive,
          ]}
        >
          FA
        </Animated.Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  containerLight: {
    backgroundColor: colors.secondaryContainer,
  },
  containerDark: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  slider: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 4,
    width: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  segment: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    letterSpacing: 1,
  },
  active: {
    color: colors.primary,
  },
  inactive: {
    color: colors.onSurfaceVariant,
  },
  inactiveDark: {
    color: 'rgba(255,255,255,0.78)',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: 2,
  },
  dividerDark: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
