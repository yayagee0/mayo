import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FB_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Auth functions
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

// Firestore helper functions
export async function createOrUpdateUser(uid: string, userData: {
  email: string;
  displayName: string;
  avatarUrl?: string;
  familyId: string;
}) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, userData, { merge: true });
}

export async function getUser(uid: string) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
}

export async function createWidget(widgetData: {
  familyId: string;
  key: string;
  order: number;
  mode: string;
  enabled: boolean;
}) {
  const widgetRef = doc(collection(db, 'widgets'));
  await setDoc(widgetRef, widgetData);
  return widgetRef.id;
}

export async function getWidgets(familyId: string) {
  const widgetsRef = collection(db, 'widgets');
  const q = query(
    widgetsRef,
    where('familyId', '==', familyId),
    orderBy('order', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createPost(postData: {
  familyId: string;
  authorUid: string;
  createdAt: string;
  kind: 'text' | 'youtube' | 'photo' | 'video';
  text?: string;
  youtubeId?: string;
  imagePath?: string;
  videoPath?: string;
}) {
  const postRef = doc(collection(db, 'posts'));
  await setDoc(postRef, postData);
  return postRef.id;
}

export async function getPosts(familyId: string, limitCount = 20) {
  const postsRef = collection(db, 'posts');
  const q = query(
    postsRef,
    where('familyId', '==', familyId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Storage helper functions
export async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

export async function deleteFile(path: string) {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

// Types for TypeScript
export interface User {
  email: string;
  displayName: string;
  avatarUrl?: string;
  familyId: string;
}

export interface Widget {
  id: string;
  familyId: string;
  key: string;
  order: number;
  mode: string;
  enabled: boolean;
}

export interface Post {
  id: string;
  familyId: string;
  authorUid: string;
  createdAt: string;
  kind: 'text' | 'youtube' | 'photo' | 'video';
  text?: string;
  youtubeId?: string;
  imagePath?: string;
  videoPath?: string;
}