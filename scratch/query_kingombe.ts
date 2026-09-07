import { adminDb } from './src/lib/firebase-admin';

async function main() {
  const usersSnapshot = await adminDb.collection('users').get();
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.displayName?.toLowerCase().includes('kingombe') || data.email?.toLowerCase().includes('kingombe')) {
      console.log('User found:', doc.id, data);
    }
  });

  const suppliersSnapshot = await adminDb.collection('suppliers').get();
  suppliersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.displayName?.toLowerCase().includes('kingombe') || data.email?.toLowerCase().includes('kingombe') || doc.id.includes('kingombe')) {
      console.log('Supplier found:', doc.id, data);
    }
  });

  const paymentsSnapshot = await adminDb.collection('transactions').get();
  paymentsSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.description?.toLowerCase().includes('kingombe') || data.referenceId?.toLowerCase().includes('kingombe')) {
      console.log('Transaction found:', doc.id, data);
    }
  });
}
main().catch(console.error);
