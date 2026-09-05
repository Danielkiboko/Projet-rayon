"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Lock, CreditCard, CheckCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-white">Chargement...</div>;
  }

  // Calculate days left in trial if applicable
  let daysLeft = 0;
  let isExpired = false;

  if (userData?.subscriptionEndDate) {
    const endDate = userData.subscriptionEndDate.toDate ? userData.subscriptionEndDate.toDate() : new Date(userData.subscriptionEndDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (now > endDate) {
      isExpired = true;
    }
  }

  const isTrial = userData?.subscriptionStatus === "TRIAL";
  const isActive = userData?.subscriptionStatus === "ACTIVE" && !isExpired;
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMakutaPayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/makuta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId: user?.uid })
      });
      const data = await res.json();
      if (data.success) {
        alert("Paiement réussi ! Votre abonnement est renouvelé pour 1 mois.");
        window.location.href = "/supplier/dashboard";
      } else {
        alert("Erreur de paiement : " + data.error);
      }
    } catch (error) {
      alert("Une erreur est survenue.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isActive) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 text-center pt-10 pb-20">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-green-400" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-white">Abonnement Actif</h1>
        <p className="text-gray-400 text-lg">Votre compte fournisseur est entièrement débloqué.</p>
        <button 
          onClick={() => router.push("/supplier/dashboard")}
          className="mt-6 inline-flex items-center space-x-2 bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <span>Retour au tableau de bord</span>
          <ArrowRight size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-10">
      <div className="text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="text-red-400" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          {isExpired ? "Abonnement expiré" : "Abonnement Fournisseur"}
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          {isExpired 
            ? "Pour continuer à vendre vos produits et accéder à votre tableau de bord, veuillez renouveler votre abonnement mensuel." 
            : `Il vous reste ${daysLeft} jours d'essai gratuit. Vous pouvez anticiper et activer votre abonnement dès maintenant.`}
        </p>
      </div>

      <div className="bg-[#140b2e] border border-white/10 rounded-2xl p-8 mt-10 max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/30 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="text-center mb-8">
          <span className="bg-primary/20 text-primary-light px-3 py-1 rounded-full text-sm font-semibold uppercase tracking-wider">
            Plan Pro
          </span>
          <div className="mt-4 flex items-center justify-center text-white">
            <span className="text-5xl font-bold">$20</span>
            <span className="text-gray-400 ml-2">/ mois</span>
          </div>
        </div>

        <ul className="space-y-4 mb-8">
          <li className="flex items-center text-gray-300">
            <CheckCircle className="text-green-400 mr-3" size={20} />
            <span>Accès illimité à votre boutique en ligne</span>
          </li>
          <li className="flex items-center text-gray-300">
            <CheckCircle className="text-green-400 mr-3" size={20} />
            <span>Gestion autonome des livreurs</span>
          </li>
          <li className="flex items-center text-gray-300">
            <CheckCircle className="text-green-400 mr-3" size={20} />
            <span>Livre de caisse personnel</span>
          </li>
          <li className="flex items-center text-gray-300">
            <CheckCircle className="text-green-400 mr-3" size={20} />
            <span>Outils d'analyse et de vente</span>
          </li>
        </ul>

        <div className="pt-6 border-t border-white/10">
          <button 
            onClick={handleMakutaPayment}
            disabled={isProcessing}
            className={`w-full ${isProcessing ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary-light active:scale-95'} text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-transform shadow-lg`}
          >
            <CreditCard size={24} />
            <span>{isProcessing ? "Traitement en cours..." : "Payer avec Makuta ($20)"}</span>
          </button>
          <p className="text-center text-sm text-gray-500 mt-4">
            Paiement sécurisé par la passerelle Makuta.
          </p>
        </div>
      </div>
    </div>
  );
}
