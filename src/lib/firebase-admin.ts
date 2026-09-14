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
        let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').trim();

        // 1. Remove surrounding quotes
        privateKey = privateKey.replace(/^["']|["']$/g, '');

        // 2. Handle literal \n or escaped slashes
        privateKey = privateKey.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n').replace(/\r/g, '');

        // 3. Ensure BEGIN and END markers exist
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
        }

        // 4. Ensure BEGIN and END markers are on their own lines
        privateKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----/g, '-----BEGIN PRIVATE KEY-----\n');
        privateKey = privateKey.replace(/-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----');

        // 5. Clean up lines: trim every line, remove empty lines
        let lines = privateKey.split('\n').map(l => l.trim()).filter(Boolean);
        privateKey = lines.join('\n') + '\n';

        // 6. Fix any remaining spaces in the base64 part (if Vercel squashed it)
        const match = privateKey.match(/(-----BEGIN PRIVATE KEY-----\n)([\s\S]+)(\n-----END PRIVATE KEY-----)/);
        if (match) {
          const base64Part = match[2].replace(/\s+/g, '\n');
          privateKey = `${match[1]}${base64Part}${match[3]}\n`;
        }

        const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').replace(/^["']|["']$/g, '').trim();
        const projectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'rayon-projet').replace(/^["']|["']$/g, '').trim();
        
        initializeApp({
          credential: cert({
            projectId: projectId,
            clientEmail: clientEmail,
            privateKey: privateKey,
          }),
        });
      }
      console.log('Firebase Admin initialized successfully.');
      adminInitError = null;
    } catch (error) {
      console.error('Firebase Admin initialization error', error);
      adminInitError = error;
    }
  } else {
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
