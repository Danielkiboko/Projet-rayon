import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });
    }

    const q = query(
      collection(db, "users"),
      where("phone", "==", phone),
      limit(1)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json({ error: "Aucun compte trouvé avec ce numéro." }, { status: 404 });
    }

    const userData = snap.docs[0].data();
    
    return NextResponse.json({ email: userData.email });
  } catch (error: any) {
    console.error("Recover Email Error:", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
