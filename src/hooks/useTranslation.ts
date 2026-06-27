import { useMemo } from 'react';
import { translations, type TranslationKey } from '../i18n';
import { useSettings } from '../store/settings';
import { typography } from '../theme';
import type { Locale, Localized } from '../types';

export function useTranslation() {
  const locale = useSettings((s) => s.locale);

  return useMemo(() => {
    const t = (key: TranslationKey): string =>
      translations[locale][key] ?? translations.de[key] ?? key;

    const tr = (value: Localized<string>): string => value?.[locale] ?? value?.de ?? '';

    const fonts = typography(locale);

    return {
      locale,
      isRTL: locale === 'fa',
      t,
      tr,
      fonts,
    };
  }, [locale]);
}

export type { TranslationKey, Locale };
