const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
let privateKeyRaw = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('FIREBASE_PRIVATE_KEY=')) {
    privateKeyRaw = line.substring('FIREBASE_PRIVATE_KEY='.length);
    break;
  }
}
let privateKey = privateKeyRaw.trim();
privateKey = privateKey.replace(/^["']|["']$/g, '');
privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '');
const pemRegex = /-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/;
const match = privateKey.match(pemRegex);
let cleanBase64 = "";
if (match) {
  cleanBase64 = match[1].replace(/\s+/g, '');
} else {
  cleanBase64 = privateKey.replace(/\s+/g, '');
}
const chunks = [];
for (let i = 0; i < cleanBase64.length; i += 64) {
  chunks.push(cleanBase64.slice(i, i + 64));
}
privateKey = `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
console.log("Reconstructed Key:");
console.log(privateKey);
