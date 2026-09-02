"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

// Helper to generate a random 6-character password/OTP
const generateRandomPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking characters like O, 0, I, 1
  let password = "";
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default function SupplierRegisterPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("COMMERCE"); // "COMMERCE" or "IMMOBILIER"
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Generate a temporary password
      const tempPassword = generateRandomPassword();

      // 2. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      const user = userCredential.user;

      // 3. Update the display name
      await updateProfile(user, { displayName: name });

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      // 4. Create the supplier profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        company: company,
        email: email,
        phone: phone,
        role: businessType === "IMMOBILIER" ? "SUPPLIER_IMMO" : "SUPPLIER", 
        businessType: businessType,
        status: "PENDING_APPROVAL", // Maybe requires admin validation?
        subscriptionStatus: "TRIAL",
        subscriptionEndDate: endDate,
        createdAt: serverTimestamp(),
      });

      // 5. Send the password via SMS using our API route
      const smsResponse = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone,
          message: `Bienvenue sur Rayon, ${name}! Votre compte Fournisseur a été créé. Mot de passe provisoire: ${tempPassword}`,
        }),
      });

      if (!smsResponse.ok) {
        // We log the error but don't block the registration success screen
        // because the account was actually created successfully.
        console.error("Failed to send SMS, API returned:", await smsResponse.text());
      }

      // 6. Show success screen
      setIsSuccess(true);
      
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("Cette adresse email est déjà utilisée.");
      } else {
        setError("Une erreur s'est produite lors de la création du compte.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Inscription réussie !</h2>
          <p className="text-gray-600 mb-8">
            Votre compte Fournisseur a été créé avec succès. Un SMS contenant votre mot de passe provisoire a été envoyé au <strong>{phone}</strong>.
          </p>
          <Link 
            href="/login"
            className="w-full inline-flex justify-center items-center py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            Aller à la page de connexion
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-12 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Retour à l'accueil
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Espace Fournisseur</h1>
            <p className="text-gray-500">Devenez partenaire Rayon et accédez à notre réseau.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Nom complet (Contact)</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 transition-all shadow-sm"
                placeholder="Jean Dupont"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Nom de l'entreprise</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 transition-all shadow-sm"
                placeholder="Dupont Logistique LLC"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Adresse Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 transition-all shadow-sm"
                placeholder="contact@entreprise.com"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Numéro de Téléphone (Mobile)</label>
              <p className="text-xs text-gray-500 mb-1">Votre mot de passe sera envoyé par SMS à ce numéro.</p>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 transition-all shadow-sm"
                placeholder="971501234567"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Type d'Activité</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 transition-all shadow-sm"
              >
                <option value="COMMERCE">Commerce (Produits, Vêtements, etc.)</option>
                <option value="IMMOBILIER">Agence Immobilière / Bailleur</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors shadow-sm flex justify-center items-center mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Demander la création du compte"
              )}
            </motion.button>
          </form>

          <div className="text-center text-sm text-gray-500 mt-8">
            Vous avez déjà un compte Fournisseur ?{" "}
            <Link href="/login" className="font-bold text-primary hover:text-primary-dark transition-colors">
              Se connecter
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right Column: Hero Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gray-100 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=2000" 
          alt="Supplier Register Hero" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-3xl font-bold mb-2">Un partenariat d'excellence.</h2>
          <p className="text-gray-200 text-lg">Rejoignez un réseau de fournisseurs de confiance et développez votre activité avec Rayon.</p>
        </div>
      </div>
    </div>
  );
}
