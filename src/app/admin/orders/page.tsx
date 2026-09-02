"use client";

import { useState, useEffect } from "react";
import { Search, Package, Clock, CheckCircle, Truck, XCircle, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

interface Order {
  id: string;
  clientId: string;
  clientPhone?: string;
  clientAddress?: string;
  items: any[];
  itemsTotal: number;
  total: number;
  status: string;
  createdAt: any;
}

const getStatusBadge = (status: string) => {
  const normalized = status.toUpperCase();
  switch (normalized) {
    case "LIVRÉE":
    case "DELIVERED":
    case "COMPLETED":
      return <span className="flex w-max items-center space-x-1 text-green-400 bg-green-400/10 px-2 py-1 rounded-md text-xs font-medium"><CheckCircle size={12} /><span>Livrée</span></span>;
    case "EN_ATTENTE":
    case "PENDING":
      return <span className="flex w-max items-center space-x-1 text-orange-400 bg-orange-400/10 px-2 py-1 rounded-md text-xs font-medium"><Clock size={12} /><span>En attente</span></span>;
    case "EXPÉDIÉE":
    case "SHIPPED":
      return <span className="flex w-max items-center space-x-1 text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md text-xs font-medium"><Truck size={12} /><span>Expédiée</span></span>;
    case "ANNULÉE":
    case "CANCELLED":
      return <span className="flex w-max items-center space-x-1 text-red-400 bg-red-400/10 px-2 py-1 rounded-md text-xs font-medium"><XCircle size={12} /><span>Annulée</span></span>;
    default:
      return <span className="w-max text-gray-400 bg-white/10 px-2 py-1 rounded-md text-xs font-medium">{status}</span>;
  }
};

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Order[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(o => {
    const searchMatch = o.id.toLowerCase().includes(search.toLowerCase()) || 
                       (o.clientPhone && o.clientPhone.includes(search));
    
    const normalizedStatus = (o.status || "").toUpperCase();
    let statusMatch = true;
    if (filter === "pending") statusMatch = normalizedStatus === "EN_ATTENTE" || normalizedStatus === "PENDING";
    if (filter === "shipped") statusMatch = normalizedStatus === "EXPÉDIÉE" || normalizedStatus === "SHIPPED";
    if (filter === "delivered") statusMatch = normalizedStatus === "LIVRÉE" || normalizedStatus === "DELIVERED" || normalizedStatus === "COMPLETED";

    return searchMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Toutes les Commandes</h1>
          <p className="text-sm text-gray-400">Supervision globale des commandes passées sur la plateforme.</p>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Rechercher par ID ou numéro de client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#121212] border border-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm transition-all"
            />
          </div>
          <div className="flex space-x-2">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#121212] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-[#0b061c]"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="shipped">Expédiée</option>
              <option value="delivered">Livrée</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-[#121212] text-gray-400">
              <tr>
                <th className="px-6 py-4">ID Commande</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Détail des Articles</th>
                <th className="px-6 py-4">Total Payé</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Chargement des commandes...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 flex flex-col items-center">
                    <ShoppingBag size={48} className="mb-4 text-gray-600 opacity-50" />
                    Aucune commande sur la plateforme.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => {
                  const itemsCount = order.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0;
                  const total = order.total || order.itemsTotal || 0;

                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={order.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white truncate max-w-[120px]">{order.id}</td>
                      <td className="px-6 py-4">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("fr-FR") : "Date inconnue"}
                      </td>
                      <td className="px-6 py-4 truncate max-w-[150px]">{order.clientPhone || order.clientId}</td>
                      <td className="px-6 py-4 flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <Package size={14} className="text-gray-400" />
                          <span>{itemsCount} produit(s)</span>
                        </div>
                        {order.items?.map((item, idx) => (
                          <span key={idx} className="text-xs text-gray-500 truncate max-w-[150px]">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{total.toLocaleString()} FC</td>
                      <td className="px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
