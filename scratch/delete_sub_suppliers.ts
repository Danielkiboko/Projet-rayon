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
  const snapshot = await db.collection('users').where('role', '==', 'SUB_SUPPLIER').get();
  console.log(`Found ${snapshot.size} SUB_SUPPLIERs`);
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`Deleting ${data.email} (${doc.id})...`);
    await db.collection('users').doc(doc.id).delete();
    try {
      await auth.deleteUser(doc.id);
      console.log(`Deleted user ${doc.id} from Auth`);
    } catch (e) {
      console.log(`Failed to delete auth user ${doc.id}: ${e.message}`);
    }
  }
}
run().catch(console.error);
