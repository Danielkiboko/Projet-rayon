import { NextResponse } from 'next/server';
import { adminAuth, adminDb, adminInitError } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    // 1. Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      if (!adminAuth || typeof adminAuth.verifyIdToken !== 'function') {
         throw new Error(`Firebase admin is not properly initialized. adminAuth.verifyIdToken is missing. Init error: ${adminInitError?.message || adminInitError || 'Unknown'}`);
      }
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error: any) {
      console.error('Verify ID token error:', error);
      return NextResponse.json({ error: `Unauthorized: Invalid token. Details: ${error.message}` }, { status: 401 });
    }

    let callerRole = decodedToken.role;
    const callerUid = decodedToken.uid;
    const callerEmail = decodedToken.email;

    // Bootstrap rule: If the main admin hasn't got the custom claim yet, allow them as superAdmin
    if (!callerRole && callerEmail === 'danielkiboko218@gmail.com') {
      callerRole = 'superAdmin';
    }

    if (!['superAdmin', 'admin', 'supplier'].includes(callerRole)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges to create users' }, { status: 403 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { email, password, displayName, roleToCreate, extraData = {} } = body;

    if (!email || !password || !roleToCreate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Enforce Creation Rules
    if (callerRole === 'supplier' && roleToCreate !== 'driver') {
      return NextResponse.json({ error: 'Forbidden: Suppliers can only create drivers' }, { status: 403 });
    }
    if (callerRole === 'admin' && roleToCreate === 'superAdmin') {
      return NextResponse.json({ error: 'Forbidden: Admins cannot create super admins' }, { status: 403 });
    }

    // 4. Create the User in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // 5. Set Custom Claims (Role & Creation lineage)
    const claims = {
      role: roleToCreate,
      createdBy: callerRole === 'supplier' ? callerUid : callerRole,
    };
    await adminAuth.setCustomUserClaims(userRecord.uid, claims);

    let additionalData = { ...extraData };
    if (roleToCreate === 'supplier' || roleToCreate === 'SUPPLIER_IMMO') {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      additionalData.subscriptionStatus = 'TRIAL';
      additionalData.subscriptionEndDate = endDate;
    }

    // 6. Save User Metadata in Firestore
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      uid: userRecord.uid,
      email,
      displayName,
      role: roleToCreate,
      createdBy: claims.createdBy,
      creatorRole: callerRole,
      createdAt: new Date(),
      status: 'active',
      ...additionalData
    });

    // 7. Route to specific collections (drivers, suppliers) if needed
    if (roleToCreate === 'supplier') {
      await adminDb.collection('suppliers').doc(userRecord.uid).set({
        email,
        displayName,
        createdAt: new Date(),
        status: 'active'
      });
    } else if (roleToCreate === 'driver') {
      await adminDb.collection('drivers').doc(userRecord.uid).set({
        supplierId: callerRole === 'supplier' ? callerUid : 'admin',
        email,
        displayName,
        createdAt: new Date(),
        status: 'active'
      });
    }

    return NextResponse.json({ 
      message: 'User created successfully', 
      uid: userRecord.uid 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
