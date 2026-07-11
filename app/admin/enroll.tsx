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
import { confirmAction } from '../../src/lib/confirmAction';
import {
  enrollPasskey,
  isWebauthnAvailable,
  resetAllPasskeys,
  WebauthnCancelled,
} from '../../src/lib/webauthn';
import { cardShadow, colors, radius, spacing } from '../../src/theme';

export default function EnrollScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fonts, t, isRTL } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [enrollSecret, setEnrollSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isWebauthnAvailable());
  }, []);

  const onEnroll = async () => {
    const name = displayName.trim();
    setErrorMsg(null);
    if (!name) {
      setErrorMsg(t('auth.nameRequired'));
      return;
    }
    if (!enrollSecret.trim()) {
      setErrorMsg(t('auth.enrollSecretRequired'));
      return;
    }
    setBusy(true);
    try {
      const result = await enrollPasskey(name, enrollSecret.trim());
      await signInWithToken(result.customToken, result.displayName);
      // AuthGate handles redirect
    } catch (err) {
      if (err instanceof WebauthnCancelled) {
        // user cancelled — silent
      } else {
        const msg = (err as Error).message ?? t('auth.enrollError');
        setErrorMsg(msg);
        try {
          Alert.alert(t('auth.enroll'), msg);
        } catch {
          // some PWA contexts swallow Alert silently — inline error already set
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const onResetPasskeys = () => {
    if (!enrollSecret.trim()) {
      setErrorMsg(t('auth.enrollSecretRequired'));
      return;
    }
    confirmAction({
      title: t('auth.resetAll'),
      message: t('auth.resetConfirm'),
      cancelText: t('common.cancel'),
      confirmText: t('common.delete'),
      onConfirm: async () => {
        setBusy(true);
        setErrorMsg(null);
        try {
          const result = await resetAllPasskeys(enrollSecret.trim());
          setErrorMsg(t('auth.resetDone').replace('{n}', String(result.deleted)));
        } catch (err) {
          const msg = (err as Error).message ?? t('auth.enrollError');
          setErrorMsg(msg);
          throw err;
        } finally {
          setBusy(false);
        }
      },
    });
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

        <View style={styles.field}>
          <Text
            style={[
              fonts.labelCaps,
              { color: colors.onSurfaceVariant, marginBottom: spacing.stackSm },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
          >
            {t('auth.enrollSecret')}
          </Text>
          <TextInput
            value={enrollSecret}
            onChangeText={setEnrollSecret}
            placeholder={t('auth.enrollSecretPlaceholder')}
            placeholderTextColor={colors.outline}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType="password"
            style={[
              styles.input,
              fonts.bodyLg,
              { color: colors.onSurface },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
          />
          <Text
            style={[
              fonts.bodySm,
              {
                color: colors.onSurfaceVariant,
                marginTop: spacing.stackSm,
              },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
          >
            {t('auth.enrollSecretHint')}
          </Text>
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

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text
              style={[
                fonts.bodyLg,
                { color: colors.onErrorContainer, textAlign: 'center' },
                isRTL && { writingDirection: 'rtl' },
              ]}
            >
              {errorMsg}
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onResetPasskeys}
          disabled={busy}
          style={({ pressed }) => [
            styles.resetLink,
            pressed && !busy ? { opacity: 0.7 } : null,
          ]}
        >
          <Text style={[fonts.bodySm, { color: colors.error, textAlign: 'center' }]}>
            {t('auth.resetAll')}
          </Text>
        </Pressable>
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
  errorBox: {
    padding: spacing.gutter,
    backgroundColor: colors.errorContainer,
    borderRadius: radius.lg,
  },
  resetLink: {
    alignItems: 'center',
    padding: spacing.stackMd,
  },
});
