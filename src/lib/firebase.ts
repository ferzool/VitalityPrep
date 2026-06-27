import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  type Auth,
  inMemoryPersistence,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
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
    auth = getAuth(app);
  } else {
    auth = initializeAuth(app, { persistence: inMemoryPersistence });
  }
} catch {
  auth = getAuth(app);
}

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
