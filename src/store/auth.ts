import { onAuthStateChanged, type User } from 'firebase/auth';
import { create } from 'zustand';
import { auth } from '../lib/firebase';

interface AuthUser {
  uid: string;
  displayName: string | null;
}

interface AuthState {
  initializing: boolean;
  currentUser: AuthUser | null;
  setUser: (user: User | null) => void;
}

export const useAuth = create<AuthState>((set) => ({
  initializing: true,
  currentUser: null,
  setUser: (user) =>
    set({
      initializing: false,
      currentUser: user
        ? { uid: user.uid, displayName: user.displayName }
        : null,
    }),
}));

let started = false;
export function startAuthListener() {
  if (started) return;
  started = true;
  onAuthStateChanged(auth, (user) => {
    useAuth.getState().setUser(user);
  });
}
