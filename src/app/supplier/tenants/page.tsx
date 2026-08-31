"use client";

import { useState } from "react";
import { Users, Search, Plus, Mail, Bell, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_TENANTS = [
  { id: "1", name: "Jean Dupont", property: "Appartement 3 pièces (Gombe)", phone: "+243 81 000 0001", rent: "500 $", nextPayment: "05 Sept 2026", status: "À jour" },
  { id: "2", name: "Marie Claire", property: "Villa avec piscine (Ngaliema)", phone: "+243 82 000 0002", rent: "2500 $", nextPayment: "01 Sept 2026", status: "En retard" },
];

export default function SupplierTenantsPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mes Locataires</h1>
          <p className="text-sm text-gray-400">Gérez vos locataires et suivez les paiements de loyer.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Ajouter un locataire</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Locataires</p>
            <p className="text-2xl font-bold text-white mt-1">2</p>
          </div>
          <div className="p-3 bg-blue-400/10 text-blue-400 rounded-lg">
            <Users size={20} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">En retard</p>
            <p className="text-2xl font-bold text-red-400 mt-1">1</p>
          </div>
          <div className="p-3 bg-red-400/10 text-red-400 rounded-lg">
            <Bell size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un locataire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/20 text-gray-400">
              <tr>
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Propriété</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Loyer</th>
                <th className="px-6 py-4">Prochain paiement</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TENANTS.map((tenant) => (
                <tr key={tenant.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary-light uppercase">
                      {tenant.name.charAt(0)}
                    </div>
                    <span>{tenant.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Home size={14} className="text-gray-400" />
                      <span>{tenant.property}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{tenant.phone}</td>
                  <td className="px-6 py-4 font-semibold text-white">{tenant.rent}</td>
                  <td className="px-6 py-4">{tenant.nextPayment}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${tenant.status === "À jour" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary-light hover:text-white transition-colors flex items-center justify-end space-x-1 ml-auto">
                      <Bell size={16} />
                      <span>Rappeler</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
