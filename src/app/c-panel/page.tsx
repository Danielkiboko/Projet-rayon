"use client";

import { motion } from "framer-motion";
import { Users, Store, ShoppingCart, TrendingUp, Truck } from "lucide-react";

const STATS = [
  { name: "Ventes du jour", value: "245,000 FCFA", icon: TrendingUp, color: "text-green-400", bg: "bg-green-400/10" },
  { name: "Commandes Actives", value: "12", icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-400/10" },
  { name: "Fournisseurs", value: "45", icon: Store, color: "text-purple-400", bg: "bg-purple-400/10" },
  { name: "Livreurs Actifs", value: "34", icon: Truck, color: "text-orange-400", bg: "bg-orange-400/10" },
];

export default function CPanelDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Vue d'ensemble</h1>
        <p className="text-gray-400 mt-1">Bienvenue sur votre panneau d'administration Rayon.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center space-x-4"
            >
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Activité récente</h2>
        </div>
        <div className="p-6 flex items-center justify-center h-64 text-gray-500">
          Aucune activité récente à afficher pour le moment.
        </div>
      </motion.div>
    </div>
  );
}
