"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, Phone, MessageSquare, Navigation, CheckCircle2 } from "lucide-react";

export default function MissionDetails({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState<"EN_ATTENTE" | "EN_ROUTE" | "LIVRE">("EN_ATTENTE");

  const handleStatusChange = () => {
    if (status === "EN_ATTENTE") setStatus("EN_ROUTE");
    else if (status === "EN_ROUTE") setStatus("LIVRE");
  };

  return (
    <div className="bg-[#0b061c] min-h-screen flex flex-col relative pb-20">
      {/* Header Over Map */}
      <div className="absolute top-0 w-full z-10 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
        <Link href="/driver" className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white">
          <ChevronLeft size={24} />
        </Link>
        <span className="text-white font-bold text-sm bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          Mission {params.id}
        </span>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Map Placeholder (Simulated view of 2 people) */}
      <div className="h-[45vh] bg-[#1a1f35] relative overflow-hidden flex items-center justify-center">
        {/* Fake Map Grid */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
        
        {/* Route Line */}
        <svg className="absolute inset-0 w-full h-full" style={{ strokeDasharray: "5,5" }}>
          <path d="M 100 150 Q 200 50 300 200" fill="none" stroke="#a78bfa" strokeWidth="4" className="animate-pulse" />
        </svg>

        {/* Driver Marker */}
        <div className="absolute left-[80px] top-[130px] flex flex-col items-center">
          <div className="bg-primary text-white p-2 rounded-full shadow-lg shadow-primary/50 border-2 border-white mb-1">
            <Navigation size={16} className="transform rotate-45" />
          </div>
          <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md">Vous</span>
        </div>

        {/* Client Marker */}
        <div className="absolute left-[290px] top-[190px] flex flex-col items-center">
          <div className="bg-green-500 text-white p-2 rounded-full shadow-lg shadow-green-500/50 border-2 border-white mb-1">
            <MapPin size={16} />
          </div>
          <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md">Client</span>
        </div>
      </div>

      {/* Mission Info Sheet */}
      <div className="bg-[#140b2e] flex-1 -mt-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 p-6 flex flex-col">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Jean Dupont</h2>
            <p className="text-gray-400 text-sm">Client Rayons Connect</p>
          </div>
          <div className="flex space-x-3">
            <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <MessageSquare size={18} />
            </button>
            <button className="w-10 h-10 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center hover:bg-green-500/30 transition-colors border border-green-500/30">
              <Phone size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start space-x-3 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="mt-1">
              <MapPin size={18} className="text-primary-light" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Adresse de livraison</p>
              <p className="text-sm font-bold text-white">Quartier Ma Campagne, Avenue de la Paix N° 45</p>
              <p className="text-xs text-gray-500 mt-1">Garder la porte de la parcelle fermée.</p>
            </div>
          </div>

          <div className="flex justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
            <div>
              <p className="text-xs text-gray-400 mb-1">Colis</p>
              <p className="text-sm font-bold text-white">1x Kit Starlink Standard</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">À encaisser</p>
              <p className="text-sm font-bold text-green-400">Payé en ligne</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          {status === "LIVRE" ? (
            <div className="w-full py-4 bg-green-500/20 text-green-400 font-bold rounded-2xl flex items-center justify-center border border-green-500/30">
              <CheckCircle2 size={20} className="mr-2" />
              Mission Terminée
            </div>
          ) : (
            <button 
              onClick={handleStatusChange}
              className={`w-full py-4 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center space-x-2 ${
                status === "EN_ATTENTE" 
                  ? "bg-primary hover:bg-primary-light shadow-primary/20" 
                  : "bg-orange-500 hover:bg-orange-400 shadow-orange-500/20"
              }`}
            >
              {status === "EN_ATTENTE" ? (
                <>
                  <Navigation size={20} />
                  <span>Démarrer la course</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  <span>Marquer comme Livré</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
