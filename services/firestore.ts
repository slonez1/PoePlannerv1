/**
 * Firestore Database Service
 * 
 * This module provides cloud storage for user recipes and vault data using Firebase Firestore.
 * It enables cross-browser/device synchronization by storing data in the cloud.
 * 
 * Features:
 * - Save and retrieve user vault data from Firestore
 * - Real-time sync across devices
 * - Automatic conflict resolution
 * - Graceful fallback when Firestore is not configured
 * 
 * Setup Instructions:
 * 1. Enable Firestore in your Firebase project (https://console.firebase.google.com/)
 * 2. Create a database in production mode or test mode
 * 3. Set up security rules to restrict access to authenticated users
 * 4. No additional environment variables needed (uses same Firebase config as auth)
 */

import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  Firestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { VaultData } from '../types';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase is configured
const isFirebaseConfigured = (): boolean => {
  return !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
};

// Initialize Firestore
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    // Use existing Firebase app if already initialized (by auth service)
    const app: FirebaseApp = getApps().length > 0 
      ? getApps()[0] 
      : initializeApp(firebaseConfig);
    
    db = getFirestore(app);
    console.log('Firestore initialized successfully');
  } catch (error) {
    console.error('Error initializing Firestore:', error);
  }
}

/**
 * Check if Firestore is properly configured and available
 */
export const isFirestoreConfigured = (): boolean => {
  return db !== null;
};

/**
 * Save user vault data to Firestore
 * @param userId - The authenticated user's ID
 * @param vaultData - The vault data to save (recipes, rotation, lastUpdated)
 * @returns Promise<void>
 */
export const saveVaultToCloud = async (userId: string, vaultData: VaultData): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not configured');
  }

  try {
    const userVaultRef = doc(db, 'vaults', userId);
    await setDoc(userVaultRef, {
      ...vaultData,
      updatedAt: serverTimestamp()
    });
    console.log('Vault saved to Firestore successfully');
  } catch (error) {
    console.error('Error saving vault to Firestore:', error);
    throw new Error('Failed to save data to cloud');
  }
};

/**
 * Retrieve user vault data from Firestore
 * @param userId - The authenticated user's ID
 * @returns Promise<VaultData | null> - The vault data or null if not found
 */
export const getVaultFromCloud = async (userId: string): Promise<VaultData | null> => {
  if (!db) {
    throw new Error('Firestore is not configured');
  }

  try {
    const userVaultRef = doc(db, 'vaults', userId);
    const docSnap = await getDoc(userVaultRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Convert Firestore Timestamp to number if needed
      const vaultData: VaultData = {
        recipes: data.recipes || [],
        rotation: data.rotation || [],
        lastUpdated: data.lastUpdated || 0
      };
      console.log('Vault retrieved from Firestore successfully');
      return vaultData;
    } else {
      console.log('No vault data found in Firestore for user');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving vault from Firestore:', error);
    throw new Error('Failed to retrieve data from cloud');
  }
};

/**
 * Sync vault data with cloud (handles conflict resolution)
 * @param userId - The authenticated user's ID
 * @param localData - The local vault data
 * @returns Promise<VaultData> - The resolved vault data (either local or cloud, whichever is newer)
 */
export const syncVaultWithCloud = async (
  userId: string, 
  localData: VaultData
): Promise<VaultData> => {
  if (!db) {
    // Firestore not configured - return local data
    console.log('Firestore not configured, using local data only');
    return localData;
  }

  try {
    const cloudData = await getVaultFromCloud(userId);

    if (!cloudData) {
      // No cloud data exists - save local data to cloud
      await saveVaultToCloud(userId, localData);
      return localData;
    }

    // Both local and cloud data exist - use last-write-wins strategy
    if (cloudData.lastUpdated > localData.lastUpdated) {
      // Cloud is newer - return cloud data
      console.log('Cloud data is newer, using cloud version');
      return cloudData;
    } else if (localData.lastUpdated > cloudData.lastUpdated) {
      // Local is newer - save to cloud and return local
      console.log('Local data is newer, pushing to cloud');
      await saveVaultToCloud(userId, localData);
      return localData;
    } else {
      // Same timestamp - return local (no sync needed)
      return localData;
    }
  } catch (error) {
    console.error('Error syncing with cloud:', error);
    // On error, return local data and let the app continue working
    return localData;
  }
};

export default {
  isFirestoreConfigured,
  saveVaultToCloud,
  getVaultFromCloud,
  syncVaultWithCloud
};
