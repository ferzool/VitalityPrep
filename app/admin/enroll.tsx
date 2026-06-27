import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../src/components/Icon';
import { useTranslation } from '../../src/hooks/useTranslation';
import { signInWithToken } from '../../src/lib/auth';
import {
  enrollPasskey,
  isWebauthnAvailable,
  WebauthnCancelled,
} from '../../src/lib/webauthn';
import { cardShadow, colors, radius, spacing } from '../../src/theme';

export default function EnrollScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fonts, t, isRTL } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(isWebauthnAvailable());
  }, []);

  const onEnroll = async () => {
    const name = displayName.trim();
    if (!name) {
      Alert.alert(t('auth.enroll'), t('auth.nameRequired'));
      return;
    }
    setBusy(true);
    try {
      const result = await enrollPasskey(name);
      await signInWithToken(result.customToken, result.displayName);
      // AuthGate handles redirect
    } catch (err) {
      if (err instanceof WebauthnCancelled) {
        // user cancelled — silent
      } else {
        Alert.alert(t('auth.enroll'), (err as Error).message ?? t('auth.enrollError'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.replace('/login')}
          style={({ pressed }) => [
            styles.backButton,
            pressed ? { opacity: 0.7 } : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        >
          <Icon
            name={isRTL ? 'arrow-right' : 'arrow-left'}
            size={24}
            color={colors.primary}
          />
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={styles.brand}>
          <Icon name="fingerprint" size={64} color={colors.primary} />
          <Text
            style={[
              fonts.displayLgMobile,
              { color: colors.onSurface, marginTop: spacing.stackLg, textAlign: 'center' },
            ]}
          >
            {t('auth.enroll')}
          </Text>
          <Text
            style={[
              fonts.bodyLg,
              {
                color: colors.onSurfaceVariant,
                marginTop: spacing.stackSm,
                textAlign: 'center',
              },
              isRTL && { writingDirection: 'rtl' },
            ]}
          >
            {t('auth.enrollHint')}
          </Text>
        </View>

        <View style={styles.field}>
          <Text
            style={[
              fonts.labelCaps,
              { color: colors.onSurfaceVariant, marginBottom: spacing.stackSm },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
          >
            {t('auth.displayName')}
          </Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('auth.displayNamePlaceholder')}
            placeholderTextColor={colors.outline}
            autoCapitalize="words"
            autoCorrect={false}
            style={[
              styles.input,
              fonts.bodyLg,
              { color: colors.onSurface },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
          />
        </View>

        {supported ? (
          <Pressable
            accessibilityRole="button"
            onPress={onEnroll}
            disabled={busy}
            style={({ pressed }) => [
              styles.enrollButton,
              pressed && !busy ? { opacity: 0.85 } : null,
              busy ? { opacity: 0.6 } : null,
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <>
                <Icon name="fingerprint" size={22} color={colors.onPrimary} />
                <Text style={[fonts.headlineMd, { color: colors.onPrimary, fontSize: 18 }]}>
                  {t('auth.enroll')}
                </Text>
              </>
            )}
          </Pressable>
        ) : (
          <View style={styles.unsupportedBox}>
            <Text style={[fonts.bodyLg, { color: colors.onSurface, textAlign: 'center' }]}>
              {t('auth.unsupportedBrowser')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.stackMd,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    paddingHorizontal: spacing.marginMobile,
    justifyContent: 'center',
    gap: spacing.stackLg,
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.stackLg,
  },
  field: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.gutter,
    paddingVertical: 14,
    minHeight: 56,
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.stackSm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.gutter,
    paddingVertical: 14,
    borderRadius: radius.xl,
    minHeight: 56,
    ...cardShadow,
  },
  unsupportedBox: {
    padding: spacing.gutter,
    backgroundColor: colors.errorContainer,
    borderRadius: radius.lg,
  },
});
