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
  const tx = await db.collection('transactions').get();
  tx.forEach(d => console.log('Admin Tx:', d.data()));
  
  const stx = await db.collection('supplier_transactions').get();
  stx.forEach(d => console.log('Supplier Tx:', d.data()));
  
  const users = await db.collection('users').get();
  users.forEach(d => {
    if(d.data().displayName && d.data().displayName.toLowerCase().includes('kingombe')) {
      console.log('User:', d.id, d.data().displayName, d.data().subscriptionStatus, d.data().subscriptionEndDate?.toDate());
    }
  });
}
run().catch(console.error);
