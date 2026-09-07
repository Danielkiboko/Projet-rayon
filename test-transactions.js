const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const admin = require('firebase-admin');

let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
privateKey = privateKey.trim();
if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
else if (privateKey.startsWith("'") && privateKey.endsWith("'")) privateKey = privateKey.slice(1, -1);
privateKey = privateKey.replace(/\\n/g, '\n');
if (!privateKey.includes('\n') || privateKey.split('\n').length < 3) {
  const beginHeader = "-----BEGIN PRIVATE KEY-----";
  const endHeader = "-----END PRIVATE KEY-----";
  if (privateKey.includes(beginHeader) && privateKey.includes(endHeader)) {
    const body = privateKey.substring(privateKey.indexOf(beginHeader) + beginHeader.length, privateKey.indexOf(endHeader)).replace(/\s+/g, "");
    const match = body.match(/.{1,64}/g);
    if (match) privateKey = `${beginHeader}\n${match.join('\n')}\n${endHeader}\n`;
  }
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});

const db = admin.firestore();

async function getTx() {
  const snapshot = await db.collection('transactions').get();
  console.log("Total transactions:", snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, "=>", doc.data());
  });
}
getTx();
