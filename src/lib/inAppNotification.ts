import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface SendNotificationParams {
  userId?: string;
  clientId?: string;
  supplierId?: string;
  type: "order" | "booking" | "delivery" | "review" | "chat" | "system";
  title: string;
  message: string;
  link?: string;
}

/**
 * Sends a real-time in-app notification from client-side code
 */
export async function sendClientInAppNotification(params: SendNotificationParams): Promise<string | null> {
  try {
    const targetUserId = params.userId || params.clientId;
    if (!targetUserId && !params.supplierId) {
      console.warn("sendClientInAppNotification: Neither targetUserId nor supplierId was provided.");
      return null;
    }

    const docRef = await addDoc(collection(db, "inapp_notifications"), {
      userId: targetUserId || null,
      clientId: params.clientId || targetUserId || null,
      supplierId: params.supplierId || null,
      type: params.type || "system",
      title: params.title,
      message: params.message,
      link: params.link || "#",
      read: false,
      time: Date.now(),
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating in-app notification:", error);
    return null;
  }
}
