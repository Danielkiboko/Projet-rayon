"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Search, Store } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";

interface Supplier {
  id: string;
  name: string;
  email: string;
  rayon: string;
  status: string;
}

export default function SuppliersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [rayon, setRayon] = useState("");
  const [role, setRole] = useState("supplier");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const { limit } = await import("firebase/firestore");
      const q = query(collection(db, "users"), where("role", "==", "supplier"), limit(50));
      const querySnapshot = await getDocs(q);
      const suppliersData: Supplier[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        suppliersData.push({
          id: doc.id,
          name: data.displayName || "Sans nom",
          email: data.email || "",
          rayon: data.rayon || "Non assigné",
          status: data.status === "active" ? "Actif" : "Inactif",
        });
      });
      setSuppliers(suppliersData);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce fournisseur ? Cette action effacera toutes ses données (et propriétés).")) {
      return;
    }
    
    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Vous devez être connecté.");

      const response = await fetch("/api/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: supplierId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      setSuccessMessage("Fournisseur supprimé avec succès.");
      fetchSuppliers();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la suppression");
      setIsLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Vous devez être connecté pour effectuer cette action.");
      }

      // Generate a strong random password since the user will reset it anyway
      const randomPassword = Math.random().toString(36).slice(-10) + "A1@";
      
      const displayName = name || `${firstName} ${lastName}`.trim();

      // 1. Create the user account via API
      const response = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password: randomPassword,
          displayName: displayName,
          roleToCreate: role,
          extraData: { rayon, firstName, lastName },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du fournisseur.");
      }

      // 2. Send the password reset email so they can choose their own password
      await sendPasswordResetEmail(auth, email);

      // Reset form and close modal
      setName("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setRayon("");
      setRole("supplier");
      setIsModalOpen(false);
      setSuccessMessage(`Le compte fournisseur a été créé. Un e-mail a été envoyé à ${email} pour qu'il configure son mot de passe.`);
      
      // Refresh list
      fetchSuppliers();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.rayon.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Fournisseurs</h1>
          <p className="text-sm text-gray-400">Gérez les comptes fournisseurs et leurs rayons associés.</p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setSuccessMessage("");
            setError("");
          }}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>
      
      {successMessage && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400">
          {successMessage}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un fournisseur..."
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
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rayon associé</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Chargement des fournisseurs...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Aucun fournisseur trouvé.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary-light">
                        <Store size={16} />
                      </div>
                      <span>{supplier.name}</span>
                    </td>
                    <td className="px-6 py-4">{supplier.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">
                        {supplier.rayon}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={supplier.status === "Actif" ? "text-green-400" : "text-red-400"}>
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="text-red-400 hover:bg-red-400/10 px-3 py-1 rounded transition-colors"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Supplier Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#140b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#140b2e] z-10">
                <h2 className="text-xl font-semibold text-white">Créer un compte</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateSupplier} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-sm mb-2">
                  Un e-mail de configuration de mot de passe sera automatiquement envoyé à l'adresse indiquée une fois le compte créé.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Prénom</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Nom (Post-nom)</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Nom de l'entreprise (Optionnel)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Email (identifiant de connexion)</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Type d'accès</label>
                  <select
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white [&>option]:bg-[#0b061c]"
                  >
                    <option value="supplier">Fournisseur (Accès basique)</option>
                    <option value="SUB_ADMIN">Sous-administrateur (Accès étendu)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Rayon d'affectation</label>
                  <select
                    required
                    value={rayon}
                    onChange={(e) => setRayon(e.target.value)}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white [&>option]:bg-[#0b061c]"
                  >
                    <option value="">Sélectionner un rayon...</option>
                    <option value="connect">Rayon Connect (Matériel)</option>
                    <option value="immo">Rayon Immo (Immobilier)</option>
                    <option value="mode">Rayon Mode (Vêtements)</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors flex items-center disabled:opacity-50"
                  >
                    {isSubmitting ? "Création en cours..." : "Créer le compte"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

