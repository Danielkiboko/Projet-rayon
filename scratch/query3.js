const admin = require('firebase-admin');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});

async function run() {
  const db = admin.firestore();
  console.log('Fetching users...');
  const users = await db.collection('users').limit(10).get();
  users.forEach(d => {
    console.log(d.id, d.data().role, d.data().displayName, d.data().subscriptionEndDate);
  });
}
run().catch(console.error);
