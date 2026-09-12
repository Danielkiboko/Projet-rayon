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

    let callerRole = decodedToken.role;
    const callerUid = decodedToken.uid;
    const callerEmail = (decodedToken.email || '').toLowerCase().trim();
    const isSuperAdmin = callerEmail === "danielkiboko218@gmail.com" || callerEmail === "admin@rayons.net";

    // Fallback to Firestore if token has no role claim
    if (!callerRole) {
      try {
        const userDoc = await adminDb.collection('users').doc(callerUid).get();
        if (userDoc.exists) {
          callerRole = userDoc.data()?.role;
        }
      } catch (dbErr) {
        console.warn('Could not fetch caller doc from Firestore:', dbErr);
      }
    }

    const normalizedRole = (callerRole || '').toString().toLowerCase();
    const isAuthorizedAdmin = isSuperAdmin || 
      ['superadmin', 'super_admin', 'admin', 'sub_admin'].includes(normalizedRole);

    if (!isAuthorizedAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only admins can delete users' }, { status: 403 });
    }

    const body = await req.json();
    const { uid, collectionName } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    // 1. Delete from Firebase Auth
    try {
      await adminAuth.deleteUser(uid);
    } catch (authErr: any) {
      if (authErr.code !== 'auth/user-not-found') {
        console.warn('Auth deletion error (non-fatal):', authErr.message);
      }
    }

    // 2. Delete from Firestore (users, suppliers, drivers)
    const batch = adminDb.batch();
    batch.delete(adminDb.collection('users').doc(uid));
    batch.delete(adminDb.collection('suppliers').doc(uid));
    batch.delete(adminDb.collection('drivers').doc(uid));
    
    if (collectionName) {
      batch.delete(adminDb.collection(collectionName).doc(uid));
    }

    // 3. Delete products and properties associated with this supplier
    try {
      const [productsSnapshot, propertiesSnapshot] = await Promise.all([
        adminDb.collection('products').where('supplierId', '==', uid).get(),
        adminDb.collection('properties').where('supplierId', '==', uid).get()
      ]);

      productsSnapshot.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      propertiesSnapshot.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
    } catch (queryErr) {
      console.warn('Could not fetch supplier products or properties:', queryErr);
    }

    await batch.commit();

    return NextResponse.json({ message: 'User and associated data deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
