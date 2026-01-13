/**
 * Firebase Authentication Service
 * 
 * This module provides secure authentication using Firebase Authentication from Google Cloud.
 * It handles user registration, login, logout, and session management.
 * 
 * Features:
 * - Email/password authentication
 * - Secure user session management
 * - Integration with Firebase Auth backend
 * - Error handling and validation
 * 
 * Setup Instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Enable Email/Password authentication in Firebase Console
 * 3. Copy your Firebase config and set environment variables:
 *    - VITE_FIREBASE_API_KEY
 *    - VITE_FIREBASE_AUTH_DOMAIN
 *    - VITE_FIREBASE_PROJECT_ID
 *    - VITE_FIREBASE_STORAGE_BUCKET
 *    - VITE_FIREBASE_MESSAGING_SENDER_ID
 *    - VITE_FIREBASE_APP_ID
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { User } from '../types';

// Firebase configuration
// In production, these should be set via environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase is configured
const isFirebaseConfigured = (): boolean => {
  return !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
};

// Initialize Firebase App
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Only initialize if config is available
if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('Firebase Authentication initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

/**
 * Convert Firebase User to App User format
 */
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
  };
};

/**
 * Sign up a new user with email and password
 * @param email - User's email address
 * @param password - User's password (min 6 characters)
 * @returns Promise<User> - The created user object
 * @throws Error if sign-up fails
 */
export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
  if (!auth) {
    throw new Error('Firebase is not configured. Please set up your Firebase credentials.');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set display name to email username
    const displayName = email.split('@')[0];
    await updateProfile(userCredential.user, { displayName });
    
    return convertFirebaseUser(userCredential.user);
  } catch (error: any) {
    console.error('Sign-up error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign in an existing user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise<User> - The authenticated user object
 * @throws Error if sign-in fails
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  if (!auth) {
    throw new Error('Firebase is not configured. Please set up your Firebase credentials.');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return convertFirebaseUser(userCredential.user);
  } catch (error: any) {
    console.error('Sign-in error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign out the current user
 * @returns Promise<void>
 */
export const signOutUser = async (): Promise<void> => {
  if (!auth) {
    throw new Error('Firebase is not configured.');
  }

  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

/**
 * Subscribe to authentication state changes
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.warn('Firebase is not configured. Authentication state changes will not be monitored.');
    return () => {};
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback(convertFirebaseUser(firebaseUser));
    } else {
      callback(null);
    }
  });
};

/**
 * Get current authenticated user
 * @returns User | null - The current user or null if not authenticated
 */
export const getCurrentUser = (): User | null => {
  if (!auth?.currentUser) {
    return null;
  }
  return convertFirebaseUser(auth.currentUser);
};

/**
 * Check if Firebase is properly configured
 * @returns boolean
 */
export const isAuthConfigured = (): boolean => {
  return isFirebaseConfigured() && auth !== null;
};

/**
 * Convert Firebase error codes to user-friendly messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'Authentication failed. Please try again.';
  }
};

export default {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  onAuthStateChange,
  getCurrentUser,
  isAuthConfigured
};
