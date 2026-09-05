import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { supplierId } = await req.json();

    if (!supplierId) {
      return NextResponse.json({ success: false, error: "Missing supplierId" }, { status: 400 });
    }

    // TODO: Intégration API Makuta Réelle
    // const response = await fetch("MAKUTA_URL/mgep_Payment", { ... });
    // const result = await response.json();
    
    // Pour l'instant, on simule un succès immédiat après 2 secondes
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Si le paiement réussit, on met à jour l'abonnement
    const userRef = doc(db, "users", supplierId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Calculer la nouvelle date de fin (+30 jours)
      const now = new Date();
      const newEndDate = new Date(now.setDate(now.getDate() + 30));

      await updateDoc(userRef, {
        subscriptionStatus: "ACTIVE",
        subscriptionEndDate: newEndDate
      });

      return NextResponse.json({ success: true, message: "Paiement réussi" });
    } else {
      return NextResponse.json({ success: false, error: "Utilisateur non trouvé" }, { status: 404 });
    }

  } catch (error: any) {
    console.error("Erreur API Makuta :", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
