import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';

export type UserRole = 'user' | 'merchant';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: any;
}

export interface MerchantProfile {
  id: string;
  name: string;
  owner_uid: string;
  rating: number;
  image_url?: string;
  created_at: any;
}

/** Register a new user. If merchant, also creates the merchants/{uid} doc. */
export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = credential.user;

  // Write the user profile doc
  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    displayName,
    role,
    createdAt: serverTimestamp(),
  });

  // If merchant, also create the merchant doc under the same UID
  if (role === 'merchant') {
    await setDoc(doc(db, 'merchants', uid), {
      name: displayName,
      owner_uid: uid,
      rating: 4.5,
      image_url: '',
      created_at: serverTimestamp(),
    });
  }

  return credential.user;
}

/** Sign in and return the user's role. */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User; role: UserRole }> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(credential.user.uid);
  return { user: credential.user, role: profile?.role ?? 'user' };
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function getMerchantProfile(uid: string): Promise<MerchantProfile | null> {
  const q = query(collection(db, 'merchants'), where('owner_uid', '==', uid));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as MerchantProfile;
  }
  
  // Fallback to direct ID fetch for legacy docs
  const snap = await getDoc(doc(db, 'merchants', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as MerchantProfile;
}

export { onAuthStateChanged, auth };
export type { User };
