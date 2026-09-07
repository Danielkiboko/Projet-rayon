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
        let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
        privateKey = privateKey.trim();
        // Fix for Vercel/Hostinger where newlines might be stripped or keys have quotes
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
          privateKey = privateKey.slice(1, -1);
        }
        
        // Handle literal escaped \n
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        // If the key is just one single line with spaces or no spaces instead of newlines
        // Sometimes it is completely unformatted string containing BEGIN and END.
        if (!privateKey.includes('\n') || privateKey.split('\n').length < 3) {
          const beginHeader = "-----BEGIN PRIVATE KEY-----";
          const endHeader = "-----END PRIVATE KEY-----";
          if (privateKey.includes(beginHeader) && privateKey.includes(endHeader)) {
            const body = privateKey
              .substring(privateKey.indexOf(beginHeader) + beginHeader.length, privateKey.indexOf(endHeader))
              .replace(/\s+/g, ""); // remove all whitespaces from the body
            
            // Reconstruct the key with proper newlines
            const match = body.match(/.{1,64}/g);
            if (match) {
              privateKey = `${beginHeader}\n${match.join('\n')}\n${endHeader}\n`;
            }
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
