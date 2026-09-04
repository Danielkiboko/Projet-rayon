"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Users, DollarSign, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import RevenueAreaChart from "@/components/charts/RevenueAreaChart";
import StatusPieChart from "@/components/charts/StatusPieChart";
import { collection, query, where, onSnapshot, getDocs, limit, orderBy, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import KpiGrid from "./shared/KpiGrid";
import ActionCard from "./shared/ActionCard";

import GenericDashboard, { KpiConfig, ActionConfig } from "./shared/GenericDashboard";

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

export default function ImmoDashboard() {
  const { user, userData } = useAuth();
  
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalTenants: 0,
    totalRent: 0,
    lateRents: 0,
    lateRentAmount: 0,
    formerTenantsDebt: 0,
    occupiedUnits: 0,
    totalUnits: 0,
  });

  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch payments
    const qPayments = query(
      collection(db, "payments"),
      where("supplierId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const fetchedPayments: any[] = [];
      let sumCollected = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        if(data.status === "COMPLETED") {
           fetchedPayments.push(data);
           sumCollected += data.amount || 0;
        }
      });
      setRevenueData(groupPaymentsByDate(fetchedPayments));
      setTotalCollected(sumCollected);
    });

    // 1. Fetch Properties
    const qProps = query(collection(db, "properties"), where("supplierId", "==", user.uid));
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

    const qTenants = query(collection(db, "tenants"), where("supplierId", "==", user.uid));
    const unsubTenants = onSnapshot(qTenants, (snapshot) => {
      let activeTenants = 0;
      let totalRent = 0;
      let lateRents = 0;
      let lateRentAmount = 0;
      let formerTenantsDebt = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === "PARTI") {
          formerTenantsDebt += (data.debtAmount || 0);
        } else {
          activeTenants++;
          totalRent += (data.rentAmount || 0);
          
          let isLate = false;
          if (data.status === "LATE" || data.status === "En retard") {
             isLate = true;
          } else if (data.nextPayment) {
             const paymentDate = new Date(data.nextPayment);
             const today = new Date();
             paymentDate.setHours(0, 0, 0, 0);
             today.setHours(0, 0, 0, 0);
             if (paymentDate < today) {
               isLate = true;
             }
          }
          
          if (isLate) {
             lateRents++;
             lateRentAmount += (data.rentAmount || 0);
          }
        }
      });

      setStats(prev => ({ 
        ...prev, 
        totalTenants: activeTenants, 
        totalRent,
        lateRents,
        lateRentAmount,
        formerTenantsDebt,
        occupiedUnits: activeTenants
      }));
      setLoading(false);
    });

    // 3. Fetch Visits
    const qVisits = query(collection(db, "visits"), where("supplierId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsubVisits = onSnapshot(qVisits, (snapshot) => {
      const visitsData: any[] = [];
      snapshot.forEach(doc => {
        visitsData.push({ id: doc.id, ...doc.data() });
      });
      setVisits(visitsData);
    });

    return () => {
      unsubPayments();
      unsubProps();
      unsubTenants();
      unsubVisits();
    };
  }, [user]);

  const handleApproveVisit = async (visit: any) => {
    if (confirm("Confirmer et valider cette visite ?")) {
      try {
        await updateDoc(doc(db, "visits", visit.id), { status: "APPROVED" });
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

  const handleChatWithClient = async (visit: any) => {
    if (!visit.clientId) {
      alert("Ce client n'a pas de compte associé.");
      return;
    }
    try {
      const q = query(collection(db, "chats"), where("clientId", "==", visit.clientId), where("supplierId", "==", user?.uid));
      const snap = await getDocs(q);
      if (snap.empty) {
        await import("firebase/firestore").then(async ({ addDoc, serverTimestamp }) => {
          await addDoc(collection(db, "chats"), {
            clientId: visit.clientId,
            supplierId: user?.uid,
            propertyTitle: visit.propertyTitle,
            lastMessage: "",
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp()
          });
        });
      }
      window.location.href = '/supplier/messages';
    } catch (error) {
      console.error("Erreur création chat", error);
    }
  };

  const rawOccupancyRate = stats.totalUnits > 0 ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 0;
  const occupancyRate = Math.min(rawOccupancyRate, 100);

  const occupancyData = [
    { name: "Occupées", value: stats.occupiedUnits },
    { name: "Disponibles", value: Math.max(0, stats.totalUnits - stats.occupiedUnits) }
  ];

  const KPIS: KpiConfig[] = [
    { title: "Propriétés", value: stats.totalProperties.toString(), subtitle: "Total enregistrées", subInfo: "Gérez votre parc", icon: Home },
    { title: "Gain Prévu (Actifs)", value: `$${stats.totalRent.toFixed(2)}`, subtitle: `${stats.totalTenants} Locataires Actifs`, subInfo: "Taux d'occupation: " + occupancyRate + "%", icon: Users },
    { title: "Gain Reçu", value: `$${totalCollected.toFixed(2)}`, subtitle: "Cumul encaissé", subInfo: "Gains réels de l'exploitation", icon: DollarSign },
    { title: "Pertes & Dettes", value: `$${(stats.lateRentAmount + stats.formerTenantsDebt).toFixed(2)}`, subtitle: `${stats.lateRents} retard(s) + Anciens`, subInfo: (stats.lateRentAmount + stats.formerTenantsDebt) > 0 ? "Envoyez des relances" : "Tout est à jour", icon: AlertCircle, alertCondition: (stats.lateRentAmount + stats.formerTenantsDebt) > 0 },
  ];

  const actions: ActionConfig[] = [
    {
      title: "Ajouter un bien immobilier",
      description: "Mettez en location de nouveaux appartements, immeubles ou bureaux.",
      buttonText: "Créer une offre",
      onClick: () => window.location.href = '/supplier/properties',
      isPrimary: true
    },
    {
      title: "Générer une facture",
      description: "Créez rapidement une facture ou un proforma pour vos locataires en format PDF.",
      buttonText: "Créer une facture",
      onClick: () => window.location.href = '/supplier/invoices',
      isPrimary: false
    }
  ];

  return (
    <GenericDashboard
      loading={loading}
      moduleName="parc immobilier"
      kpis={KPIS}
      chartData={revenueData}
      chartTitle="Évolution des Encaissements (30 j)"
      chartColor="#f59e0b"
      actionsTitle="Gérer mon parc"
      actions={actions}
      rightColumnExtra={<StatusPieChart data={occupancyData} title="Taux d'Occupation" />}
      bottomExtra={
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
                      <td className="p-4 text-amber-500">{visit.propertyTitle}</td>
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
                      <td className="p-4 text-right space-x-2">
                        {visit.status === "PENDING" && (
                          <button 
                            onClick={() => handleApproveVisit(visit)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                          >
                            Valider
                          </button>
                        )}
                        {visit.clientId && (
                          <button 
                            onClick={() => handleChatWithClient(visit)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm inline-flex items-center"
                          >
                            Discuter
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
      }
    />
  );
}

