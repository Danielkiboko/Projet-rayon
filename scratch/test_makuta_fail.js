const admin = require('firebase-admin/app');
const firestore = require('firebase-admin/firestore');
const fs = require('fs');

const envConfig = fs.readFileSync('.env.local', 'utf8');
envConfig.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2];
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[match[1]] = val;
  }
});

let privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
admin.initializeApp({
  credential: admin.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  }),
});

async function run() {
  const db = firestore.getFirestore(); // Connects to (default)
  try {
    const userRef = db.collection("users").doc("test-id");
    await userRef.get(); // this throws NOT_FOUND
    
    // what if we try to add?
    await db.collection("transactions").add({test: 1});
  } catch (e) {
    console.error("ERROR CAUGHT:", e.message);
  }
}
run();
