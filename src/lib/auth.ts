import { signOut, signInWithCustomToken, updateProfile } from 'firebase/auth';
import { auth } from './firebase';

export async function signInWithToken(
  customToken: string,
  displayName?: string,
) {
  const cred = await signInWithCustomToken(auth, customToken);
  if (displayName && cred.user.displayName !== displayName) {
    await updateProfile(cred.user, { displayName }).catch(() => {});
  }
}

export async function signOutUser() {
  await signOut(auth);
}
