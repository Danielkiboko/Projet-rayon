"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Navigation, Smartphone } from "lucide-react";

export default function DriverLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulation connexion sécurisée
    setTimeout(() => {
      router.push("/driver");
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-[#140b2e] to-[#0b061c]">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
        <Navigation size={32} className="text-white" />
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-2 text-center">Rayons Driver</h1>
      <p className="text-gray-400 text-center mb-10">Portail sécurisé des livreurs</p>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Smartphone className="text-gray-500" size={20} />
            </div>
            <input 
              type="tel" 
              placeholder="Numéro de téléphone" 
              required
              className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl focus:outline-none focus:border-primary text-white text-lg placeholder-gray-500" 
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="text-gray-500" size={20} />
            </div>
            <input 
              type="password" 
              placeholder="Code PIN" 
              required
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl focus:outline-none focus:border-primary text-white text-lg tracking-widest placeholder-gray-500 font-mono" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading || pin.length < 4}
          className="w-full py-4 bg-primary hover:bg-primary-light text-white font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-primary/20"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Se connecter"
          )}
        </button>
      </form>

      <p className="mt-12 text-xs text-gray-500 text-center">
        Accès restreint au personnel autorisé Rayons.NET.
      </p>
    </div>
  );
}
