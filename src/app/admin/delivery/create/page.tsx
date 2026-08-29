"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";

const generateRandomPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let password = "";
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default function AdminCreateDeliveryDriverPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("moto");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastCreatedDriver, setLastCreatedDriver] = useState<any>(null);

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Generate temp password and pseudo-email
      const tempPassword = generateRandomPassword();
      const pseudoEmail = `${phone}@driver.rayon.ae`;

      // 2. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, pseudoEmail, tempPassword);
      const user = userCredential.user;

      // 3. Update the display name
      await updateProfile(user, { displayName: name });

      // 4. Create the delivery profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: pseudoEmail,
        phone: phone,
        vehicle: vehicle,
        role: "DELIVERY",
        status: "ACTIVE",
        createdAt: serverTimestamp(),
      });

      // 5. Send the password via SMS
      const message = `Bienvenue chez Rayon! Vos acces Livreur. Login: ${pseudoEmail} Mdp: ${tempPassword} Site: https://rayon.ae App: [LienPlayStore]`;
      
      const smsResponse = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });

      if (!smsResponse.ok) {
        console.error("Failed to send SMS, API returned:", await smsResponse.text());
      }

      setLastCreatedDriver({ phone, email: pseudoEmail, password: tempPassword });
      setIsSuccess(true);
      
      // Reset form
      setName("");
      setPhone("");
      
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("Ce numéro de téléphone est déjà utilisé par un autre livreur.");
      } else {
        setError("Erreur lors de la création du compte livreur.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess && lastCreatedDriver) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center"
        >
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Livreur créé avec succès !</h2>
          <p className="text-gray-600 mb-6">
            Un SMS a été envoyé au <strong>{lastCreatedDriver.phone}</strong>.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-left mb-8 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Identifiant de connexion :</p>
            <p className="font-mono font-bold text-gray-900 mb-3">{lastCreatedDriver.email}</p>
            <p className="text-sm text-gray-500 mb-1">Mot de passe généré :</p>
            <p className="font-mono font-bold text-gray-900">{lastCreatedDriver.password}</p>
          </div>
          <button 
            onClick={() => setIsSuccess(false)}
            className="w-full inline-flex justify-center items-center py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            Créer un autre livreur
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Retour à l'accueil
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-900 text-white flex items-center">
            <ShieldAlert className="text-yellow-400 mr-3" size={24} />
            <div>
              <h1 className="text-2xl font-bold">Administration : Créer un Livreur</h1>
              <p className="text-gray-300 text-sm">Cet espace est réservé à la gestion.</p>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateDriver} className="space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Nom du Livreur</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 transition-all shadow-sm"
                  placeholder="Ali M."
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Numéro de Téléphone</label>
                <p className="text-xs text-gray-500 mb-1">Sert pour le login et la réception du SMS (Ex: 971501234567)</p>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 transition-all shadow-sm"
                  placeholder="9715..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Type de Véhicule</label>
                <select
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 transition-all shadow-sm"
                >
                  <option value="moto">Moto</option>
                  <option value="voiture">Voiture</option>
                  <option value="van">Camionnette / Van</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors shadow-sm flex justify-center items-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Créer le Livreur & Envoyer le SMS"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
