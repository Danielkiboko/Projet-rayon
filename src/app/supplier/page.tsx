"use client";

import { motion } from "framer-motion";
import { Info, Circle } from "lucide-react";

// Mock Data pour ressembler à Anantya
const KPIS = [
  { title: "Commandes & Réservations", value: "14", subtitle: "Total", subInfo: "Aujourd'hui: 2", icon: Info },
  { title: "Nouveaux Clients", value: "8", subtitle: "Total", subInfo: "+12% ce mois", icon: Info },
  { title: "Sessions Actives", value: "5", subtitle: "Total", subInfo: "En ligne: 3", icon: Info },
  { title: "Temps de Réponse", value: "12 mins", subtitle: "Moyenne", subInfo: "Objectif: <15 mins", icon: Info },
];

export default function SupplierDashboard() {
  return (
    <div className="space-y-6">
      
      {/* Top Row KPIs (Anantya Style) */}
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
                <Icon size={16} className="text-gray-500" />
              </div>
              <div className="mt-2">
                <div className="text-3xl font-bold text-white">{kpi.value}</div>
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
            <h2 className="text-base font-semibold text-white mb-6 text-center">Analyse Récente</h2>
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10">
              {/* Fake Donut Chart */}
              <div className="relative w-48 h-48 rounded-full border-[16px] border-[#3b82f6] border-r-[#10b981] border-b-[#f59e0b] shadow-inner flex items-center justify-center">
                <span className="text-2xl font-bold text-white">84%</span>
              </div>
              
              {/* Chart Legend */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <Circle size={10} className="text-[#3b82f6] fill-[#3b82f6]" /> <span>En cours</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <Circle size={10} className="text-[#10b981] fill-[#10b981]" /> <span>Terminé</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <Circle size={10} className="text-[#f59e0b] fill-[#f59e0b]" /> <span>En attente</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column (Setup & Recommendations) */}
        <div className="space-y-6">
          {/* Setup Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-base font-semibold text-white mb-4 text-center">Configurer votre compte</h2>
            <div className="w-full bg-white/5 rounded-full h-2 mb-4">
              <div className="bg-green-500 h-2 rounded-full w-3/4"></div>
            </div>
            <p className="text-xs text-center text-gray-400 mb-6 font-medium tracking-wider">ÉTAPE 3 SUR 4</p>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
              <h3 className="text-sm font-semibold text-white mb-2">Lancer une nouvelle offre</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Connectez-vous avec plus de clients en publiant de nouvelles annonces ou produits sur votre rayon.
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors w-full sm:w-auto">
                Créer une offre
              </button>
            </div>
          </motion.div>

          {/* Recommendations Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-base font-semibold text-white mb-4 text-center">Recommandations</h2>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center space-x-2 mb-2">
                  <Info size={16} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-white">Activer les notifications</h3>
                </div>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                  Soyez averti immédiatement de chaque nouvelle commande ou réservation.
                </p>
                <button className="bg-white/10 hover:bg-white/15 text-white text-xs font-medium py-1.5 px-3 rounded-md transition-colors">
                  Activer
                </button>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
