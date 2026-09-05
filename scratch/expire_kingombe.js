const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = {
  projectId: "rayon-projet",
  clientEmail: "firebase-adminsdk-fbsvc@rayon-projet.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDj6h0iwNbrij5U\nBr0eBl2/Po9L49Rki26s5bTim7tKngqV+CsMuHPSbeVEexXq4Fb6Qlvdd6fK9Exc\ns0X4iuUq1OGAzvCl4U/YH7a4fZT2tiD+cDWAx9kbCyunuBowVRGsI0QclpI9gTsu\nk8/0JbBfC5d0S4S7fI5izUmgAsdmV/Cn3EOXMDFwARyaDnlMxnhPZbv8kv/Pkpu/\ny24tR0AVoFszbe+Iv3abwnOgKXyp6G+xJbaRZv4bYq0zFVssPhtsggdkA8IjJOEG\n+l2MPTw4LoRV5Dzrho/cOrR5+/reCKmvetgfMq2ZydSorhpAwPYcVRbLEq+cMrB3\nhHEkV6BbAgMBAAECggEAAumCKeg8/eMjXqEmvyCiB69fj+mC1IOcr+mleBgAFwdD\n0lyf6KMzYeGNtDmwZNZl/TiCnsNPlJp1uxopwRqhOqeY6V5Cp3eA7bn3yeMiOxQb\nrJgpcmeia1zDkN4bgceXJvBrTotRULVQg3B0ZUW45iQ4m832/3y5cT/az+vCDtJp\nNpy4iXU4kuYB1OvyrQM5W8hglJXMpcUmq+Sao2YgHmRxI0W1uq6tZbjfhhkU/s0h\nD6+y2Bj+fwdh5caM+WN13ROAH+XUmO2alul3B3yG7dxh4sikPx12oIxWHJiKZTam\ngzkBrKGvMr4mU3QBcIVL/iitzbo+wUcoxBw/mT7vaQKBgQD6PzJGgh+XaJzrXzys\nB1AOz9Iwca4iRkarL5pF1go6BJs+nXUYSbaFfTOBea/pxo0PUZXRKlH6FHljg+C1\nA8nePqQvslsy0qCgxI/yn/5cO3IbeTgteva9gKvnlDQ/xeWLfMXLTOfyVVj740Nn\nSvnQAC9bUEcDYO3hCtMys7BOKQKBgQDpJ3uGlMYQ7m8gqHwWc1U/bUfJi7HtWBrF\nmON2kXa/OIGYYn02tlvzzLKa5TCiBceJ55eutWB7IPwg7OhMKU5oDXf6oJG8G3Kv\nJKj4hDOJ2DoeJkW9Rwomw7+3ZkkeIqLjM1AT4OhLE4W7qcAX8F9oCdZK537O+Uc1\nYdFzG/YC4wKBgQDlOQQVX9YOO64ZT7hkn6IunyCabVcjYBoVblozBBeEA3osxdBf\neg3tgryuKcgALHZDhOjlmo1StHRouoEXbiv4HosIgahWCmdGPCbbCMDWvUENd2EF\nD/B5ryZHzxJ5JA3aUmVfjseby5/hws+YCy5+39yBGSyjJKNhEyhX9g5V2QKBgQDR\nit6FsafhB6lwXHxJYRY4jup5xMcAXLKS7DliEpH6gbpXTgzi4zn4/vt2Io120GLp\nGe9E4VX400hF/yU3bdg9w/0UjsLroG+N4RDLaWU4edCh0BvVZMdG156yIYeNQevK\n7g8GDpg3ATCr3H/8A9h7FHw3jZ52Pas12tf28CZFqQKBgEk1FQpgACjXdHopJqfv\n8MTKfROK/kW4rtx0AOMlgellLox/Yv8YM2Iy1VGIp8zD37NzMrJ5rhsTIMEzwX+g\nXbXSu6FQzjSLorgHDQKVbbjfQpCtNTA6iPh21v52Y71KL39fS08gCufxT90jzsUm\nDmqHCchTxThkVENp38Yp0X06\n-----END PRIVATE KEY-----"
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
