import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

// Firebase configuration from environment or defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'clearspend-auth.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'clearspend-auth',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'clearspend-auth.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:abcdef123456',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'AIzaSyPlaceholder' &&
  !firebaseConfig.apiKey.includes('placeholder')
);

// Initialize Firebase safely
export const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

export const firebaseAuth = getAuth(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type FirebaseUser
};
