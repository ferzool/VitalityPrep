import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import {
  QrTooLarge,
  recipeToQrPayload,
} from '../lib/recipeQr';
import { cardShadow, colors, radius, spacing } from '../theme';
import type { Recipe } from '../types';
import { Icon } from './Icon';

interface RecipeQrModalProps {
  recipe: Recipe | null;
  visible: boolean;
  onClose: () => void;
}

export function RecipeQrModal({ recipe, visible, onClose }: RecipeQrModalProps) {
  const { fonts, t, tr, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();

  const { payload, tooLarge } = useMemo(() => {
    if (!recipe) return { payload: '', tooLarge: false };
    try {
      return { payload: recipeToQrPayload(recipe), tooLarge: false };
    } catch (err) {
      if (err instanceof QrTooLarge) {
        return { payload: '', tooLarge: true };
      }
      return { payload: '', tooLarge: false };
    }
  }, [recipe]);

  if (!recipe) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top + spacing.gutter }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text
            style={[
              fonts.headlineMd,
              { color: colors.onSurface, flex: 1 },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
            numberOfLines={1}
          >
            {t('qr.shareTitle')}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [
              styles.closeBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Icon name="close" size={22} color={colors.onSurface} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text
            style={[
              fonts.bodyLg,
              { color: colors.onSurface, textAlign: 'center' },
            ]}
            numberOfLines={2}
          >
            {tr(recipe.name)}
          </Text>

          {tooLarge ? (
            <View style={styles.errorCard}>
              <Icon name="info" size={22} color={colors.error} />
              <Text
                style={[
                  fonts.bodyLg,
                  { color: colors.onSurface, textAlign: 'center', marginTop: 8 },
                ]}
              >
                {t('qr.tooLarge')}
              </Text>
              <Text
                style={[
                  fonts.bodySm,
                  {
                    color: colors.onSurfaceVariant,
                    textAlign: 'center',
                    marginTop: 4,
                  },
                ]}
              >
                {t('qr.tooLargeHint')}
              </Text>
            </View>
          ) : (
            <View style={styles.qrCard}>
              <QRCode
                value={payload}
                size={260}
                backgroundColor="#ffffff"
                color={colors.onSurface}
                ecl="M"
              />
            </View>
          )}

          {!tooLarge && (
            <Text
              style={[
                fonts.bodySm,
                {
                  color: colors.onSurfaceVariant,
                  textAlign: 'center',
                  paddingHorizontal: spacing.marginMobile,
                },
              ]}
            >
              {t('qr.shareHint')}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.marginMobile,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.gutter,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.stackLg,
  },
  qrCard: {
    backgroundColor: '#ffffff',
    padding: spacing.stackLg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...cardShadow,
  },
  errorCard: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.marginMobile,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    maxWidth: 320,
    ...cardShadow,
  },
});
