import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from '@expo-google-fonts/vazirmatn';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { Alert, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from '../src/hooks/useTranslation';
import { isRecipeUrl, readRecipeFromUri } from '../src/lib/recipeShare';
import { useRecipes } from '../src/store/recipes';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_600SemiBold,
    Vazirmatn_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <DeepLinkHandler />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="recipe/[id]"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="recipe/new"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="ai-prompt"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function DeepLinkHandler() {
  const router = useRouter();
  const { t } = useTranslation();
  const handledRef = useRef(new Set<string>());

  const handleUrl = useCallback(
    async (url: string | null | undefined) => {
      if (!url) return;
      if (!isRecipeUrl(url)) return;
      if (handledRef.current.has(url)) return;
      handledRef.current.add(url);
      try {
        const recipe = await readRecipeFromUri(url);
        const { id, isUpdate } = useRecipes
          .getState()
          .addOrUpdateByName(recipe);
        Alert.alert(
          isUpdate ? t('recipe.importedUpdated') : t('recipe.importedSuccess'),
          recipe.name.de || recipe.name.fa,
        );
        setTimeout(() => {
          router.push(`/recipe/${id}`);
        }, 200);
      } catch {
        Alert.alert(t('recipe.importTitle'), t('recipe.importError'));
      }
    },
    [router, t],
  );

  useEffect(() => {
    Linking.getInitialURL().then((url) => handleUrl(url));
    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => {
      sub.remove();
    };
  }, [handleUrl]);

  return null;
}
