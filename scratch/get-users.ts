import { adminDb } from "../src/lib/firebase-admin";

async function main() {
  const usersRef = adminDb.collection('users');
  const snapshot = await usersRef.get();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.displayName && data.displayName.toLowerCase().includes('laurent sumaili')) {
      console.log('Found:', data.email, data.uid, data.displayName);
    }
  });
}
main();
