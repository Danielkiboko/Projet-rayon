"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, ShieldCheck, Heart } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useCurrency } from "@/context/CurrencyContext";

export default function FinalPaymentPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const docRef = doc(db, "orders", orderId as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Commande introuvable.");
        }
      } catch (err) {
        console.error(err);
        setError("Erreur lors de la récupération de la commande.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleFinalPayment = async () => {
    setIsProcessing(true);
    setError("");

    try {
      // Simulate Payment Gateway delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 1. Update order status in Firestore
      await updateDoc(doc(db, "orders", order.id), {
        status: "COMPLETED",
      });

      // 2. Send Loyalty SMS via our API
      const message = `Merci pour votre achat chez Rayon ! Votre avis compte. Remplissez notre sondage de fidélité et gagnez des points : https://rayon.ae/survey/${order.id}`;
      
      await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: order.clientPhone,
          message: message,
        }),
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du paiement final.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement de votre commande...</div>;
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-gray-900 font-bold underline">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Paiement Réussi !</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          Merci pour votre commande. Vous pouvez à présent récupérer vos articles auprès du livreur. 
          <br /><br />
          <strong>Un SMS contenant un sondage de fidélité vient de vous être envoyé.</strong>
        </p>
        <Link href="/" className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  // If order is already completed
  if (order.status === "COMPLETED") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Commande déjà réglée</h1>
        <p className="text-gray-600 mb-8 max-w-md">Cette commande a déjà été payée dans son intégralité.</p>
        <Link href="/" className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-xl mx-auto px-4 py-6 flex items-center">
          <Link href="/" className="text-gray-500 hover:text-gray-900 mr-4 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Paiement du Solde</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Commande #{order.id.slice(0,6).toUpperCase()}</h2>
            <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">Livreur sur place</span>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Livré à :</p>
              <p className="font-medium text-gray-900">{order.clientAddress}</p>
            </div>
            
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Sous-total articles</span>
                <span className="text-gray-900">{formatPrice(order.itemsTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Frais d'approche (Déjà payé)</span>
                <span className="text-gray-900">3 USD</span>
              </div>
              
              <div className="flex justify-between items-center text-lg font-bold pt-4 mt-2 border-t border-gray-200">
                <span className="text-gray-900">Reste à payer</span>
                <span className="text-blue-600 text-2xl">{formatPrice(order.remainingBalance)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-blue-900 flex items-center text-sm mb-2">
              <CreditCard size={16} className="mr-2" />
              Paiement Sécurisé (Simulation)
            </h3>
            <p className="text-xs text-blue-800">
              Le paiement de {formatPrice(order.remainingBalance)} débloquera votre commande auprès du livreur.
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            onClick={handleFinalPayment}
            disabled={isProcessing}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-sm hover:bg-gray-800 active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              `Payer le solde (${formatPrice(order.remainingBalance)})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
