import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';

const envConfig = fs.readFileSync('.env.local', 'utf8');
envConfig.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2];
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    process.env[match[1]] = val;
  }
});

async function deleteTestUsers() {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    }
    
    const auth = getAuth();
    
    // User to delete
    const uidToDelete = "TUK7hvQ9ItPCp7cOA6CQqO2ITDH3"; // zegue@nova-city.online
    
    await auth.deleteUser(uidToDelete);
    console.log(`Successfully deleted user with UID: ${uidToDelete} (zegue@nova-city.online)`);

  } catch (error) {
    console.error('Error deleting user:', error);
  }
}
deleteTestUsers();
