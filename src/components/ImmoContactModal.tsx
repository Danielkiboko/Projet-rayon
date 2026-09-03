"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, CheckCircle2, MapPin } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

type ImmoContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  property: any | null;
};

export function ImmoContactModal({ isOpen, onClose, property }: ImmoContactModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitorCoords, setVisitorCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const { user, userData } = useAuth();
  
  const propertyTitle = property ? (property.title?.fr || property.title) : "";

  const handleGetLocation = () => {
    setIsFetchingGps(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setVisitorCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsFetchingGps(false);
        },
        (error) => {
          console.error("Erreur GPS:", error);
          alert("Impossible de récupérer la position. L'itinéraire automatique ne pourra pas être créé.");
          setIsFetchingGps(false);
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      setIsFetchingGps(false);
    }
  };

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
        clientId: user?.uid || null,
        visitorName: name,
        visitorPhone: phone,
        requestedDate: date,
        propertyCoords: property.propertyCoords || null,
        visitorCoords: visitorCoords || null,
        status: "PENDING",
        createdAt: serverTimestamp()
      });

      if (user?.uid && property.supplierId) {
        const chatId = `${user.uid}_${property.supplierId}`;
        const msgText = `Demande de visite pour le bien: ${propertyTitle}. Nom: ${name}. Téléphone: ${phone}. Date souhaitée: ${date || "Non spécifiée"}. GPS: ${visitorCoords ? 'Oui' : 'Non'}`;

        await setDoc(doc(db, "chats", chatId), {
          clientId: user.uid,
          supplierId: property.supplierId,
          lastProductId: property.id,
          lastMessage: msgText,
          lastMessageTime: serverTimestamp(),
          updatedAt: serverTimestamp(),
          unreadSupplier: true
        }, { merge: true });

        await addDoc(collection(db, `chats/${chatId}/messages`), {
          text: msgText,
          senderId: user.uid,
          createdAt: serverTimestamp()
        });

        // Notify Supplier via API
        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "NEW_VISIT_REQUEST",
            supplierId: property.supplierId,
            propertyTitle: propertyTitle
          })
        }).catch(err => console.error("Error sending visit notification", err));
      }

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

                {!user ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-300 mb-6">Vous devez être connecté pour demander une visite et discuter avec l'agent immobilier.</p>
                    <Link href="/login" onClick={onClose} className="inline-block px-6 py-3 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-colors">
                      Se connecter / S'inscrire
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">

                  <p className="text-sm text-gray-400 mb-6">
                    Laissez vos coordonnées pour visiter : <br/>
                    <span className="font-bold text-white">{propertyTitle}</span>
                  </p>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400">Nom Complet</label>
                    <input name="name" type="text" defaultValue={userData?.name || ""} required className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white" placeholder="Jean Dupont" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400">Téléphone</label>
                    <input name="phone" type="tel" required className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white" placeholder="+243..." />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-400">Date souhaitée (Optionnel)</label>
                    <input name="date" type="date" min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium text-gray-400">Votre position (Pour l'itinéraire GPS)</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isFetchingGps}
                        className="px-4 py-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                      >
                        <MapPin size={16} />
                        {isFetchingGps ? "Recherche..." : "📍 Partager ma position"}
                      </button>
                      {visitorCoords && (
                        <span className="text-xs text-green-400 font-medium mt-2 sm:mt-0">
                          ✓ Position partagée
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Obligatoire pour que l'agent puisse vous envoyer l'itinéraire jusqu'au bien.</p>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-4 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-colors disabled:opacity-50">
                    {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
                  </button>
                </form>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
