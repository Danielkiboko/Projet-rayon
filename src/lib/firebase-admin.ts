import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export let adminInitError: any = null;

export function initFirebaseAdmin() {
  if (!getApps().length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        let saStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        if (!saStr.startsWith('{')) {
          try {
            saStr = Buffer.from(saStr, 'base64').toString('utf-8');
          } catch (e) {}
        }
        const serviceAccount = JSON.parse(saStr);
        initializeApp({
          credential: cert(serviceAccount),
        });
      } else {
        if (!process.env.FIREBASE_PRIVATE_KEY) {
           const keys = Object.keys(process.env).filter(k => k.includes('FIREBASE')).join(', ');
           throw new Error(`FIREBASE_PRIVATE_KEY is missing. Found keys: ${keys}`);
        }
        let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

        // Check if private key is base64 encoded
        if (!privateKey.includes('-----BEGIN') && privateKey.length > 100) {
          try {
            const decoded = Buffer.from(privateKey, 'base64').toString('utf-8');
            if (decoded.includes('-----BEGIN')) {
              privateKey = decoded;
            }
          } catch (e) {}
        }
        
        // Remove surrounding quotes if any
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
        if (privateKey.startsWith("'") && privateKey.endsWith("'")) privateKey = privateKey.slice(1, -1);

        // Replace literal \n
        privateKey = privateKey.replace(/\\n/g, '\n');

        const beginHeader = "-----BEGIN PRIVATE KEY-----";
        const endHeader = "-----END PRIVATE KEY-----";
        
        if (!privateKey.includes(beginHeader)) {
          // If the raw key was provided without PEM headers, wrap it
          const cleaned = privateKey.replace(/\s+/g, '');
          const match = cleaned.match(/.{1,64}/g);
          if (match) {
            privateKey = `${beginHeader}\n${match.join('\n')}\n${endHeader}\n`;
          }
        }
        
        initializeApp({
          credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        });
      }
      console.log('Firebase Admin initialized successfully.');
      // Clear any previous init errors on successful retry
      adminInitError = null;
    } catch (error) {
      console.error('Firebase Admin initialization error', error);
      adminInitError = error;
    }
  } else {
    // If apps exist, clear the error
    adminInitError = null;
  }
}

export const adminDb = new Proxy({} as any, {
  get: (target, prop) => {
    initFirebaseAdmin();
    if (adminInitError) {
      throw adminInitError;
    }
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
    if (adminInitError) {
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
