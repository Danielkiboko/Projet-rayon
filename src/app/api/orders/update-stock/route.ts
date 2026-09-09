import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const { productId, quantity, action } = await req.json();

    if (!productId || typeof quantity !== 'number' || !['decrement', 'increment'].includes(action)) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const productRef = adminDb.collection('products').doc(productId);
    
    const amount = action === 'decrement' ? -Math.abs(quantity) : Math.abs(quantity);

    await productRef.update({
      stock: FieldValue.increment(amount)
    });

    return NextResponse.json({ success: true, message: "Stock mis à jour avec succès." });

  } catch (error: any) {
    console.error("Erreur API update-stock:", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}
