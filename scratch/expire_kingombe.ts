import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

// Basic dotenv implementation
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const serviceAccountStr = process.env.FIREBASE_PRIVATE_KEY;
if (!serviceAccountStr) {
  console.error("Missing FIREBASE_PRIVATE_KEY");
  process.exit(1);
}

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: serviceAccountStr.replace(/\\n/g, '\n'),
};

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

async function expireKingombe() {
  try {
    const snapshot = await db.collection("users").get();
    let found = false;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const displayName = data.displayName || "";
      const email = data.email || "";
      const businessName = data.businessName || "";
      
      if (
        displayName.toLowerCase().includes("kingombe") || 
        email.toLowerCase().includes("kingombe") ||
        businessName.toLowerCase().includes("kingombe")
      ) {
        found = true;
        console.log(`Found Kingombe user: ${doc.id} (${email} / ${displayName} / ${businessName})`);
        
        // Set to a past date
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);
        
        await doc.ref.update({
          subscriptionStatus: "ACTIVE", // Keeping ACTIVE but past date triggers layout check
          subscriptionEndDate: pastDate,
        });
        
        console.log("Successfully expired subscription for Kingombe.");
      }
    }
    if (!found) {
      console.log("User 'kingombe' not found in users collection.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

expireKingombe();
