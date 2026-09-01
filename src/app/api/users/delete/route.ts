import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const callerRole = decodedToken.role;
    if (!['superAdmin', 'admin'].includes(callerRole)) {
      return NextResponse.json({ error: 'Forbidden: Only admins can delete users' }, { status: 403 });
    }

    const body = await req.json();
    const { uid, collectionName = 'drivers' } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    // Delete from Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (authErr: any) {
      // If user not found in Auth, we can still proceed to clean up DB
      if (authErr.code !== 'auth/user-not-found') {
        throw authErr;
      }
    }

    // Delete from Firestore
    const batch = adminDb.batch();
    batch.delete(adminDb.collection('users').doc(uid));
    
    if (collectionName) {
      batch.delete(adminDb.collection(collectionName).doc(uid));
    }

    // Effacer toutes les propriétés/produits créés par ce fournisseur
    const productsSnapshot = await adminDb.collection('products').where('supplierId', '==', uid).get();
    productsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({ message: 'User and associated data deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
