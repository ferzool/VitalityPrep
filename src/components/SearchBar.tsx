import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from './Icon';
import { useTranslation } from '../hooks/useTranslation';
import { colors, radius, spacing } from '../theme';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  const { fonts, t, isRTL } = useTranslation();
  const ph = placeholder ?? t('search.placeholder');
  return (
    <View
      style={[
        styles.wrap,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      <Icon name="search" size={20} color={colors.outline} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={ph}
        placeholderTextColor={colors.outline}
        style={[
          fonts.bodyLg,
          styles.input,
          {
            color: colors.onSurface,
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          },
        ]}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityLabel="clear"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Icon name="close" size={20} color={colors.outline} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.gutter,
    height: 44,
    alignItems: 'center',
    gap: spacing.stackMd,
  },
  input: {
    flex: 1,
    padding: 0,
  },
});
