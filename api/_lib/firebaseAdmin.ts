import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) return apps[0]!;
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) {
    throw new Error('FIREBASE_ADMIN_KEY environment variable is not set');
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_ADMIN_KEY is not valid JSON');
  }
  return initializeApp({
    credential: cert(parsed as Parameters<typeof cert>[0]),
  });
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
