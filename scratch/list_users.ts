import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

// Simple dotenv parser
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

async function listUsers() {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({ credential: cert(serviceAccount) });
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
    const db = getFirestore();
    
    const listUsersResult = await auth.listUsers(1000);
    console.log("=== FIREBASE AUTH USERS ===");
    listUsersResult.users.forEach((userRecord) => {
      console.log(`- ${userRecord.email} (${userRecord.uid})`);
    });
    
    console.log("\n=== FIRESTORE USERS ===");
    const usersSnap = await db.collection('users').get();
    usersSnap.forEach((doc) => {
      console.log(`- ${doc.data().email} (${doc.id})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}
listUsers();
