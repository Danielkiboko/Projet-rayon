"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  DollarSign, 
  Package, 
  ChevronRight, 
  LogOut,
  ShieldAlert
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function AdminDashboardPage() {
  const { user, userData, loading, signOut } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
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
      const fetchedOrders: any[] = [];
      
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
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
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-md">En attente Livreur</span>;
      case "ACCEPTED":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">En transit</span>;
      case "ARRIVED_AWAITING_PAYMENT":
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-md">Arrivé - Attente Paiement</span>;
      case "COMPLETED":
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-md">Terminé</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-md">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row font-sans text-gray-900">
      
      {/* Sidebar - Sleek Dark Mode */}
      <div className="w-full md:w-72 bg-[#0A0A0A] text-white flex flex-col shadow-2xl z-10 relative">
        <div className="p-8 border-b border-white/10">
          <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            RAYON<span className="text-blue-500">.</span>
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-widest">Admin Control</p>
        </div>
        
        <nav className="p-6 flex-1 space-y-3">
          <Link href="/admin/dashboard" className="flex items-center px-4 py-3.5 bg-blue-600/10 text-blue-500 rounded-xl font-bold border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all">
            <LayoutDashboard size={20} className="mr-4" /> Dashboard
          </Link>
          {(isSuperAdmin || userData?.permissions?.canManageProducts) && (
            <Link href="/admin/products" className="flex items-center px-4 py-3.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium group">
              <Package size={20} className="mr-4 group-hover:scale-110 transition-transform" /> Produits
            </Link>
          )}
          {(isSuperAdmin || userData?.permissions?.canManageDelivery) && (
            <Link href="/admin/delivery/create" className="flex items-center px-4 py-3.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium group">
              <Truck size={20} className="mr-4 group-hover:scale-110 transition-transform" /> Créer un Livreur
            </Link>
          )}
          {isSuperAdmin && (
            <Link href="/admin/team" className="flex items-center px-4 py-3.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium group">
              <ShieldAlert size={20} className="mr-4 group-hover:scale-110 transition-transform" /> Équipe (Sous-Admins)
            </Link>
          )}
          <div className="flex items-center px-4 py-3.5 text-gray-600 rounded-xl font-medium cursor-not-allowed">
            <Users size={20} className="mr-4" /> Fournisseurs (Bientôt)
          </div>
        </nav>

        <div className="p-6 border-t border-white/10 bg-white/5">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold shadow-lg text-white mr-4">
              D
            </div>
            <div>
              <p className="text-sm font-bold text-white">{userData?.name || "Admin"}</p>
              <p className="text-xs text-blue-400 font-medium">{isSuperAdmin ? "Super Admin" : "Sous-Admin"}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-bold text-gray-300 bg-white/5 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-white/5 hover:border-red-500"
          >
            <LogOut size={16} className="mr-2" /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#F8F9FA]">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Vue Globale</h2>
            <p className="text-gray-500 mt-1">Statistiques en temps réel et performances de la plateforme.</p>
          </div>

          {/* Premium KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-500/30">
                    <DollarSign size={24} strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Chiffre d'affaires</p>
                  <p className="text-4xl font-black text-gray-900">{totalRevenue.toFixed(2)} <span className="text-lg text-gray-400">AED</span></p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/30">
                    <Package size={24} strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Commandes Actives</p>
                  <p className="text-4xl font-black text-gray-900">{activeOrdersCount}</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/30">
                    <Truck size={24} strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Livreurs (Total)</p>
                  <p className="text-4xl font-black text-gray-900">--</p>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-500 text-white rounded-2xl shadow-lg shadow-purple-500/30">
                    <Users size={24} strokeWidth={2.5} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Fournisseurs</p>
                  <p className="text-4xl font-black text-gray-900">--</p>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Orders Table */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-black text-gray-900">Dernières Commandes</h3>
              <button className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl transition-colors">
                Voir tout
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-bold">
                    <th className="p-5">ID Commande</th>
                    <th className="p-5">Date</th>
                    <th className="p-5">Client (Tél)</th>
                    <th className="p-5">Montant</th>
                    <th className="p-5">Statut</th>
                    <th className="p-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-400 font-medium">
                        Aucune commande n'a été passée pour le moment.
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors group">
                        <td className="p-5 font-bold text-gray-900">#{order.id.slice(0, 6).toUpperCase()}</td>
                        <td className="p-5 text-gray-500 font-medium">
                          {order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString('fr-FR') : "À l'instant"}
                        </td>
                        <td className="p-5 text-gray-900 font-medium">{order.clientPhone}</td>
                        <td className="p-5 font-black text-gray-900">{order.itemsTotal} <span className="text-xs text-gray-400 font-bold">AED</span></td>
                        <td className="p-5">{getStatusBadge(order.status)}</td>
                        <td className="p-5 text-right">
                          <button className="text-gray-400 hover:text-blue-600 font-bold flex items-center justify-end w-full group-hover:translate-x-1 transition-all">
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

        </div>
      </div>
    </div>
  );
}
