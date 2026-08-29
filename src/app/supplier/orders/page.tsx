"use client";

import { useState } from "react";
import { Search, MoreVertical, Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_ORDERS = [
  { id: "#ORD-8901", date: "28 Aout 2026", customer: "Alice D.", total: "280,000 FCFA", status: "Livrée", items: 1 },
  { id: "#ORD-8902", date: "28 Aout 2026", customer: "Jean M.", total: "45,000 FCFA", status: "En attente", items: 1 },
  { id: "#ORD-8903", date: "27 Aout 2026", customer: "Sarah K.", total: "90,000 FCFA", status: "Expédiée", items: 2 },
  { id: "#ORD-8904", date: "25 Aout 2026", customer: "Paul B.", total: "15,000 FCFA", status: "Annulée", items: 1 },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Livrée":
      return <span className="flex items-center space-x-1 text-green-400 bg-green-400/10 px-2 py-1 rounded-md text-xs font-medium"><CheckCircle size={12} /><span>Livrée</span></span>;
    case "En attente":
      return <span className="flex items-center space-x-1 text-orange-400 bg-orange-400/10 px-2 py-1 rounded-md text-xs font-medium"><Clock size={12} /><span>En attente</span></span>;
    case "Expédiée":
      return <span className="flex items-center space-x-1 text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md text-xs font-medium"><Truck size={12} /><span>Expédiée</span></span>;
    case "Annulée":
      return <span className="flex items-center space-x-1 text-red-400 bg-red-400/10 px-2 py-1 rounded-md text-xs font-medium"><XCircle size={12} /><span>Annulée</span></span>;
    default:
      return <span className="text-gray-400 bg-white/10 px-2 py-1 rounded-md text-xs font-medium">{status}</span>;
  }
};

export default function SupplierOrdersPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Commandes</h1>
          <p className="text-sm text-gray-400">Suivez et gérez les commandes de vos clients.</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par ID ou client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm transition-all"
            />
          </div>
          <div className="flex space-x-2">
            <select className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="shipped">Expédiée</option>
              <option value="delivered">Livrée</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/20 text-gray-400">
              <tr>
                <th className="px-6 py-4">ID Commande</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Articles</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ORDERS.map((order, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={order.id} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white">{order.id}</td>
                  <td className="px-6 py-4">{order.date}</td>
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4 flex items-center space-x-2">
                    <Package size={14} className="text-gray-400" />
                    <span>{order.items}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{order.total}</td>
                  <td className="px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
