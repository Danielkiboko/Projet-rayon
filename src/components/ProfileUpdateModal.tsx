"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Phone } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

interface ProfileUpdateModalProps {
  user: any;
  userData: any;
  onSuccess: () => void;
}

export default function ProfileUpdateModal({ user, userData, onSuccess }: ProfileUpdateModalProps) {
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const needsPhone = !userData?.phone;

  // Si tout est à jour, on ne retourne rien (la modale est invisible)
  if (!needsPhone) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Le numéro de téléphone est requis.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { phone: phone.trim() });
      // Call success callback
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#140b2e] border border-primary/30 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 text-center border-b border-white/10 bg-black/20">
          <div className="w-16 h-16 bg-primary/20 text-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Mise à jour requise</h2>
          <p className="text-sm text-gray-300">
            Suite à une mise à jour du système, de nouvelles informations sont obligatoires pour continuer à utiliser votre espace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {needsPhone && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Phone size={14} /> Numéro de téléphone (SMS)
              </label>
              <input
                type="tel"
                required
                placeholder="+243 81 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ce numéro sera utilisé pour vous envoyer des notifications importantes concernant vos activités.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 mt-4 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? "Enregistrement en cours..." : "Mettre à jour et continuer"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
