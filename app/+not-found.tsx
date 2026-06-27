import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../src/hooks/useTranslation';
import { colors, spacing } from '../src/theme';

export default function NotFoundScreen() {
  const { fonts } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <Text style={[fonts.headlineMd, { color: colors.onSurface }]}>404</Text>
        <Link href="/" style={[fonts.bodyLg, styles.link]}>
          Go home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.marginMobile,
    gap: spacing.gutter,
  },
  link: {
    color: colors.primary,
  },
});
