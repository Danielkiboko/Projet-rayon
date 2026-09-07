"use server";

import { adminDb } from "@/lib/firebase-admin";

export async function fetchSuppliersAction() {
  try {
    const usersSnap = await adminDb.collection("users").where("role", "in", ["SUPPLIER", "supplier"]).get();
    const suppliers: any[] = [];
    usersSnap.forEach(doc => {
      const data = doc.data();
      suppliers.push({
        id: doc.id,
        displayName: data.displayName || "",
        email: data.email || "",
        subscriptionStatus: data.subscriptionStatus || "",
        // We return an ISO string because Dates cannot be sent from server action to client
        subscriptionEndDate: data.subscriptionEndDate ? data.subscriptionEndDate.toDate().toISOString() : null,
      });
    });
    return suppliers;
  } catch (error) {
    console.error("Error fetching suppliers (server action):", error);
    return [];
  }
}
