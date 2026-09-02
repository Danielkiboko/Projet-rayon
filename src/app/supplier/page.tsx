"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Info, Circle, Home, Users, DollarSign, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import RevenueAreaChart from "@/components/charts/RevenueAreaChart";
import StatusPieChart from "@/components/charts/StatusPieChart";
import { collection, query, where, onSnapshot, getDocs, limit, orderBy, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Helper pour grouper les paiements par date
const groupPaymentsByDate = (payments: any[]) => {
  const result: Record<string, number> = {};
  payments.forEach(payment => {
    if (!payment.createdAt) return;
    const dateObj = new Date((payment.createdAt.seconds || payment.createdAt._seconds) * 1000);
    const dateStr = dateObj.toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' });
    if (!result[dateStr]) result[dateStr] = 0;
    result[dateStr] += payment.amount || 0;
  });
  
  return Object.keys(result).map(key => ({
    name: key,
    total: result[key]
  })).reverse();
};

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
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch payments for revenue chart
    const fetchPayments = async () => {
      try {
        const qPayments = query(
          collection(db, "payments"),
          where("supplierId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const snapshot = await getDocs(qPayments);
        const fetchedPayments: any[] = [];
        snapshot.forEach(doc => {
          if(doc.data().status === "COMPLETED") {
             fetchedPayments.push(doc.data());
          }
        });
        setRevenueData(groupPaymentsByDate(fetchedPayments));
      } catch (error) {
        console.error("Error fetching payments for chart:", error);
      }
    };
    
    fetchPayments();

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

    // 3. Fetch Visits for this supplier
    const qVisits = query(
      collection(db, "visits"),
      where("supplierId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubVisits = onSnapshot(qVisits, (snapshot) => {
      const visitsData: any[] = [];
      snapshot.forEach(doc => {
        visitsData.push({ id: doc.id, ...doc.data() });
      });
      setVisits(visitsData);
    });

    return () => {
      unsubProps();
      unsubTenants();
      unsubVisits();
    };
  }, [user]);

  const handleApproveVisit = async (visit: any) => {
    if (confirm("Confirmer et valider cette visite ?")) {
      try {
        await updateDoc(doc(db, "visits", visit.id), {
          status: "APPROVED"
        });

        // Trigger notification to the visitor
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'VISIT_VALIDATED',
            data: {
              visitorPhone: visit.visitorPhone,
              visitorName: visit.visitorName,
              propertyTitle: visit.propertyTitle,
              requestedDate: visit.requestedDate,
              visitorCoords: visit.visitorCoords || null,
              propertyCoords: visit.propertyCoords || null
            }
          })
        });

        alert("Visite validée avec succès ! Le client a été notifié.");
      } catch (error) {
        console.error("Erreur validation visite", error);
        alert("Erreur lors de la validation.");
      }
    }
  };

  // Calcul du taux d'occupation
  const occupancyRate = stats.totalUnits > 0 
    ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) 
    : 0;

  const occupancyData = [
    { name: "Occupées", value: stats.occupiedUnits },
    { name: "Disponibles", value: Math.max(0, stats.totalUnits - stats.occupiedUnits) }
  ];

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

      {/* Main Content Split - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Charts) */}
        <div className="lg:col-span-2 space-y-6">
          <RevenueAreaChart data={revenueData} title="Évolution des Encaissements (30 j)" color="#10b981" />
        </div>

        {/* Right Column (Pie Chart & Actions) */}
        <div className="space-y-6">
          
          <StatusPieChart data={occupancyData} title="Taux d'Occupation" />
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

      {/* Visits Section */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-white mb-6">Demandes de Visites ({visits.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                <th className="p-4 rounded-tl-xl">Client</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Propriété</th>
                <th className="p-4">Date Souhaitée</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-300">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">
                    Aucune demande de visite pour le moment.
                  </td>
                </tr>
              ) : (
                visits.map((visit) => (
                  <tr key={visit.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold text-white">{visit.visitorName}</td>
                    <td className="p-4">{visit.visitorPhone}</td>
                    <td className="p-4 text-blue-400">{visit.propertyTitle}</td>
                    <td className="p-4">{visit.requestedDate || "Non spécifiée"}</td>
                    <td className="p-4">
                      {visit.status === "PENDING" ? (
                        <span className="inline-flex px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs font-semibold uppercase tracking-wider">
                          En attente
                        </span>
                      ) : visit.status === "APPROVED" ? (
                        <span className="inline-flex px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-semibold uppercase tracking-wider">
                          Validée
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 bg-gray-500/10 text-gray-400 rounded text-xs font-semibold uppercase tracking-wider">
                          {visit.status}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {visit.status === "PENDING" && (
                        <button 
                          onClick={() => handleApproveVisit(visit)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                        >
                          Valider
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
