const admin = require('firebase-admin/app');
const firestore = require('firebase-admin/firestore');

admin.initializeApp({ projectId: 'test' });
try {
  const db = firestore.getFirestore('default');
  console.log("SUCCESS");
} catch (e) {
  console.log("ERROR:", e.message);
}
