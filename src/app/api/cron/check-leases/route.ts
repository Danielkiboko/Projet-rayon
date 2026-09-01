import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Vercel Cron Secret (Optionnel, pour sécuriser l'appel de la route)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    // 1. Vérification de sécurité (si configuré)
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Date du jour
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Pour notifier 3 jours avant
    const inThreeDays = new Date();
    inThreeDays.setDate(now.getDate() + 3);
    const inThreeDaysStr = inThreeDays.toISOString().split('T')[0];

    // 3. Récupérer les locataires (en statut actif/pending)
    const tenantsSnapshot = await adminDb.collection('tenants')
      .where('status', 'in', ['ACTIVE', 'LATE', 'PENDING'])
      .get();

    const notifications: string[] = [];
    
    // Tableau des promesses d'envoi pour traiter en parallèle
    const sendPromises: Promise<any>[] = [];

    tenantsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      if (!data.nextPayment) return;

      const nextPaymentStr = data.nextPayment.split('T')[0]; // Format YYYY-MM-DD

      let message = "";
      let isLate = false;

      // Condition 1 : C'est le jour J
      if (nextPaymentStr === todayStr) {
        message = `Bonjour ${data.tenantName}, votre loyer de ${data.rentAmount}$ arrive à échéance aujourd'hui. Merci de procéder au paiement.`;
      } 
      // Condition 2 : 3 jours avant
      else if (nextPaymentStr === inThreeDaysStr) {
        message = `Bonjour ${data.tenantName}, ceci est un rappel amical. Votre loyer de ${data.rentAmount}$ sera dû dans 3 jours (${nextPaymentStr}).`;
      } 
      // Condition 3 : En retard (la date est passée et le statut n'est pas "PAID")
      else if (new Date(nextPaymentStr) < now) {
        isLate = true;
        message = `URGENT: Bonjour ${data.tenantName}, votre loyer de ${data.rentAmount}$ prévu le ${nextPaymentStr} est en retard. Merci de régulariser la situation immédiatement.`;
        
        // Mettre à jour le statut en LATE dans la base si ce n'est pas déjà fait
        if (data.status !== 'LATE') {
          adminDb.collection('tenants').doc(doc.id).update({ status: 'LATE' });
        }
      }

      if (message) {
        // Envoi SMS via MobiShastra
        if (data.tenantPhone) {
          sendPromises.push(sendSMS(data.tenantPhone, message));
          notifications.push(`SMS à ${data.tenantPhone}`);
        }
        
        // Envoi Email
        if (data.tenantEmail) {
          sendPromises.push(sendEmail(data.tenantEmail, 'Rappel de Loyer - Rayons', message));
          notifications.push(`Email à ${data.tenantEmail}`);
        }
      }
    });

    // Attendre que tous les envois soient terminés
    await Promise.all(sendPromises);

    return NextResponse.json({ 
      success: true, 
      message: `Cron exécuté avec succès. ${notifications.length} notifications envoyées.`,
      logs: notifications
    });

  } catch (error: any) {
    console.error('Erreur Cron check-leases:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fonction d'envoi SMS avec MobiShastra
async function sendSMS(phone: string, message: string) {
  const MOBISHASTRA_API_KEY = process.env.MOBISHASTRA_API_KEY;
  const MOBISHASTRA_SENDER_ID = process.env.MOBISHASTRA_SENDER_ID || "RAYONS";
  
  if (!MOBISHASTRA_API_KEY) {
    console.warn("SMS ignoré : Clé MobiShastra manquante.");
    return;
  }

  try {
    // Format attendu par l'API MobiShastra (à ajuster selon leur doc)
    const url = `https://api.mobishastra.com/sms/send?apikey=${MOBISHASTRA_API_KEY}&sender=${MOBISHASTRA_SENDER_ID}&to=${phone}&message=${encodeURIComponent(message)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Erreur d'envoi SMS:", err);
  }
}

// Fonction d'envoi Email (ex: via Resend ou SendGrid)
async function sendEmail(to: string, subject: string, text: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.warn("Email ignoré : Clé Resend manquante.");
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@rayons.net',
        to: to,
        subject: subject,
        text: text
      })
    });
    
    return await response.json();
  } catch (err) {
    console.error("Erreur d'envoi Email:", err);
  }
}
