import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/AppHeader';
import { Icon, type IconName } from '../../src/components/Icon';
import { LanguageToggle } from '../../src/components/LanguageToggle';
import { useTranslation } from '../../src/hooks/useTranslation';
import { signOutUser } from '../../src/lib/auth';
import { confirmAction } from '../../src/lib/confirmAction';
import { useAuth } from '../../src/store/auth';
import { usePlanner } from '../../src/store/planner';
import { useRecipes } from '../../src/store/recipes';
import { useShopping } from '../../src/store/shopping';
import { cardShadow, colors, radius, spacing } from '../../src/theme';

interface RowProps {
  icon: IconName;
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingsRow({ icon, label, hint, trailing, onPress, destructive }: RowProps) {
  const { fonts, isRTL } = useTranslation();
  const textColor = destructive ? colors.error : colors.onSurface;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        pressed && onPress ? { opacity: 0.85 } : null,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: destructive ? colors.errorContainer : colors.secondaryContainer },
        ]}
      >
        <Icon name={icon} size={20} color={destructive ? colors.error : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            fonts.bodyLg,
            { color: textColor },
            isRTL && { writingDirection: 'rtl', textAlign: 'right' },
          ]}
        >
          {label}
        </Text>
        {hint ? (
          <Text
            style={[
              fonts.bodySm,
              { color: colors.secondary, marginTop: 2 },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
          >
            {hint}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Pressable>
  );
}

function SectionTitle({ children }: { children: string }) {
  const { fonts, isRTL } = useTranslation();
  return (
    <Text
      style={[
        fonts.labelCaps,
        {
          color: colors.onSurfaceVariant,
          marginBottom: spacing.stackMd,
          marginTop: spacing.stackLg,
        },
        isRTL && { writingDirection: 'rtl', textAlign: 'right' },
      ]}
    >
      {children}
    </Text>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fonts, t, isRTL } = useTranslation();
  const currentUser = useAuth((s) => s.currentUser);
  const clearShopping = useShopping((s) => s.clearAll);
  const clearPlanner = usePlanner((s) => s.clearWeek);
  const resetCustom = useRecipes((s) => s.resetCustom);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const onResetRecipes = () => {
    confirmAction({
      title: t('profile.title'),
      message: t('profile.resetRecipesConfirm'),
      cancelText: t('common.cancel'),
      confirmText: t('common.confirm'),
      onConfirm: resetCustom,
    });
  };

  const onClearShopping = () => {
    confirmAction({
      title: t('profile.title'),
      message: t('shopping.confirmClearAll'),
      cancelText: t('common.cancel'),
      confirmText: t('common.confirm'),
      onConfirm: clearShopping,
    });
  };

  const onClearPlanner = () => {
    confirmAction({
      title: t('profile.title'),
      message: t('planner.clearWeekConfirm'),
      cancelText: t('common.cancel'),
      confirmText: t('common.confirm'),
      onConfirm: clearPlanner,
    });
  };

  const onSignOut = () => {
    confirmAction({
      title: t('auth.signOut'),
      message: t('auth.signOutConfirm'),
      cancelText: t('common.cancel'),
      confirmText: t('auth.signOut'),
      onConfirm: signOutUser,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.marginMobile,
          paddingBottom: spacing.marginMobile + 60 + insets.bottom,
        }}
      >
        <Text
          style={[
            fonts.displayLgMobile,
            { color: colors.onSurface },
            isRTL && { writingDirection: 'rtl', textAlign: 'right' },
          ]}
        >
          {t('profile.title')}
        </Text>

        {currentUser ? (
          <>
            <SectionTitle>{t('auth.account')}</SectionTitle>
            <View style={styles.card}>
              <SettingsRow
                icon="person"
                label={currentUser.displayName ?? t('auth.account')}
                hint={t('auth.signedInHint')}
              />
              <View style={styles.divider} />
              <SettingsRow
                icon="logout"
                label={t('auth.signOut')}
                onPress={onSignOut}
                destructive
                trailing={
                  <Icon name="chevron-right" size={20} color={colors.outline} />
                }
              />
            </View>
          </>
        ) : null}

        <SectionTitle>{t('profile.language')}</SectionTitle>
        <View style={styles.card}>
          <SettingsRow
            icon="translate"
            label={t('profile.language')}
            hint={t('profile.languageHint')}
            trailing={<LanguageToggle />}
          />
        </View>

        <SectionTitle>{t('profile.aiSection')}</SectionTitle>
        <View style={styles.card}>
          <SettingsRow
            icon="auto-awesome"
            label={t('profile.aiPrompt')}
            hint={t('profile.aiPromptHint')}
            onPress={() => router.push('/ai-prompt')}
            trailing={
              <Icon name="chevron-right" size={20} color={colors.outline} />
            }
          />
        </View>

        <SectionTitle>{t('profile.data')}</SectionTitle>
        <View style={styles.card}>
          <SettingsRow
            icon="restaurant"
            label={t('profile.resetRecipes')}
            onPress={onResetRecipes}
            trailing={<Icon name="chevron-right" size={20} color={colors.outline} />}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="event"
            label={t('profile.resetPlanner')}
            onPress={onClearPlanner}
            trailing={<Icon name="chevron-right" size={20} color={colors.outline} />}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="basket"
            label={t('profile.resetShopping')}
            onPress={onClearShopping}
            trailing={<Icon name="chevron-right" size={20} color={colors.outline} />}
          />
        </View>

        <SectionTitle>{t('profile.about')}</SectionTitle>
        <View style={styles.card}>
          <SettingsRow
            icon="info"
            label={t('app.title')}
            hint={t('profile.aboutText')}
            trailing={
              <Text style={[fonts.labelCaps, { color: colors.outline }]}>
                v{version}
              </Text>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    ...cardShadow,
  },
  row: {
    padding: spacing.gutter,
    alignItems: 'center',
    gap: spacing.stackMd,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.outlineVariant,
    marginLeft: 56,
  },
});
