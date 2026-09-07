const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const admin = require('firebase-admin');

try {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  console.log("Key for cert includes actual newline?", privateKey.includes('\n'));
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
  console.log("Success");
} catch(e) {
  console.error("Fail", e.message);
}
