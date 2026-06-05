import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signInWithEmail = (email: string, pass: string) => 
  signInWithEmailAndPassword(auth, email, pass);

export const signUpWithEmail = (email: string, pass: string) => 
  createUserWithEmailAndPassword(auth, email, pass);

export const logout = () => signOut(auth);

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  theme?: string;
  accentColor?: string;
  friendlyMode?: boolean;
  isDarkMode?: boolean;
  aiModel?: string;
}

export const syncUserProfile = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const nameFromEmail = user.email ? user.email.split('@')[0] : 'User';
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || nameFromEmail,
      theme: 'warp-dark',
      accentColor: '59 130 246',
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
