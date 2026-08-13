import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const formatAuthError = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Please provide a valid email address.';
    case 'auth/user-not-found':
      return 'No account exists with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify and try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters in length.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups or use Email sign-in.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completion.';
    case 'auth/unauthorized-domain':
      return 'Domain not authorized in Firebase Auth. Sign in using Email & Password or add this domain in Firebase Console.';
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled in Firebase Console. Please use Email/Password.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to multiple failed attempts. Please try again shortly.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet link.';
    default:
      return error?.message || 'Authentication sequence failed. Please try again.';
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    throw new Error(formatAuthError(error));
  }
};

export const signInWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Email", error);
    throw new Error(formatAuthError(error));
  }
};

export const registerWithEmail = async (email: string, pass: string, displayName?: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && displayName.trim()) {
      await updateProfile(result.user, { displayName: displayName.trim() });
    }
    return result.user;
  } catch (error: any) {
    console.error("Error registering with Email", error);
    throw new Error(formatAuthError(error));
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    console.error("Error sending password reset email", error);
    throw new Error(formatAuthError(error));
  }
};

export const signInAsGuest = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in as guest", error);
    throw new Error(formatAuthError(error));
  }
};

export const logout = () => signOut(auth);

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  theme?: string;
  accentColor?: string;
  isAnonymous?: boolean;
}

export const syncUserProfile = async (user: User, customName?: string) => {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const nameFromEmail = user.email ? user.email.split('@')[0] : (user.isAnonymous ? 'Guest Operative' : 'User');
    const finalName = customName || user.displayName || nameFromEmail;
    
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: finalName,
      theme: 'warp-dark',
      accentColor: '59 130 246',
      isAnonymous: user.isAnonymous || false
    };
    await setDoc(userRef, {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newProfile;
  } else {
    return userDoc.data() as UserProfile;
  }
};
