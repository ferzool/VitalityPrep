import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { colors, radius, spacing } from '../theme';

export function SyncErrorBanner({ message }: { message: string | null }) {
  const { fonts, t, isRTL } = useTranslation();
  if (!message) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text
        style={[
          fonts.bodySm,
          { color: colors.onErrorContainer },
          isRTL && { writingDirection: 'rtl', textAlign: 'right' },
        ]}
      >
        {t('common.syncError')} {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: spacing.stackMd,
    borderRadius: radius.lg,
    backgroundColor: colors.errorContainer,
  },
});
