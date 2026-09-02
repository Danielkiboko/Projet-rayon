import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

async function checkUser() {
  try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const env: any = {};
    envFile.split('\n').forEach(line => {
      if (line && line.includes('=')) {
        const [key, ...rest] = line.split('=');
        env[key.trim()] = rest.join('=').trim();
      }
    });

    let privateKey = env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
    }
    
    initializeApp({
      credential: cert({
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL?.replace(/"/g, ''),
        privateKey: privateKey,
      }),
    });
    
    const db = getFirestore('default');
    const snapshot = await db.collection('users').where('email', '==', 'kingombe@nova-city.online').get();
    
    if (snapshot.empty) {
      console.log('User not found in Firestore users collection.');
      return;
    }
    
    snapshot.forEach(doc => {
      console.log('User Data:', JSON.stringify(doc.data(), null, 2));
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();
