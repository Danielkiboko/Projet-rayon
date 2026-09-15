const admin = require('firebase-admin');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
let privateKeyRaw = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('FIREBASE_PRIVATE_KEY=')) {
    privateKeyRaw = line.substring('FIREBASE_PRIVATE_KEY='.length);
    break;
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
    clientEmail: 'firebase-adminsdk-fbsvc@rayon-projet.iam.gserviceaccount.com',
    privateKey: privateKey,
  })
});

const db = admin.firestore(); // USING NO ARGUMENTS!
db.collection('users').get().then(snap => {
  console.log(`Found ${snap.size} users.`);
}).catch(console.error);
