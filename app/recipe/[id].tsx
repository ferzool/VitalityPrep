import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
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
import { IngredientRow } from '../../src/components/IngredientRow';
import { MacroBox } from '../../src/components/MacroBox';
import { RecipeQrModal } from '../../src/components/RecipeQrModal';
import { useTranslation } from '../../src/hooks/useTranslation';
import {
  copyRecipeAsJson,
  shareRecipe,
  ShareCancelled,
  ShareUnavailable,
} from '../../src/lib/recipeShare';
import { useRecipes } from '../../src/store/recipes';
import { useShopping } from '../../src/store/shopping';
import { cardShadow, colors, radius, spacing } from '../../src/theme';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const recipe = useRecipes((s) => s.recipes.find((r) => r.id === id));
  const removeRecipe = useRecipes((s) => s.removeRecipe);
  const addRecipeAll = useShopping((s) => s.addRecipeAll);
  const { fonts, t, tr, isRTL } = useTranslation();
  const [copiedJson, setCopiedJson] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const macroTotals = useMemo(() => {
    if (!recipe) return { protein: 0, carbs: 0, fat: 0, max: 1 };
    const { protein, carbs, fat } = recipe.macros;
    return { protein, carbs, fat, max: Math.max(protein, carbs, fat, 1) };
  }, [recipe]);

  if (!recipe) {
    return (
      <View style={[styles.flex, styles.center]}>
        <AppHeader showBack onBack={() => router.back()} />
        <View style={[styles.center, { flex: 1, padding: spacing.marginMobile }]}>
          <Text style={[fonts.bodyLg, { color: colors.onSurfaceVariant }]}>
            {t('recipes.empty')}
          </Text>
        </View>
      </View>
    );
  }

  const onAddAll = () => {
    const added = addRecipeAll(recipe);
    if (added > 0) {
      Alert.alert(t('recipe.addedToList'), `+${added}`);
    }
  };

  const onDelete = () => {
    Alert.alert(t('recipe.delete'), t('recipe.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          removeRecipe(recipe.id);
          router.back();
        },
      },
    ]);
  };

  const onEdit = () => {
    router.push(`/recipe/new?edit=${recipe.id}`);
  };

  const onShareAsFile = async () => {
    try {
      await shareRecipe(recipe);
    } catch (err) {
      if (err instanceof ShareCancelled) return;
      if (err instanceof ShareUnavailable) {
        Alert.alert(t('recipe.share'), t('profile.sharingUnavailable'));
      } else {
        Alert.alert(t('recipe.share'), t('recipe.shareError'));
      }
    }
  };

  const onShare = () => {
    Alert.alert(t('recipe.shareMethodTitle'), undefined, [
      { text: t('recipe.shareAsQr'), onPress: () => setQrVisible(true) },
      { text: t('recipe.shareAsFile'), onPress: onShareAsFile },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const onCopyJson = async () => {
    await copyRecipeAsJson(recipe);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  };

  return (
    <View style={styles.flex}>
      <AppHeader showBack onBack={() => router.back()} />
      <ScrollView
        bounces
        contentContainerStyle={{ paddingBottom: spacing.marginMobile * 2 + insets.bottom }}
      >
        <View style={styles.hero}>
          <Image
            source={recipe.imageUrl}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.heroGradient} />
          <View
            style={[
              styles.heroContent,
              { alignItems: isRTL ? 'flex-end' : 'flex-start' },
            ]}
          >
            <Text
              numberOfLines={3}
              style={[
                fonts.displayLgMobile,
                styles.heroTitle,
                isRTL && { writingDirection: 'rtl', textAlign: 'right' },
              ]}
            >
              {tr(recipe.name)}
            </Text>
            <View
              style={[
                styles.heroPills,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={styles.kcalPill}>
                <Icon name="fire" size={16} color={colors.onPrimary} filled />
                <Text style={[fonts.numericData, styles.kcalText]}>
                  {recipe.calories} {t('recipe.kcal')}
                </Text>
              </View>
              <View style={styles.timePill}>
                <Icon name="schedule" size={16} color="#fff" />
                <Text style={[fonts.labelCaps, { color: '#fff' }]}>
                  {t('recipe.prep')}: {recipe.prepTimeMinutes} {t('recipe.min')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.macrosWrap}>
          <View style={[styles.macrosRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <MacroBox
              label={t('recipe.protein')}
              value={recipe.macros.protein}
              percent={recipe.macros.protein / macroTotals.max}
            />
            <MacroBox
              label={t('recipe.carbs')}
              value={recipe.macros.carbs}
              percent={recipe.macros.carbs / macroTotals.max}
            />
            <MacroBox
              label={t('recipe.fat')}
              value={recipe.macros.fat}
              percent={recipe.macros.fat / macroTotals.max}
            />
          </View>
        </View>

        <View
          style={[
            styles.actionsRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <ActionButton icon="edit" label={t('recipe.edit')} onPress={onEdit} />
          <ActionButton icon="share" label={t('recipe.share')} onPress={onShare} />
          <ActionButton
            icon={copiedJson ? 'check' : 'content-copy'}
            label={copiedJson ? t('recipe.copied') : t('recipe.copyJson')}
            onPress={onCopyJson}
          />
          <ActionButton
            icon="delete"
            label={t('common.delete')}
            onPress={onDelete}
            destructive
          />
        </View>

        <View style={styles.section}>
          <View
            style={[
              styles.sectionHeader,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Text
              style={[
                fonts.headlineMd,
                { color: colors.onSurface },
                isRTL && { writingDirection: 'rtl', textAlign: 'right' },
              ]}
            >
              {t('recipe.ingredients')}
            </Text>
            <Text style={[fonts.labelCaps, { color: colors.secondary }]}>
              {recipe.ingredients.length} {t('recipe.items')}
            </Text>
          </View>
          <View style={{ gap: spacing.stackMd }}>
            {recipe.ingredients.map((ingredient) => (
              <IngredientRow
                key={ingredient.id}
                recipe={recipe}
                ingredient={ingredient}
              />
            ))}
          </View>
          <Pressable
            onPress={onAddAll}
            style={({ pressed }) => [
              styles.addAllBtn,
              { opacity: pressed ? 0.85 : 1 },
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Icon name="basket" size={18} color={colors.onPrimary} filled />
            <Text style={[fonts.labelCaps, { color: colors.onPrimary }]}>
              {t('recipe.addAllToList')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              fonts.headlineMd,
              { color: colors.onSurface, marginBottom: spacing.gutter },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
          >
            {t('recipe.instructions')}
          </Text>
          <View style={{ gap: spacing.stackLg }}>
            {recipe.instructions.map((step, idx) => (
              <View
                key={idx}
                style={[
                  styles.stepRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <View
                  style={[
                    styles.stepBubble,
                    idx === 0 ? styles.stepBubbleActive : styles.stepBubbleInactive,
                  ]}
                >
                  <Text
                    style={[
                      fonts.numericData,
                      {
                        color:
                          idx === 0 ? colors.onPrimaryContainer : colors.secondary,
                      },
                    ]}
                  >
                    {idx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1, paddingTop: 4 }}>
                  <Text
                    style={[
                      fonts.bodyLg,
                      { color: colors.onSurface },
                      isRTL && { writingDirection: 'rtl', textAlign: 'right' },
                    ]}
                  >
                    {tr(step)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <RecipeQrModal
        recipe={recipe}
        visible={qrVisible}
        onClose={() => setQrVisible(false)}
      />
    </View>
  );
}

interface ActionButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function ActionButton({ icon, label, onPress, destructive }: ActionButtonProps) {
  const { fonts } = useTranslation();
  const tint = destructive ? colors.error : colors.primary;
  const circleBg = destructive ? colors.errorContainer : colors.secondaryContainer;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        { opacity: pressed ? 0.6 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
    >
      <View style={[styles.actionIconCircle, { backgroundColor: circleBg }]}>
        <Icon name={icon} size={24} color={tint} />
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={[
          fonts.bodySm,
          styles.actionLabel,
          { color: destructive ? colors.error : colors.onSurfaceVariant },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  hero: {
    height: 360,
    width: '100%',
    backgroundColor: colors.surfaceContainer,
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  heroContent: {
    position: 'absolute',
    left: spacing.marginMobile,
    right: spacing.marginMobile,
    bottom: spacing.marginMobile,
    gap: spacing.gutter,
  },
  heroTitle: {
    color: '#ffffff',
  },
  heroPills: {
    gap: spacing.gutter,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  kcalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  kcalText: {
    color: colors.onPrimary,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
  },
  macrosWrap: {
    paddingHorizontal: spacing.marginMobile,
    marginTop: spacing.stackLg,
    zIndex: 2,
  },
  macrosRow: {
    gap: spacing.stackMd,
  },
  section: {
    paddingHorizontal: spacing.marginMobile,
    marginTop: spacing.stackLg,
  },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.gutter,
  },
  addAllBtn: {
    marginTop: spacing.gutter,
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    ...cardShadow,
  },
  stepRow: {
    gap: spacing.gutter,
    alignItems: 'flex-start',
  },
  stepBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBubbleActive: {
    backgroundColor: colors.primaryContainer,
  },
  stepBubbleInactive: {
    backgroundColor: colors.surfaceContainer,
  },
  deleteBtn: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.errorContainer,
    borderRadius: radius.pill,
  },
  actionsRow: {
    paddingHorizontal: spacing.marginMobile,
    marginTop: spacing.stackLg,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    paddingVertical: spacing.stackSm,
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
