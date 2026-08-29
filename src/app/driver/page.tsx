"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, MapPin, Clock, ChevronRight, User } from "lucide-react";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DriverDashboard() {
  const [missions, setMissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Écouter les commandes en temps réel
    const q = query(
      collection(db, "orders"), 
      where("status", "in", ["EN_ATTENTE", "EN_ROUTE"]),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMissions(ordersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Erreur de récupération des missions :", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 bg-[#0b061c] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Bonjour, Alex</h1>
          <p className="text-gray-400 text-sm">Prêt pour vos courses ?</p>
        </div>
        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border border-primary/50">
          <User className="text-primary-light" />
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-gray-400 text-xs font-medium mb-1">Gains du jour</p>
          <p className="text-2xl font-bold text-green-400">$ 45.00</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-gray-400 text-xs font-medium mb-1">Courses terminées</p>
          <p className="text-2xl font-bold text-white">3</p>
        </div>
      </div>

      {/* Liste des missions */}
      <h2 className="text-lg font-bold text-white mb-4">Missions Actuelles</h2>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-gray-400">Aucune mission pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => (
            <Link href={`/driver/mission/${mission.id}`} key={mission.id}>
              <div className="bg-[#140b2e] border border-white/10 rounded-2xl p-4 active:scale-95 transition-transform block">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${mission.status === "EN_ROUTE" ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}`}>
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{mission.id.slice(0, 8).toUpperCase()}...</h3>
                    <p className="text-xs text-gray-400">{mission.customerInfo?.name || "Client"}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${mission.status === "EN_ROUTE" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-orange-500/20 text-orange-400 border border-orange-500/30"}`}>
                  {mission.status?.replace("_", " ")}
                </span>
              </div>

              <div className="space-y-3 mb-4 relative">
                <div className="absolute left-2.5 top-5 bottom-3 w-[2px] bg-white/10" />
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center z-10 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Départ</p>
                    <p className="text-sm font-medium text-white">Dépôt Central</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center z-10 mt-0.5">
                    <MapPin size={12} className="text-primary-light" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Livraison</p>
                    <p className="text-sm font-medium text-white line-clamp-1">{mission.customerInfo?.address || "Adresse non spécifiée"}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex items-center text-gray-400 text-xs">
                  <Clock size={14} className="mr-1" />
                  {mission.createdAt?.toDate ? mission.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Maintenant"}
                </div>
                <div className="flex items-center font-bold text-primary-light text-sm">
                  $ {mission.totalAmount?.toFixed(2) || "0.00"}
                  <ChevronRight size={16} className="ml-1" />
                </div>
              </div>

            </div>
          </Link>
        ))}
      </div>
      )}
    </div>
  );
}
