"use client";

import { useState, useEffect } from "react";
import { Save, Phone, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminSettingsPage() {
  const { user, userData } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [commissionRate, setCommissionRate] = useState("10"); // Default 10%
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (userData && userData.phone) {
      setPhoneNumber(userData.phone);
    }
  }, [userData]);

  useEffect(() => {
    // Fetch global settings
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, "settings", "global");
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.commissionRate) {
            setCommissionRate(data.commissionRate.toString());
          }
        }
      } catch (err) {
        console.error("Erreur de chargement des paramètres globaux", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setSuccess("");
    setError("");

    try {
      // 1. Update Admin Phone Number
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        phone: phoneNumber
      });

      // 2. Update Global Commission Rate
      const settingsRef = doc(db, "settings", "global");
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        await updateDoc(settingsRef, {
          commissionRate: parseFloat(commissionRate)
        });
      } else {
        await setDoc(settingsRef, {
          commissionRate: parseFloat(commissionRate)
        });
      }

      setSuccess("Les paramètres ont été mis à jour avec succès.");
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la mise à jour : " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres Globaux</h1>
        <p className="text-sm text-gray-400">Gérez vos informations et les configurations du site.</p>
      </div>

      <div className="max-w-xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-4">Configuration</h2>
            
            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-lg">
                {success}
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Mon Numéro de téléphone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ex: +243 81 234 5678" 
                    className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" 
                  />
                </div>
              </div>

              {/* Commission Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Taux de commission global (%)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Percent size={18} className="text-gray-400" />
                  </div>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder="Ex: 10" 
                    className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" 
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Ce pourcentage sera prélevé sur les ventes des fournisseurs sur le site.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
