"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Info, Circle, Home, Users, DollarSign, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function SupplierDashboard() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalTenants: 0,
    totalRent: 0,
    lateRents: 0,
    occupiedUnits: 0,
    totalUnits: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Properties to calculate total capacity and occupied units
    const qProps = query(
      collection(db, "products"),
      where("supplierId", "==", user.uid),
      where("category", "==", "immo")
    );

    const unsubProps = onSnapshot(qProps, (snapshot) => {
      let totalUnits = 0;
      let propertiesCount = snapshot.size;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.immoDetails?.levels) {
          data.immoDetails.levels.forEach((lvl: any) => {
            if (lvl.units) {
              lvl.units.forEach((unit: any) => {
                totalUnits += (unit.capacity || 1);
              });
            }
          });
        } else {
          totalUnits += (data.stock || 1);
        }
      });

      setStats(prev => ({ ...prev, totalProperties: propertiesCount, totalUnits }));
    });

    // 2. Fetch Tenants to calculate active tenants, expected rent, and late payments
    const qTenants = query(
      collection(db, "tenants"),
      where("supplierId", "==", user.uid)
    );

    const unsubTenants = onSnapshot(qTenants, (snapshot) => {
      let activeTenants = 0;
      let totalRent = 0;
      let lateRents = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Count active tenants
        if (data.status === "ACTIVE" || data.status === "LATE") {
          activeTenants++;
          totalRent += (data.rentAmount || 0);
        }
        if (data.status === "LATE") {
          lateRents++;
        }
      });

      setStats(prev => ({ 
        ...prev, 
        totalTenants: activeTenants, 
        totalRent,
        lateRents,
        occupiedUnits: activeTenants
      }));
      setLoading(false);
    });

    return () => {
      unsubProps();
      unsubTenants();
    };
  }, [user]);

  // Calcul du taux d'occupation
  const occupancyRate = stats.totalUnits > 0 
    ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) 
    : 0;

  const KPIS = [
    { title: "Propriétés", value: stats.totalProperties.toString(), subtitle: "Total enregistrées", subInfo: "Gérez votre parc", icon: Home },
    { title: "Locataires Actifs", value: stats.totalTenants.toString(), subtitle: "Total", subInfo: "Taux d'occupation: " + occupancyRate + "%", icon: Users },
    { title: "Loyers Attendus", value: `$${stats.totalRent}`, subtitle: "Ce mois", subInfo: "Chiffre d'affaires mensuel", icon: DollarSign },
    { title: "Loyers en Retard", value: stats.lateRents.toString(), subtitle: "Action requise", subInfo: stats.lateRents > 0 ? "Envoyez des relances" : "Tout est à jour", icon: AlertCircle },
  ];

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
              className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-32 hover:border-white/10 transition-colors shadow-sm"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-semibold text-gray-300">{kpi.title}</h3>
                <Icon size={16} className={kpi.title === "Loyers en Retard" && stats.lateRents > 0 ? "text-red-500" : "text-gray-500"} />
              </div>
              <div className="mt-2">
                <div className={`text-3xl font-bold ${kpi.title === "Loyers en Retard" && stats.lateRents > 0 ? "text-red-500" : "text-white"}`}>{kpi.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">{kpi.subtitle}</div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-400">
                <span>{kpi.subInfo}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Charts & Analysis) - Takes 2 cols on large screens */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-sm min-h-[320px] flex flex-col"
          >
            <h2 className="text-base font-semibold text-white mb-6 text-center">Taux d'Occupation</h2>
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10">
              {/* Donut Chart Simulation */}
              <div 
                className="relative w-48 h-48 rounded-full border-[16px] shadow-inner flex items-center justify-center"
                style={{
                  borderColor: '#1f2937', // Default gray
                  borderTopColor: occupancyRate > 0 ? '#3b82f6' : '#1f2937',
                  borderRightColor: occupancyRate > 25 ? '#3b82f6' : '#1f2937',
                  borderBottomColor: occupancyRate > 50 ? '#10b981' : '#1f2937',
                  borderLeftColor: occupancyRate > 75 ? '#10b981' : '#1f2937',
                }}
              >
                <span className="text-2xl font-bold text-white">{occupancyRate}%</span>
              </div>
              
              {/* Chart Legend */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <Circle size={10} className="text-[#3b82f6] fill-[#3b82f6]" /> 
                  <span>Unités Occupées ({stats.occupiedUnits})</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <Circle size={10} className="text-[#4b5563] fill-[#4b5563]" /> 
                  <span>Unités Disponibles ({Math.max(0, stats.totalUnits - stats.occupiedUnits)})</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column (Setup & Recommendations) */}
        <div className="space-y-6">
          {/* Action Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-base font-semibold text-white mb-4 text-center">Gérer mon parc</h2>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors mb-4 cursor-pointer" onClick={() => window.location.href='/supplier/properties'}>
              <h3 className="text-sm font-semibold text-white mb-2">Ajouter un bien immobilier</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Mettez en location de nouveaux appartements, immeubles ou bureaux.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors w-full">
                Créer une offre
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors cursor-pointer" onClick={() => window.location.href='/supplier/invoices'}>
              <h3 className="text-sm font-semibold text-white mb-2">Générer une facture</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Créez rapidement une facture ou un proforma pour vos locataires en format PDF.
              </p>
              <button className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors w-full">
                Créer une facture
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
