import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { QrScannerModal } from '../../src/components/QrScannerModal';
import { useTranslation } from '../../src/hooks/useTranslation';
import {
  BackupCancelled,
  BackupSharingUnavailable,
  exportBackup,
  importBackup,
} from '../../src/lib/backup';
import {
  importRecipeFromPicker,
  ShareCancelled,
} from '../../src/lib/recipeShare';
import { usePlanner } from '../../src/store/planner';
import { useRecipes } from '../../src/store/recipes';
import { useShopping } from '../../src/store/shopping';
import { cardShadow, colors, radius, spacing } from '../../src/theme';
import type { Recipe } from '../../src/types';

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
  const resetCustom = useRecipes((s) => s.resetCustom);
  const addOrUpdateByName = useRecipes((s) => s.addOrUpdateByName);
  const clearShopping = useShopping((s) => s.clearAll);
  const clearPlanner = usePlanner((s) => s.clearWeek);
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);

  const onResetRecipes = () => {
    Alert.alert(t('profile.title'), t('profile.resetRecipesConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: resetCustom },
    ]);
  };

  const onClearShopping = () => {
    Alert.alert(t('profile.title'), t('shopping.confirmClearAll'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: clearShopping },
    ]);
  };

  const onClearPlanner = () => {
    Alert.alert(t('profile.title'), t('planner.clearWeekConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: clearPlanner },
    ]);
  };

  const onExport = async () => {
    if (busy) return;
    setBusy('export');
    try {
      await exportBackup();
    } catch (err) {
      if (err instanceof BackupSharingUnavailable) {
        Alert.alert(t('profile.export'), t('profile.sharingUnavailable'));
      } else {
        Alert.alert(t('profile.export'), t('profile.exportError'));
      }
    } finally {
      setBusy(null);
    }
  };

  const runImport = async () => {
    setBusy('import');
    try {
      const result = await importBackup();
      Alert.alert(
        t('profile.importSuccess'),
        `${result.recipeCount} ${t('recipes.count')} · ${result.shoppingCount} ${t('shopping.itemCount')} · ${result.plannedSlotCount} ${t('meal.lunch')}`,
      );
    } catch (err) {
      if (err instanceof BackupCancelled) {
        // user dismissed picker
      } else {
        Alert.alert(t('profile.import'), t('profile.importError'));
      }
    } finally {
      setBusy(null);
    }
  };

  const onImport = () => {
    if (busy) return;
    Alert.alert(t('profile.import'), t('profile.importConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), style: 'destructive', onPress: runImport },
    ]);
  };

  const onImportRecipe = async () => {
    if (busy) return;
    setBusy('import');
    try {
      const recipe = await importRecipeFromPicker();
      const { id, isUpdate } = addOrUpdateByName(recipe);
      Alert.alert(
        isUpdate ? t('recipe.importedUpdated') : t('recipe.importedSuccess'),
        recipe.name.de || recipe.name.fa,
      );
      setTimeout(() => router.push(`/recipe/${id}`), 200);
    } catch (err) {
      if (err instanceof ShareCancelled) {
        // user cancelled
      } else {
        Alert.alert(t('recipe.importTitle'), t('recipe.importError'));
      }
    } finally {
      setBusy(null);
    }
  };

  const onQrScanned = (recipe: Recipe) => {
    setScannerVisible(false);
    const { id, isUpdate } = addOrUpdateByName(recipe);
    setTimeout(() => {
      Alert.alert(
        isUpdate ? t('recipe.importedUpdated') : t('recipe.importedSuccess'),
        recipe.name.de || recipe.name.fa,
      );
      router.push(`/recipe/${id}`);
    }, 250);
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

        <SectionTitle>{t('profile.backup')}</SectionTitle>
        <View style={styles.card}>
          <SettingsRow
            icon="share"
            label={t('profile.export')}
            hint={t('profile.exportHint')}
            onPress={onExport}
            trailing={
              busy === 'export' ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Icon name="chevron-right" size={20} color={colors.outline} />
              )
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="download"
            label={t('profile.import')}
            hint={t('profile.importHint')}
            onPress={onImport}
            trailing={
              busy === 'import' ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Icon name="chevron-right" size={20} color={colors.outline} />
              )
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="restaurant"
            label={t('recipe.importFromFile')}
            hint={t('recipe.importFromFileHint')}
            onPress={onImportRecipe}
            trailing={
              <Icon name="chevron-right" size={20} color={colors.outline} />
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="qr-code-scanner"
            label={t('profile.scanQr')}
            hint={t('profile.scanQrHint')}
            onPress={() => setScannerVisible(true)}
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
      <QrScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={onQrScanned}
      />
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
