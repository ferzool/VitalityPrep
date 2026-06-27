import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  type Auth,
  inMemoryPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyAZnKwxymeNt3G_2hEtBn6mjxikJStQl34',
  authDomain: 'vitalityprep-33106.firebaseapp.com',
  projectId: 'vitalityprep-33106',
  storageBucket: 'vitalityprep-33106.firebasestorage.app',
  messagingSenderId: '656120999921',
  appId: '1:656120999921:web:4453306bb04a3c7f77de50',
};

const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
  if (Platform.OS === 'web') {
    // Explicit persistence chain bypasses Firebase's environment auto-detect
    // (which can mis-classify Metro's web bundle as React Native).
    auth = initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
    });
  } else {
    auth = initializeAuth(app, { persistence: inMemoryPersistence });
  }
} catch {
  // initializeAuth throws if it was already initialized for this app;
  // fall back to the existing instance.
  auth = getAuth(app);
}

let db: Firestore;
try {
  // ignoreUndefinedProperties lets us include optional fields without
  // pre-filtering — setDoc/updateDoc otherwise rejects `undefined` values.
  db = initializeFirestore(app, { ignoreUndefinedProperties: true });
} catch {
  db = getFirestore(app);
}
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
