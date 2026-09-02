"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wifi, Users, DollarSign, Activity } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import RevenueAreaChart from "@/components/charts/RevenueAreaChart";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrency } from "@/context/CurrencyContext";

export default function ConnectDashboard() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  
  const [stats, setStats] = useState({
    activeServices: 0,
    totalSubscriptions: 0,
    monthlyRevenue: 0,
    networkStatus: 100, // percentage
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // TODO: Implémenter les requêtes Firestore pour Connect
    // Pour l'instant, données simulées
    setTimeout(() => {
      setStats({
        activeServices: 3,
        totalSubscriptions: 42,
        monthlyRevenue: 1250,
        networkStatus: 98,
      });
      setLoading(false);
    }, 1000);
    
  }, [user]);

  const KPIS = [
    { title: "Services Actifs", value: stats.activeServices.toString(), subtitle: "Réseau", subInfo: "Gérer les offres", icon: Wifi },
    { title: "Abonnements", value: stats.totalSubscriptions.toString(), subtitle: "Clients", subInfo: "Abonnés actifs", icon: Users },
    { title: "Revenus", value: formatPrice(stats.monthlyRevenue), subtitle: "Ce mois", subInfo: "Facturation récurrente", icon: DollarSign },
    { title: "Disponibilité", value: `${stats.networkStatus}%`, subtitle: "Uptime", subInfo: "État du réseau", icon: Activity },
  ];

  if (loading) {
    return <div className="text-white animate-pulse">Chargement de votre réseau...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Row KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {KPIS.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-emerald-500/10 transition-colors shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-colors" />
              <div className="flex justify-between items-start relative z-10">
                <h3 className="text-sm font-semibold text-gray-300">{kpi.title}</h3>
                <Icon size={16} className="text-emerald-500" />
              </div>
              <div className="mt-2 relative z-10">
                <div className="text-3xl font-bold text-white">{kpi.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">{kpi.subtitle}</div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-400 relative z-10">
                <span>{kpi.subInfo}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-sm text-center py-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <Wifi size={48} className="mx-auto text-emerald-500/50 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2 relative z-10">Tableau de Bord Réseau en construction</h2>
        <p className="text-gray-400 max-w-md mx-auto relative z-10">
          L'interface détaillée pour gérer vos services internet, vos abonnements et la bande passante sera bientôt disponible ici.
        </p>
      </div>
    </div>
  );
}
