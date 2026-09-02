"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

type ImmoContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  property: any | null;
};

export function ImmoContactModal({ isOpen, onClose, property }: ImmoContactModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const propertyTitle = property ? (property.title?.fr || property.title) : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get("name");
      const phone = formData.get("phone");
      const date = formData.get("date");

      await addDoc(collection(db, "visits"), {
        propertyId: property.id,
        propertyTitle: propertyTitle,
        supplierId: property.supplierId,
        visitorName: name,
        visitorPhone: phone,
        requestedDate: date,
        gpsLink: property.gpsLink || "",
        status: "PENDING",
        createdAt: serverTimestamp()
      });

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Erreur d'enregistrement de la visite :", error);
      alert("Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#140b2e] border border-white/10 rounded-2xl shadow-2xl z-[101] overflow-hidden"
          >
            {isSubmitted ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <CheckCircle2 size={64} className="text-green-400 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Demande envoyée !</h3>
                <p className="text-gray-400">
                  Notre agent immobilier vous contactera dans les plus brefs délais pour organiser la visite de <br/>
                  <strong className="text-white">{propertyTitle}</strong>.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div className="flex items-center space-x-3 text-white">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary-light">
                      <Calendar size={24} />
                    </div>
                    <h2 className="text-xl font-bold">Demander une visite</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <p className="text-sm text-gray-400 mb-6">
                    Laissez vos coordonnées pour visiter : <br/>
                    <span className="font-bold text-white">{propertyTitle}</span>
                  </p>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400">Nom Complet</label>
                    <input name="name" type="text" required className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white" placeholder="Jean Dupont" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400">Téléphone</label>
                    <input name="phone" type="tel" required className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white" placeholder="+243..." />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400">Date souhaitée (Optionnel)</label>
                    <input name="date" type="date" min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-4 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                    {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
