import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../src/components/Icon';
import { useTranslation } from '../src/hooks/useTranslation';
import { signInWithToken } from '../src/lib/auth';
import {
  isWebauthnAvailable,
  loginWithPasskey,
  WebauthnCancelled,
} from '../src/lib/webauthn';
import { cardShadow, colors, radius, spacing } from '../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fonts, t, isRTL } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isWebauthnAvailable());
  }, []);

  const onSignIn = async () => {
    if (busy) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const result = await loginWithPasskey();
      await signInWithToken(result.customToken, result.displayName);
      // AuthGate handles redirect
    } catch (err) {
      if (err instanceof WebauthnCancelled) {
        // user cancelled — silent
      } else {
        const msg = (err as Error).message ?? t('auth.signInError');
        setErrorMsg(msg);
        try {
          Alert.alert(t('auth.signIn'), msg);
        } catch {
          // some PWA contexts swallow Alert silently — inline error already set
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.center}>
        <View style={styles.brand}>
          <Image
            source={require('../public/apple-touch-icon.png')}
            style={styles.appIcon}
            contentFit="contain"
          />
          <Text
            style={[
              fonts.displayLgMobile,
              { color: colors.onSurface, marginTop: spacing.stackLg, textAlign: 'center' },
            ]}
          >
            {t('app.title')}
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
            {t('auth.signInHint')}
          </Text>
        </View>

        {supported ? (
          <Pressable
            accessibilityRole="button"
            onPress={onSignIn}
            disabled={busy}
            style={({ pressed }) => [
              styles.signInButton,
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
                  {Platform.OS === 'ios' ? t('auth.signInFaceId') : t('auth.signIn')}
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
          accessibilityRole="link"
          onPress={() => router.push('/admin/enroll')}
          style={({ pressed }) => [
            styles.enrollLink,
            pressed ? { opacity: 0.7 } : null,
          ]}
        >
          <Text style={[fonts.bodyLg, { color: colors.primary }]}>
            {t('auth.enrollNew')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
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
  appIcon: {
    width: 96,
    height: 96,
    borderRadius: 22,
  },
  signInButton: {
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
  enrollLink: {
    alignItems: 'center',
    padding: spacing.stackMd,
  },
});
