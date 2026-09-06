import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { initFirebaseAdmin, adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  let propertyId = "unknown";
  try {
    const body = await req.json();
    propertyId = body.propertyId;
    const { status, rejectionReason, supplierId, title } = body;

    if (!propertyId || !status) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    console.log("API update-status called for propertyId:", propertyId, "status:", status);

    await initFirebaseAdmin();
    const db = adminDb;

    // 1. Mettre à jour le statut de la propriété
    const propRef = db.collection("properties").doc(propertyId);
    
    const updateData: any = { status };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    
    await propRef.update(updateData);

    // 2. Envoyer la notification in-app au fournisseur
    if (supplierId) {
      let notifTitle = "";
      let notifMessage = "";

      const propertyTitle = title?.fr || title || 'Immobilier';

      if (status === "Disponible") {
        notifTitle = "Annonce Publiée";
        notifMessage = `Félicitations, votre bien "${propertyTitle}" est maintenant en ligne !`;
      } else if (status === "REJECTED") {
        notifTitle = "Annonce Rejetée";
        notifMessage = `Votre bien "${propertyTitle}" a été rejeté. Motif : ${rejectionReason || "Non spécifié"}`;
      }

      if (notifTitle) {
        await db.collection("inapp_notifications").add({
          supplierId: supplierId,
          type: "property",
          title: notifTitle,
          message: notifMessage,
          time: Date.now(),
          link: "/supplier/properties",
          read: false,
          createdAt: FieldValue.serverTimestamp()
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating property status for propertyId " + propertyId + ":", error);
    return NextResponse.json({ success: false, error: error.message + ` (propertyId: ${propertyId})` }, { status: 500 });
  }
}
