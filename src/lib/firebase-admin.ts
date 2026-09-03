import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let initError: any = null;

if (!getApps().length) {
  try {
    // If FIREBASE_SERVICE_ACCOUNT_KEY is present, we parse it to initialize the app
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      // Fallback for some hosting environments (like Vercel) where env vars might be split
      if (!process.env.FIREBASE_PRIVATE_KEY) {
         throw new Error("FIREBASE_PRIVATE_KEY is missing from environment variables.");
      }
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace \n from env vars to avoid formatting issues
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
    initError = error;
  }
}

export const adminInitError = initError;
export const adminDb = getApps().length > 0 ? getFirestore('default') : ({} as any);
export const adminAuth = getApps().length > 0 ? getAuth() : ({} as any);
