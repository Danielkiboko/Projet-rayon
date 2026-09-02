import { NextResponse } from "next/server";
import { 
  sendEmail, 
  sendSMS, 
  getOrderCreatedEmail, 
  getOrderCreatedSMS, 
  getOrderStatusEmail, 
  getOrderStatusSMS 
} from "@/lib/notifications";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, orderId, category, status, supplierId, clientId, clientPhone: reqClientPhone, data } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing required fields (action)" }, { status: 400 });
    }

    let supplierEmail = "";
    let supplierPhone = "";
    let clientEmail = "";
    let clientPhone = reqClientPhone || "";

    // Fetch Supplier Details
    if (supplierId && supplierId !== "admin") {
      const supplierDoc = await getDoc(doc(db, "users", supplierId));
      if (supplierDoc.exists()) {
        supplierEmail = supplierDoc.data().email || "";
        supplierPhone = supplierDoc.data().phone || "";
      }
    } else if (supplierId === "admin") {
      supplierEmail = "danielkiboko218@gmail.com";
    }

    // Fetch Client Details
    if (clientId) {
      const clientDoc = await getDoc(doc(db, "users", clientId));
      if (clientDoc.exists()) {
        clientEmail = clientDoc.data().email || "";
        if (!clientPhone) clientPhone = clientDoc.data().phone || "";
      }
    }

    const tasks: Promise<any>[] = [];

    // 1. ORDER_CREATED : Notify Supplier
    if (action === "ORDER_CREATED") {
      if (supplierEmail) {
        tasks.push(sendEmail(
          supplierEmail, 
          `Nouvelle commande Rayon - ${category || 'Général'}`, 
          getOrderCreatedEmail(orderId, category || 'Général')
        ));
      }
      if (supplierPhone) {
        tasks.push(sendSMS(supplierPhone, getOrderCreatedSMS(orderId)));
      }
    }

    // 2. ORDER_STATUS_CHANGED : Notify Client
    if (action === "ORDER_STATUS_CHANGED" && status) {
      if (clientEmail) {
        tasks.push(sendEmail(
          clientEmail,
          `Mise à jour de votre commande Rayon`,
          getOrderStatusEmail(orderId, status)
        ));
      }
      if (clientPhone) {
        tasks.push(sendSMS(clientPhone, getOrderStatusSMS(orderId, status)));
      }
    }

    // Note: L'envoi de SMS pour les visites immobilières a été supprimé. 
    // La communication se fait désormais via le système de chat intégré.

    await Promise.allSettled(tasks);
    return NextResponse.json({ success: true, message: "Notifications dispatched" });

  } catch (error: any) {
    console.error("Erreur API Notifications:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
