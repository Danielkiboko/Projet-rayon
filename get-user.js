const admin = require('firebase-admin');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let privateKeyRaw = '';
let clientEmail = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('FIREBASE_PRIVATE_KEY=')) {
    privateKeyRaw = line.substring('FIREBASE_PRIVATE_KEY='.length);
  }
  if (line.startsWith('FIREBASE_CLIENT_EMAIL=')) {
    clientEmail = line.substring('FIREBASE_CLIENT_EMAIL='.length).replace(/^["']|["']$/g, '').trim();
  }
}

let privateKey = privateKeyRaw.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n').replace(/\r/g, '');
const pemRegex = /-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/;
const match = privateKey.match(pemRegex);
let cleanBase64 = match ? match[1].replace(/\s+/g, '') : privateKey.replace(/\s+/g, '');
const chunks = [];
for (let i = 0; i < cleanBase64.length; i += 64) chunks.push(cleanBase64.slice(i, i + 64));
privateKey = `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'rayon-projet',
    clientEmail: clientEmail,
    privateKey: privateKey,
  }),
  projectId: 'rayon-projet'
});

const targetEmail = "kingombe@nova-city.online";

async function checkUser() {
  console.log(`--- Checking user: ${targetEmail} ---`);
  
  // Check Auth
  try {
    const userRecord = await admin.auth().getUserByEmail(targetEmail);
    console.log("[Auth] Found user in Firebase Auth!");
    console.log(`[Auth] UID: ${userRecord.uid}`);
    console.log(`[Auth] Email Verified: ${userRecord.emailVerified}`);
    console.log(`[Auth] Custom Claims (Role):`, userRecord.customClaims);
    
    // Check Firestore
    const db = admin.firestore();
    const doc = await db.collection('users').doc(userRecord.uid).get();
    
    if (doc.exists) {
      console.log(`[Firestore] Found in 'users' collection!`);
      const data = doc.data();
      console.log(`[Firestore] Role: ${data.role}`);
      console.log(`[Firestore] Status: ${data.status}`);
      console.log(`[Firestore] Rayon: ${data.rayon || 'N/A'}`);
      console.log(`[Firestore] Subscription: ${data.subscriptionStatus || 'N/A'}`);
    } else {
      console.log(`[Firestore] NOT FOUND in 'users' collection.`);
    }

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`[Auth] User not found in Firebase Auth.`);
    } else {
      console.error(`[Error]`, error);
    }
  }
}

checkUser();
