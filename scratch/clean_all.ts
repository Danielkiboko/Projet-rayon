import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const envConfig = fs.readFileSync('.env.local', 'utf8');
envConfig.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2];
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    process.env[match[1]] = val;
  }
});

async function cleanDatabase() {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({ 
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      });
    } else {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    }
    
    const auth = getAuth();
    // In test-firestore.ts they used getFirestore('default')
    const db = getFirestore('default' as any) || getFirestore();
    
    const adminUid = "8ZyhUI4tzUXLKbJLQ0vd5Nw2nek1"; // danielkiboko218@gmail.com
    
    console.log("=== CLEANING AUTH USERS ===");
    const listUsersResult = await auth.listUsers(1000);
    for (const userRecord of listUsersResult.users) {
      if (userRecord.uid !== adminUid) {
        await auth.deleteUser(userRecord.uid);
        console.log(`Deleted Auth user: ${userRecord.email}`);
      }
    }
    
    const collectionsToClear = [
      'properties',
      'tenants',
      'visits',
      'invoices',
      'products',
      'orders',
      'payments',
      'drivers'
    ];
    
    console.log("\n=== CLEANING FIRESTORE COLLECTIONS ===");
    for (const collName of collectionsToClear) {
      const snapshot = await db.collection(collName).get();
      let count = 0;
      const batchSize = 100;
      let batch = db.batch();
      
      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        count++;
        if (count % batchSize === 0) {
          await batch.commit();
          batch = db.batch();
        }
      }
      if (count % batchSize !== 0) {
        await batch.commit();
      }
      console.log(`Deleted ${count} documents from ${collName}`);
    }

    console.log("\n=== CLEANING FIRESTORE USERS ===");
    const usersSnap = await db.collection('users').get();
    let usersCount = 0;
    let usersBatch = db.batch();
    for (const doc of usersSnap.docs) {
      if (doc.id !== adminUid) {
        usersBatch.delete(doc.ref);
        usersCount++;
      }
    }
    await usersBatch.commit();
    console.log(`Deleted ${usersCount} users from Firestore`);
    
    console.log("\n=== CLEANUP COMPLETE ===");
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanDatabase();
