import { useRouter, useSegments } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { startFirestoreSync, stopFirestoreSync } from '../lib/firestoreSync';
import { startAuthListener, useAuth } from '../store/auth';
import { colors } from '../theme';

const PUBLIC_ROUTES = new Set(['login', 'admin']);

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { initializing, currentUser } = useAuth();

  useEffect(() => {
    startAuthListener();
  }, []);

  useEffect(() => {
    if (currentUser) {
      startFirestoreSync();
    } else {
      stopFirestoreSync();
    }
  }, [currentUser]);

  useEffect(() => {
    if (initializing) return;
    const top = segments[0];
    const isPublic = top != null && PUBLIC_ROUTES.has(top);
    if (!currentUser && !isPublic) {
      router.replace('/login');
    } else if (currentUser && isPublic) {
      router.replace('/(tabs)');
    }
  }, [initializing, currentUser, segments, router]);

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
