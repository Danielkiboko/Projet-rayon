"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Truck, 
  DollarSign, 
  Package, 
  ChevronRight, 
  ShieldAlert,
  Users
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useCurrency } from "@/context/CurrencyContext";

export default function AdminDashboardPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  
  // Protect route for Super Admin and authorized SUB_ADMINs
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        const isSuperAdmin = user.email === "danielkiboko218@gmail.com";
        const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN" && userData?.permissions?.canViewDashboard;
        
        if (!isSuperAdmin && !isAuthorizedSubAdmin) {
          router.push("/");
        }
      }
    }
  }, [user, userData, loading, router]);

  // Fetch all orders
  useEffect(() => {
    if (!user) return;
    const isSuperAdmin = user.email === "danielkiboko218@gmail.com";
    const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN" && userData?.permissions?.canViewDashboard;
    if (!isSuperAdmin && !isAuthorizedSubAdmin) return;

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let revenue = 0;
      let active = 0;
      const fetchedOrders: Record<string, unknown>[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedOrders.push({ id: doc.id, ...data });
        
        if (data.status === "COMPLETED") {
          revenue += (data.itemsTotal || 0) + (data.feePaid || 0);
        } else {
          active++;
        }
      });
      
      setOrders(fetchedOrders);
      setTotalRevenue(revenue);
      setActiveOrdersCount(active);
    });

    return () => unsubscribe();
  }, [user]);

  const isSuperAdmin = user?.email === "danielkiboko218@gmail.com";
  const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN" && userData?.permissions?.canViewDashboard;

  if (loading || !user || (!isSuperAdmin && !isAuthorizedSubAdmin)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-white flex flex-col items-center">
          <ShieldAlert size={48} className="text-gray-500 mb-4 animate-pulse" />
          <p>Vérification des accès sécurisés...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED_AWAITING_DRIVER":
        return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded-md">En attente Livreur</span>;
      case "ACCEPTED":
        return <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-md">En transit</span>;
      case "ARRIVED_AWAITING_PAYMENT":
        return <span className="px-2 py-1 bg-purple-500/10 text-purple-500 text-xs font-bold rounded-md">Arrivé - Attente Paiement</span>;
      case "COMPLETED":
        return <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-md">Terminé</span>;
      default:
        return <span className="px-2 py-1 bg-white/10 text-gray-300 text-xs font-bold rounded-md">{status}</span>;
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Vue Globale</h2>
        <p className="text-gray-400 mt-1 text-sm">Statistiques en temps réel et performances de la plateforme.</p>
      </div>

      {/* Premium KPI Cards (Anantya Style adapted to Dark Mode) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-[#1a1a1a] p-5 rounded-2xl shadow-sm border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="relative z-10 flex flex-col h-32 justify-between">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-semibold text-gray-300">Chiffre d&apos;affaires</h3>
              <DollarSign size={16} className="text-green-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{formatPrice(totalRevenue)}</p>
              <div className="mt-2 text-xs text-gray-500 font-medium uppercase tracking-wider">Total</div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#1a1a1a] p-5 rounded-2xl shadow-sm border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="relative z-10 flex flex-col h-32 justify-between">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-semibold text-gray-300">Commandes Actives</h3>
              <Package size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{activeOrdersCount}</p>
              <div className="mt-2 text-xs text-gray-500 font-medium uppercase tracking-wider">En cours</div>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#1a1a1a] p-5 rounded-2xl shadow-sm border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="relative z-10 flex flex-col h-32 justify-between">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-semibold text-gray-300">Livreurs</h3>
              <Truck size={16} className="text-orange-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">--</p>
              <div className="mt-2 text-xs text-gray-500 font-medium uppercase tracking-wider">Total</div>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#1a1a1a] p-5 rounded-2xl shadow-sm border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
          <div className="relative z-10 flex flex-col h-32 justify-between">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-semibold text-gray-300">Fournisseurs</h3>
              <Users size={16} className="text-purple-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">--</p>
              <div className="mt-2 text-xs text-gray-500 font-medium uppercase tracking-wider">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Orders Table */}
      <div className="bg-[#1a1a1a] rounded-2xl shadow-sm border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-base font-semibold text-white">Dernières Commandes</h3>
          <button className="text-sm font-medium text-blue-500 hover:text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors">
            Voir tout
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                <th className="p-4">ID Commande</th>
                <th className="p-4">Date</th>
                <th className="p-4">Client (Tél)</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-300">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">
                    Aucune commande n&apos;a été passée pour le moment.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4 font-semibold text-white">#{order.id.slice(0, 6).toUpperCase()}</td>
                    <td className="p-4 text-gray-400">
                      {order.createdAt ? new Date((order.createdAt as { seconds: number }).seconds * 1000).toLocaleString('fr-FR') : "À l'instant"}
                    </td>
                    <td className="p-4">{order.clientPhone as string}</td>
                    <td className="p-4 font-bold text-white">{formatPrice(order.itemsTotal as number)}</td>
                    <td className="p-4">{getStatusBadge(order.status as string)}</td>
                    <td className="p-4 text-right">
                      <button className="text-gray-400 hover:text-blue-500 font-medium flex items-center justify-end w-full group-hover:translate-x-1 transition-all">
                        Détails <ChevronRight size={16} className="ml-1" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
