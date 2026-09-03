import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export let adminInitError: any = null;

export function initFirebaseAdmin() {
  if (!getApps().length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializeApp({
          credential: cert(serviceAccount),
        });
      } else {
        if (!process.env.FIREBASE_PRIVATE_KEY) {
           const keys = Object.keys(process.env).filter(k => k.includes('FIREBASE')).join(', ');
           throw new Error(`FIREBASE_PRIVATE_KEY is missing. Found keys: ${keys}`);
        }
        initializeApp({
          credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
        });
      }
      console.log('Firebase Admin initialized successfully.');
    } catch (error) {
      console.error('Firebase Admin initialization error', error);
      adminInitError = error;
    }
  }
}

export const adminDb = new Proxy({} as any, {
  get: (target, prop) => {
    initFirebaseAdmin();
    return (getFirestore('default') as any)[prop];
  }
});

export const adminAuth = new Proxy({} as any, {
  get: (target, prop) => {
    initFirebaseAdmin();
    if (prop === 'verifyIdToken' && adminInitError) {
      throw adminInitError;
    }
    return (getAuth() as any)[prop];
  }
});
