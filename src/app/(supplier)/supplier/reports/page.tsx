"use client";

import { BarChart3, TrendingUp, Download, PieChart, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function SupplierReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Rapports Financiers</h1>
          <p className="text-sm text-gray-400">Consultez vos revenus locatifs et le taux d'occupation.</p>
        </div>
        <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/10">
          <Download size={20} />
          <span>Exporter (PDF)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Revenus (Ce mois)</p>
              <p className="text-3xl font-bold text-white mt-2">3 000 $</p>
            </div>
            <div className="p-3 bg-green-500/20 text-green-400 rounded-xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-400">
            <span>+15% par rapport au mois précédent</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Taux d'occupation</p>
              <p className="text-3xl font-bold text-white mt-2">66%</p>
            </div>
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <PieChart size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-400">
            <span>2 biens occupés sur 3</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Loyers en retard</p>
              <p className="text-3xl font-bold text-red-400 mt-2">2 500 $</p>
            </div>
            <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
              <BarChart3 size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-red-400">
            <span>1 locataire en retard</span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Détails des encaissements</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/20 text-gray-400 border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Locataire</th>
                <th className="px-4 py-3">Propriété</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Méthode</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3">05 Sept 2026</td>
                <td className="px-4 py-3">Jean Dupont</td>
                <td className="px-4 py-3 flex items-center space-x-2">
                  <Home size={14} className="text-gray-400" />
                  <span>Appartement 3 pièces (Gombe)</span>
                </td>
                <td className="px-4 py-3 font-semibold text-green-400">+ 500 $</td>
                <td className="px-4 py-3">Mobile Money</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/5 text-gray-500">
                <td className="px-4 py-3">01 Sept 2026</td>
                <td className="px-4 py-3">Marie Claire</td>
                <td className="px-4 py-3 flex items-center space-x-2">
                  <Home size={14} className="text-gray-500" />
                  <span>Villa avec piscine (Ngaliema)</span>
                </td>
                <td className="px-4 py-3 font-semibold text-red-400">En attente (2500 $)</td>
                <td className="px-4 py-3">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
