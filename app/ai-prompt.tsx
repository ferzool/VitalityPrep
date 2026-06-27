import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../src/components/Icon';
import { useTranslation, type TranslationKey } from '../src/hooks/useTranslation';
import { AI_PROMPT_TEMPLATE } from '../src/lib/aiPrompt';
import { cardShadow, colors, radius, spacing } from '../src/theme';

const STEP_KEYS: TranslationKey[] = [
  'aiPrompt.step1',
  'aiPrompt.step2',
  'aiPrompt.step3',
  'aiPrompt.step4',
  'aiPrompt.step5',
];

export default function AiPromptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fonts, t, isRTL } = useTranslation();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await Clipboard.setStringAsync(AI_PROMPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.stackMd,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Icon name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[fonts.headlineMd, { color: colors.onSurface }]}>
          {t('aiPrompt.title')}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.marginMobile,
          paddingBottom: spacing.marginMobile + insets.bottom + 120,
          gap: spacing.stackLg,
        }}
      >
        <View
          style={[
            styles.heroRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <View style={styles.heroIconWrap}>
            <Icon name="auto-awesome" size={24} color={colors.primary} filled />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                fonts.bodyLg,
                { color: colors.onSurface },
                isRTL && { writingDirection: 'rtl', textAlign: 'right' },
              ]}
            >
              {t('aiPrompt.intro')}
            </Text>
          </View>
        </View>

        <View style={styles.howCard}>
          <Text
            style={[
              fonts.labelCaps,
              { color: colors.onSecondaryContainer, marginBottom: spacing.stackSm },
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
            ]}
          >
            {t('aiPrompt.howTo')}
          </Text>
          {STEP_KEYS.map((key) => (
            <Text
              key={key}
              style={[
                fonts.bodySm,
                {
                  color: colors.onSurface,
                  marginTop: spacing.stackSm,
                },
                isRTL && { writingDirection: 'rtl', textAlign: 'right' },
              ]}
            >
              {t(key)}
            </Text>
          ))}
        </View>

        <View style={styles.promptCard}>
          <Text style={styles.promptText} selectable>
            {AI_PROMPT_TEMPLATE}
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.copyBar,
          {
            paddingBottom: insets.bottom + spacing.stackMd,
          },
        ]}
      >
        <Pressable
          onPress={onCopy}
          style={({ pressed }) => [
            styles.copyBtn,
            pressed && { opacity: 0.85 },
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <Icon
            name={copied ? 'check' : 'content-copy'}
            size={18}
            color={colors.onPrimary}
          />
          <Text style={[fonts.labelCaps, { color: colors.onPrimary }]}>
            {copied ? t('aiPrompt.copied') : t('aiPrompt.copy')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.gutter,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  heroRow: {
    alignItems: 'flex-start',
    gap: spacing.stackMd,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howCard: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.xl,
    padding: spacing.gutter,
  },
  promptCard: {
    backgroundColor: '#1d2421',
    borderRadius: radius.xl,
    padding: spacing.gutter,
    ...cardShadow,
  },
  promptText: {
    color: '#d8efe2',
    fontFamily: 'Menlo',
    fontSize: 12,
    lineHeight: 18,
  },
  copyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.stackMd,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  copyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...cardShadow,
  },
});
