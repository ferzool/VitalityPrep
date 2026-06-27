import type { TextStyle } from 'react-native';
import type { Locale } from '../types';

const latinFonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

const displayFonts = {
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

const persianFonts = {
  regular: 'Vazirmatn_400Regular',
  medium: 'Vazirmatn_500Medium',
  semiBold: 'Vazirmatn_600SemiBold',
  bold: 'Vazirmatn_700Bold',
};

export const allFontNames = [
  ...Object.values(latinFonts),
  ...Object.values(displayFonts),
  ...Object.values(persianFonts),
];

export const typography = (locale: Locale) => {
  const isFa = locale === 'fa';
  const body = isFa ? persianFonts : latinFonts;
  const display = isFa ? persianFonts : displayFonts;

  return {
    displayLg: {
      fontFamily: display.bold,
      fontSize: 34,
      lineHeight: 41,
      letterSpacing: -0.68,
    } as TextStyle,
    displayLgMobile: {
      fontFamily: display.bold,
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: -0.56,
    } as TextStyle,
    headlineMd: {
      fontFamily: display.semiBold,
      fontSize: 22,
      lineHeight: 28,
    } as TextStyle,
    bodyLg: {
      fontFamily: body.regular,
      fontSize: 17,
      lineHeight: 24,
    } as TextStyle,
    bodySm: {
      fontFamily: body.regular,
      fontSize: 15,
      lineHeight: 20,
    } as TextStyle,
    labelCaps: {
      fontFamily: body.semiBold,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    } as TextStyle,
    numericData: {
      fontFamily: body.semiBold,
      fontSize: 18,
      lineHeight: 22,
    } as TextStyle,
  };
};

export type Typography = ReturnType<typeof typography>;
