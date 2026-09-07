import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const envConfig = fs.readFileSync('.env.local', 'utf8');
envConfig.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2];
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[match[1]] = val;
  }
});

async function listUsers() {
  try {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    
    // Test default DB
    const db = getFirestore('default');
    console.log("\n=== FIRESTORE USERS (default DB) ===");
    const usersSnap = await db.collection('users').get();
    usersSnap.forEach((doc) => {
      console.log(`- ${doc.data().email} (${doc.id})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}
listUsers();
