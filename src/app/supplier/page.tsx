"use client";

import { useAuth } from "@/context/AuthContext";
import ImmoDashboard from "@/components/dashboards/ImmoDashboard";
import ModeDashboard from "@/components/dashboards/ModeDashboard";
import ConnectDashboard from "@/components/dashboards/ConnectDashboard";
import { ShieldAlert } from "lucide-react";

export default function SupplierDashboardRouter() {
  const { user, userData, loading } = useAuth();
  
  if (loading) {
    return <div className="h-64 flex items-center justify-center text-white animate-pulse">Chargement de votre espace...</div>;
  }

  if (!user || !userData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <p>Veuillez vous connecter pour accéder à votre espace fournisseur.</p>
      </div>
    );
  }

  // Déterminer le rayon principal du fournisseur
  // Si le fournisseur a plusieurs rayons dans userData.rayons (tableau), on prendra le premier par défaut, ou on affichera un sélecteur
  // Pour l'instant on utilise le serviceAttached principal
  
  let currentService = userData?.serviceAttached || "default";
  
  const isImmoSupplier = 
    userData?.role === "SUPPLIER_IMMO" || 
    userData?.businessType === "IMMOBILIER" || 
    userData?.rayon?.type === "REAL_ESTATE" || 
    userData?.rayon === "immo";

  if (isImmoSupplier) {
    currentService = "immo";
  }

  // Afficher le composant correspondant au rayon
  switch (currentService) {
    case "immo":
      return <ImmoDashboard />;
    case "mode":
      return <ModeDashboard />;
    case "connect":
      return <ConnectDashboard />;
    default:
      // Vue par défaut générique
      return (
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-8 shadow-sm text-center">
          <h2 className="text-xl font-bold text-white mb-2">Bienvenue sur votre espace</h2>
          <p className="text-gray-400">
            Votre compte n'est pas encore assigné à un rayon spécifique. Veuillez contacter l'administrateur.
          </p>
        </div>
      );
  }
}
