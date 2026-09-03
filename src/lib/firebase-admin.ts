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
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;
        // Hostinger (ou cPanel) peut parfois inclure les guillemets dans la valeur
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
          privateKey = privateKey.slice(1, -1);
        }
        
        initializeApp({
          credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey.replace(/\\n/g, '\n'),
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
    const firestore = getFirestore('default');
    const value = (firestore as any)[prop];
    if (typeof value === 'function') {
      return value.bind(firestore);
    }
    return value;
  }
});

export const adminAuth = new Proxy({} as any, {
  get: (target, prop) => {
    initFirebaseAdmin();
    if (prop === 'verifyIdToken' && adminInitError) {
      throw adminInitError;
    }
    const auth = getAuth();
    const value = (auth as any)[prop];
    if (typeof value === 'function') {
      return value.bind(auth);
    }
    return value;
  }
});
