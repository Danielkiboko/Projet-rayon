"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, ShoppingCart, DollarSign, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import RevenueAreaChart from "@/components/charts/RevenueAreaChart";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCurrency } from "@/context/CurrencyContext";

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

export default function ConnectDashboard() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingDeliveries: 0,
  });

  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch Products Count
    const qProps = query(
      collection(db, "products"),
      where("supplierId", "==", user.uid)
    );
    const unsubProducts = onSnapshot(qProps, (snapshot) => {
      setStats(prev => ({ ...prev, totalProducts: snapshot.size }));
    });

    // Fetch Orders & Revenue
    const qOrders = query(
      collection(db, "orders"),
      where("supplierId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      let active = 0;
      let pending = 0;
      let revenue = 0;
      const ordersData: any[] = [];
      const paymentsForChart: any[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        ordersData.push({ id: doc.id, ...data });

        if (data.status === "COMPLETED") {
          revenue += (data.itemsTotal || 0);
          paymentsForChart.push({
            createdAt: data.createdAt,
            amount: data.itemsTotal || 0
          });
        } else {
          active++;
          if (data.status === "PENDING" || data.status === "CONFIRMED_AWAITING_DRIVER") {
            pending++;
          }
        }
      });

      setStats(prev => ({ 
        ...prev, 
        activeOrders: active,
        pendingDeliveries: pending,
        totalRevenue: revenue
      }));
      
      setRecentOrders(ordersData.slice(0, 5)); // Last 5 orders
      setRevenueData(groupPaymentsByDate(paymentsForChart));
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [user]);

  const KPIS = [
    { title: "Matériels en Vente", value: stats.totalProducts.toString(), subtitle: "Catalogue", subInfo: "Gérer le catalogue", icon: Package },
    { title: "Commandes Actives", value: stats.activeOrders.toString(), subtitle: "En cours", subInfo: "À traiter", icon: ShoppingCart },
    { title: "Chiffre d'affaires", value: formatPrice(stats.totalRevenue), subtitle: "Total", subInfo: "Revenus bruts", icon: DollarSign },
    { title: "À Expédier", value: stats.pendingDeliveries.toString(), subtitle: "Action requise", subInfo: stats.pendingDeliveries > 0 ? "Préparer les colis" : "Tout est expédié", icon: Truck },
  ];

  if (loading) {
    return <div className="text-white animate-pulse">Chargement de votre boutique Tech...</div>;
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
                <Icon size={16} className={kpi.title === "À Expédier" && stats.pendingDeliveries > 0 ? "text-orange-500" : "text-emerald-500"} />
              </div>
              <div className="mt-2 relative z-10">
                <div className={`text-3xl font-bold ${kpi.title === "À Expédier" && stats.pendingDeliveries > 0 ? "text-orange-500" : "text-white"}`}>{kpi.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">{kpi.subtitle}</div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-400 relative z-10">
                <span>{kpi.subInfo}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Charts) */}
        <div className="lg:col-span-2 space-y-6">
          <RevenueAreaChart data={revenueData} title="Évolution des Ventes Tech (30 j)" color="#10b981" />
          
          {/* Recent Orders Section */}
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-white mb-6">Commandes Récentes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                    <th className="p-4 rounded-tl-xl">ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Montant</th>
                    <th className="p-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-300">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">
                        Aucune commande récente.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-semibold text-white">#{order.id.slice(0,6).toUpperCase()}</td>
                        <td className="p-4">{order.createdAt ? new Date((order.createdAt as any).seconds * 1000).toLocaleDateString() : "-"}</td>
                        <td className="p-4">{order.clientName || order.clientPhone}</td>
                        <td className="p-4 font-bold text-emerald-400">{formatPrice(order.itemsTotal)}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                            order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 
                            order.status === 'PENDING' ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Actions) */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
            <h2 className="text-base font-semibold text-white mb-4 text-center relative z-10">Gérer ma boutique Tech</h2>
            
            <div className="relative z-10 bg-white/5 rounded-xl p-4 border border-white/5 hover:border-emerald-500/20 transition-colors mb-4 cursor-pointer" onClick={() => window.location.href='/supplier/products'}>
              <h3 className="text-sm font-semibold text-white mb-2">Ajouter du matériel</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Mettez en vente de nouveaux équipements (Starlink, etc.).
              </p>
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors w-full">
                Créer un produit
              </button>
            </div>

            <div className="relative z-10 bg-white/5 rounded-xl p-4 border border-white/5 hover:border-emerald-500/20 transition-colors cursor-pointer" onClick={() => window.location.href='/supplier/orders'}>
              <h3 className="text-sm font-semibold text-white mb-2">Voir les expéditions</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Consultez les commandes en attente d'expédition par un livreur.
              </p>
              <button className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors w-full">
                Gérer les commandes
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
