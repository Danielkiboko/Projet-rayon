"use client";

import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Paramètres</h2>
        <p className="text-gray-400 mt-1 text-sm">Configurez les paramètres globaux de la plateforme.</p>
      </div>

      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-8 shadow-sm text-center py-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        <Settings size={48} className="mx-auto text-blue-500/50 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2 relative z-10">Page en construction</h2>
        <p className="text-gray-400 max-w-md mx-auto relative z-10">
          Les paramètres globaux de la plateforme (taux de commission, notifications, clés API) seront bientôt configurables ici.
        </p>
      </div>
    </div>
  );
}
