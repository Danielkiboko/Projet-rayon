import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

async function checkTenants() {
  try {
    const env = fs.readFileSync('.env.local', 'utf-8');
    const envObj: Record<string, string> = {};
    env.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        envObj[match[1]] = match[2].replace(/^['"](.*)['"]$/, '$1');
      }
    });

    let privateKey = envObj.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
    }

    initializeApp({
      credential: cert({
        projectId: envObj.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: envObj.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    const db = getFirestore('default');
    const snapshot = await db.collection('tenants').get();
    console.log("Total tenants:", snapshot.size);
    snapshot.forEach(doc => {
      console.log(doc.id, "Supplier:", doc.data().supplierId, "Status:", doc.data().status, "Name:", doc.data().name);
    });
  } catch (err) {
    console.error(err);
  }
}
checkTenants();
