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
  const users = await db.collection('users').get();
  console.log('Users found:', users.size);
  let kingombeId = null;
  users.forEach(d => {
    if(d.data().displayName && d.data().displayName.toLowerCase().includes('kingombe')) {
      console.log('User:', d.id, d.data().displayName, d.data().subscriptionStatus);
      kingombeId = d.id;
    }
  });

  if (kingombeId) {
    const tx = await db.collection('transactions').add({
      type: "SUBSCRIPTION",
      amount: 20,
      description: "Paiement Abonnement - kingombe",
      referenceId: "MANUAL-FIX",
      status: "COMPLETED",
      supplierId: kingombeId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Added transaction for kingombe', tx.id);

    const stx = await db.collection('supplier_transactions').add({
        supplierId: kingombeId,
        type: "EXPENSE",
        amount: 20,
        currency: "USD",
        description: "Paiement Abonnement Plateforme (Rattrapage)",
        referenceId: "MANUAL-FIX",
        status: "COMPLETED",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: kingombeId
    });
    console.log('Added supplier_transaction for kingombe', stx.id);

    // update user
    const now = new Date();
    const newEndDate = new Date(now.setDate(now.getDate() + 30));
    await db.collection("users").doc(kingombeId).update({
      subscriptionStatus: "ACTIVE",
      subscriptionEndDate: newEndDate
    });
    console.log('Updated user subscription!');
  }
}
run().catch(console.error);
