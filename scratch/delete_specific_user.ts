import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const auth = getAuth();
const db = getFirestore();

async function run() {
  const email = 'kingombe@nova-city.online';
  console.log(`Looking for user with email: ${email}`);
  
  try {
    const userRecord = await auth.getUserByEmail(email);
    console.log(`Found in Auth! UID: ${userRecord.uid}. Deleting...`);
    await auth.deleteUser(userRecord.uid);
    console.log('Deleted from Auth.');
    
    // Also delete from Firestore
    await db.collection('users').doc(userRecord.uid).delete();
    await db.collection('suppliers').doc(userRecord.uid).delete();
    console.log('Deleted from Firestore.');
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}
run().catch(console.error);
