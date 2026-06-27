import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeInsets } from '../hooks/useSafeInsets';
import { useTranslation } from '../hooks/useTranslation';
import { colors, spacing } from '../theme';
import { Icon } from './Icon';
import { LanguageToggle } from './LanguageToggle';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA8HvPnr16NGUzCvYN2XFd1BqVaPy7S-g8aH_LU3E8Dt1_WH-ZE-fV_o_1p80EnDEqzy9navkyy-SAPyi2Bid2HrPsHlD1Run_KjalVNaM1-QNXmMmiO9pWT8QwuVXfqVOdO1L6hYX3JgSKqQXmHVc-168ae7EyD-8NT_5I4XMkHscyRLi4KIQyQGgjJS1lrEw_w5IdF_8fAi3MWSVNvXrkxlAk4paBtqtsCeSUxgHWFp_nRxR--JA1ExabQ-y7D3HHMkhiL7SzU0Yu';

export function AppHeader({ title, showBack, onBack }: AppHeaderProps) {
  const insets = useSafeInsets();
  const router = useRouter();
  const { fonts, t, isRTL } = useTranslation();
  const headlineColor = colors.onPrimary;

  return (
    <View style={[styles.wrapper, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
      <LinearGradient
        colors={['#5c6f63', '#3f5247']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.row,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <View style={[styles.side, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {showBack ? (
            <Pressable
              hitSlop={12}
              onPress={onBack}
              style={({ pressed }) => [
                styles.iconBtn,
                { opacity: pressed ? 0.6 : 1 },
                { transform: [{ scaleX: isRTL ? -1 : 1 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Icon name="arrow-back" size={24} color={headlineColor} />
            </Pressable>
          ) : (
            <View style={styles.placeholder} />
          )}
          <Text
            numberOfLines={1}
            style={[fonts.headlineMd, { color: headlineColor }]}
          >
            {title ?? t('app.title')}
          </Text>
        </View>
        <View
          style={[
            styles.side,
            styles.end,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <LanguageToggle variant="onDark" />
          <Pressable
            onPress={() => router.push('/profile')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('profile.title')}
            style={({ pressed }) => [
              styles.avatar,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Image
              source={AVATAR_URL}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.stackMd,
    overflow: 'hidden',
  },
  row: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    alignItems: 'center',
    gap: spacing.stackMd,
  },
  end: {
    justifyContent: 'flex-end',
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
