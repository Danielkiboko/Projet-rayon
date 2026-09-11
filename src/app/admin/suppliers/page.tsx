"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, X, Search, Store, Shield, Home, ShoppingBag, Zap, 
  CheckCircle2, Users, ArrowRight, Building, Filter, Sparkles 
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, onSnapshot, orderBy } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";

interface Supplier {
  id: string;
  name: string;
  email: string;
  rayon: string;
  assignedRayons?: string[];
  status: string;
  profileUpdateStatus?: string;
  pendingProfile?: any;
  subscriptionStatus?: string;
  subscriptionEndDate?: any;
  role?: string;
  createdBy?: string;
  businessType?: string;
  serviceAttached?: string;
}

export default function SuppliersPage() {
  const { user, userData } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedSupplierToApprove, setSelectedSupplierToApprove] = useState<Supplier | null>(null);
  const [selectedSupplierForAccess, setSelectedSupplierForAccess] = useState<Supplier | null>(null);
  const [newSubDate, setNewSubDate] = useState("");
  
  // Rayon tab filter state: 'all' | 'immo' | 'mode' | 'connect' | 'other'
  const [selectedRayonFilter, setSelectedRayonFilter] = useState<"all" | "immo" | "mode" | "connect" | "other">("all");

  // Rayon selection state for access modal
  const [selectedRayons, setSelectedRayons] = useState<string[]>([]);
  
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // Form states for creation
  const [supplierCategory, setSupplierCategory] = useState<"immo" | "mode" | "connect" | "sub_admin">("immo");
  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [rayon, setRayon] = useState("immo");
  const [notificationMethod, setNotificationMethod] = useState<'email' | 'sms'>("email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("SUPPLIER_IMMO");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Keep this empty function so other functions that call fetchSuppliers() don't break
  const fetchSuppliers = () => {};

  useEffect(() => {
    if (!user || !userData) return;
    const isSuperAdmin = user.email === "danielkiboko218@gmail.com";
    const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN";
    
    if (!isSuperAdmin && !isAuthorizedSubAdmin) {
      setIsLoading(false);
      return;
    }

    // Fetch suppliers (including property agents and sub-admins)
    const q = query(
      collection(db, "users"), 
      where("role", "in", [
        "SUPPLIER", "supplier", "Supplier", 
        "SUPPLIER_IMMO", "supplier_immo",
        "SUB_ADMIN", "sub_admin",
        "SUB_SUPPLIER", "sub_supplier"
      ])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSuppliers: Supplier[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedSuppliers.push({
          id: docSnap.id,
          name: data.displayName || "Sans nom",
          email: data.email || "",
          rayon: data.rayon || "Non assigné",
          assignedRayons: data.assignedRayons || (data.rayon ? [data.rayon] : []),
          status: data.status === "active" ? "Actif" : "Inactif",
          profileUpdateStatus: data.profileUpdateStatus,
          pendingProfile: data.pendingProfile,
          subscriptionStatus: data.subscriptionStatus,
          subscriptionEndDate: data.subscriptionEndDate,
          role: data.role,
          createdBy: data.createdBy,
          businessType: data.businessType,
          serviceAttached: data.serviceAttached,
        });
      });
      setSuppliers(fetchedSuppliers);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching suppliers:", error);
      setError("Erreur d'accès aux fournisseurs : " + error.message);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]);

  const openReviewModal = (supplier: Supplier) => {
    setSelectedSupplierToApprove(supplier);
    setIsReviewModalOpen(true);
  };

  const openAccessModal = (supplier: Supplier) => {
    setSelectedSupplierForAccess(supplier);
    setSelectedRayons(supplier.assignedRayons || (supplier.rayon ? [supplier.rayon] : []));
    setIsAccessModalOpen(true);
  };

  const confirmApproveProfile = async () => {
    if (!selectedSupplierToApprove || !selectedSupplierToApprove.pendingProfile) return;
    setIsLoading(true);
    try {
      const ref = doc(db, "users", selectedSupplierToApprove.id);
      await updateDoc(ref, {
        ...selectedSupplierToApprove.pendingProfile,
        pendingProfile: null,
        profileUpdateStatus: "APPROVED"
      });
      setSuccessMessage("Profil approuvé avec succès.");
      setIsReviewModalOpen(false);
      setSelectedSupplierToApprove(null);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'approbation.");
      setIsLoading(false);
    }
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const ref = doc(db, "users", selectedSupplierId);
      await updateDoc(ref, {
        subscriptionEndDate: new Date(newSubDate),
        subscriptionStatus: "ACTIVE"
      });
      setSuccessMessage("Abonnement mis à jour.");
      setIsSubModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour de l'abonnement.");
      setIsLoading(false);
    }
  };

  const handleUpdateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForAccess) return;
    setIsLoading(true);
    try {
      const ref = doc(db, "users", selectedSupplierForAccess.id);
      // We set assignedRayons. Also update 'rayon' to the first one for backward compatibility
      await updateDoc(ref, {
        assignedRayons: selectedRayons,
        rayon: selectedRayons.length > 0 ? selectedRayons[0] : "",
        serviceAttached: selectedRayons.length > 0 ? selectedRayons[0] : ""
      });
      setSuccessMessage("Accès mis à jour.");
      setIsAccessModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour des accès.");
      setIsLoading(false);
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce fournisseur ? Cette action effacera toutes ses données (et propriétés).")) {
      return;
    }
    
    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken(true);
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

  const handleOpenCreateModal = (preselectedCategory?: "immo" | "mode" | "connect" | "sub_admin") => {
    const cat = preselectedCategory || (selectedRayonFilter !== "all" && selectedRayonFilter !== "other" ? selectedRayonFilter : "immo");
    setSupplierCategory(cat);
    if (cat === "immo") {
      setRole("SUPPLIER_IMMO");
      setRayon("immo");
    } else if (cat === "mode") {
      setRole("supplier");
      setRayon("mode");
    } else if (cat === "connect") {
      setRole("supplier");
      setRayon("connect");
    } else {
      setRole("SUB_ADMIN");
      setRayon("");
    }
    setError("");
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        throw new Error("Vous devez être connecté pour effectuer cette action.");
      }

      // Generate a strong random password since the user will reset it anyway
      const randomPassword = Math.random().toString(36).slice(-10) + "A1@";
      const displayName = name || `${firstName} ${lastName}`.trim();

      const roleToCreate = supplierCategory === "sub_admin" ? "SUB_ADMIN" : (supplierCategory === "immo" ? "SUPPLIER_IMMO" : "supplier");
      const primaryRayon = supplierCategory === "sub_admin" ? "" : supplierCategory;

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
          roleToCreate: roleToCreate,
          extraData: { 
            rayon: primaryRayon, 
            firstName, 
            lastName,
            assignedRayons: primaryRayon ? [primaryRayon] : [],
            serviceAttached: primaryRayon,
            ...(supplierCategory === 'immo' ? { businessType: 'IMMOBILIER' } : {})
          },
          notificationMethod,
          phoneNumber: notificationMethod === 'sms' ? phoneNumber : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du fournisseur.");
      }

      if (notificationMethod === 'email') {
        // 2. Send the password reset email so they can choose their own password
        await sendPasswordResetEmail(auth, email);
      }

      // Reset form and close modal
      setName("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhoneNumber("");
      setRayon("immo");
      setRole("SUPPLIER_IMMO");
      setSupplierCategory("immo");
      setIsModalOpen(false);
      const methodMsg = notificationMethod === 'email' 
        ? `Un e-mail a été envoyé à ${email} pour qu'il configure son mot de passe.` 
        : `Un SMS a été envoyé au ${phoneNumber} avec le mot de passe.`;
      setSuccessMessage(`Le compte fournisseur (${supplierCategory === 'immo' ? 'Immobilier & Hôtels' : supplierCategory === 'mode' ? 'Mode' : supplierCategory === 'connect' ? 'Connect' : 'Sous-Admin'}) a été créé. ${methodMsg}`);
      
      // Refresh list
      fetchSuppliers();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSupplierRayons = (s: Supplier): string[] => {
    const set = new Set<string>();
    if (Array.isArray(s.assignedRayons)) {
      s.assignedRayons.forEach((r) => {
        if (typeof r === "string" && r.trim()) set.add(r.toLowerCase().trim());
      });
    }
    if (s.rayon && typeof s.rayon === "string" && s.rayon !== "Non assigné") {
      set.add(s.rayon.toLowerCase().trim());
    }
    if (
      s.role === "SUPPLIER_IMMO" ||
      s.role === "supplier_immo" ||
      s.businessType === "IMMOBILIER" ||
      (typeof s.rayon === "string" && s.rayon.toLowerCase().includes("immo"))
    ) {
      set.add("immo");
    }
    if (s.serviceAttached && typeof s.serviceAttached === "string") {
      set.add(s.serviceAttached.toLowerCase().trim());
    }
    return Array.from(set);
  };

  const immoSuppliersCount = suppliers.filter((s) => getSupplierRayons(s).includes("immo")).length;
  const modeSuppliersCount = suppliers.filter((s) => getSupplierRayons(s).includes("mode")).length;
  const connectSuppliersCount = suppliers.filter((s) => getSupplierRayons(s).includes("connect")).length;
  const otherSuppliersCount = suppliers.filter((s) => {
    const r = getSupplierRayons(s);
    return !r.includes("immo") && !r.includes("mode") && !r.includes("connect");
  }).length;

  const filteredSuppliers = suppliers.filter((s) => {
    // 1. Rayon category filter
    if (selectedRayonFilter === "immo") {
      if (!getSupplierRayons(s).includes("immo")) return false;
    } else if (selectedRayonFilter === "mode") {
      if (!getSupplierRayons(s).includes("mode")) return false;
    } else if (selectedRayonFilter === "connect") {
      if (!getSupplierRayons(s).includes("connect")) return false;
    } else if (selectedRayonFilter === "other") {
      const r = getSupplierRayons(s);
      if (r.includes("immo") || r.includes("mode") || r.includes("connect")) return false;
    }

    // 2. Text search query
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.rayon.toLowerCase().includes(q) ||
      (s.role && s.role.toLowerCase().includes(q))
    );
  });

  const availableRayons = [
    { id: "immo", label: "Immobilier & Hôtellerie", icon: "🏠", desc: "Appartements, villas & hôtels" },
    { id: "mode", label: "Vêtements & Mode", icon: "👗", desc: "Vêtements, chaussures & accessoires" },
    { id: "connect", label: "Matériel & Réseau (Connect)", icon: "⚡", desc: "Électronique, télécoms & connectique" }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Fournisseurs & Prestataires</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300">
              {suppliers.length} total
            </span>
          </h1>
          <p className="text-sm text-gray-400">
            Gestion compartimentée des fournisseurs par rayon (Immobilier, Hôtellerie, Mode, Connect).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenCreateModal()}
            className="flex items-center space-x-2 bg-gradient-to-r from-primary to-primary-light hover:brightness-110 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all"
          >
            <Plus size={20} />
            <span>
              {selectedRayonFilter === "immo"
                ? "Nouveau Fournisseur Immo"
                : selectedRayonFilter === "mode"
                ? "Nouveau Fournisseur Mode"
                : selectedRayonFilter === "connect"
                ? "Nouveau Fournisseur Connect"
                : "Nouveau Fournisseur"}
            </span>
          </button>
        </div>
      </div>
      
      {successMessage && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage("")} className="text-green-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Rayon Category Separation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl">
        <button
          type="button"
          onClick={() => setSelectedRayonFilter("all")}
          className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            selectedRayonFilter === "all"
              ? "bg-white/15 text-white shadow-lg border border-white/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users size={16} />
          <span>Tous les Fournisseurs</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            selectedRayonFilter === "all" ? "bg-white/25 text-white" : "bg-white/10 text-gray-400"
          }`}>
            {suppliers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRayonFilter("immo")}
          className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            selectedRayonFilter === "immo"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10"
              : "text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/10"
          }`}
        >
          <span className="text-base">🏠</span>
          <span>Fournisseurs Immo & Hôtels</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            selectedRayonFilter === "immo" ? "bg-emerald-500/30 text-emerald-200" : "bg-white/10 text-gray-400"
          }`}>
            {immoSuppliersCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRayonFilter("mode")}
          className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            selectedRayonFilter === "mode"
              ? "bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-lg shadow-pink-500/10"
              : "text-gray-400 hover:text-pink-300 hover:bg-pink-500/10"
          }`}
        >
          <span className="text-base">👗</span>
          <span>Fournisseurs Mode & Vêtements</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            selectedRayonFilter === "mode" ? "bg-pink-500/30 text-pink-200" : "bg-white/10 text-gray-400"
          }`}>
            {modeSuppliersCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedRayonFilter("connect")}
          className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            selectedRayonFilter === "connect"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
              : "text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10"
          }`}
        >
          <span className="text-base">⚡</span>
          <span>Fournisseurs Matériel & Connect</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            selectedRayonFilter === "connect" ? "bg-cyan-500/30 text-cyan-200" : "bg-white/10 text-gray-400"
          }`}>
            {connectSuppliersCount}
          </span>
        </button>

        {otherSuppliersCount > 0 && (
          <button
            type="button"
            onClick={() => setSelectedRayonFilter("other")}
            className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              selectedRayonFilter === "other"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg"
                : "text-gray-400 hover:text-purple-300 hover:bg-purple-500/10"
            }`}
          >
            <Shield size={15} />
            <span>Autres & Sous-admins</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-gray-400">
              {otherSuppliersCount}
            </span>
          </button>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou rayon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 w-full sm:w-auto justify-between sm:justify-end">
            <span>
              Affichage :{" "}
              <strong className="text-white">
                {selectedRayonFilter === "immo"
                  ? "Fournisseurs Immo & Hôtellerie"
                  : selectedRayonFilter === "mode"
                  ? "Fournisseurs Mode"
                  : selectedRayonFilter === "connect"
                  ? "Fournisseurs Connect"
                  : selectedRayonFilter === "other"
                  ? "Sous-admins & Autres"
                  : "Tous les Rayons"}
              </strong>{" "}
              ({filteredSuppliers.length} résultat{filteredSuppliers.length > 1 ? "s" : ""})
            </span>
            {selectedRayonFilter !== "all" && (
              <button
                onClick={() => setSelectedRayonFilter("all")}
                className="text-primary-light hover:underline ml-2"
              >
                Voir tout
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/30 text-gray-400 tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Prestataire / Entreprise</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Rayons d'Accès</th>
                <th className="px-6 py-4 font-semibold">Abonnement</th>
                <th className="px-6 py-4 font-semibold">Statut Profil</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Chargement des prestataires...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mb-3 text-2xl">
                        {selectedRayonFilter === "immo" ? "🏠" : selectedRayonFilter === "mode" ? "👗" : selectedRayonFilter === "connect" ? "⚡" : "🔍"}
                      </div>
                      <h3 className="text-base font-semibold text-white mb-1">
                        {selectedRayonFilter === "immo"
                          ? "Aucun fournisseur Immobilier & Hôtellerie"
                          : selectedRayonFilter === "mode"
                          ? "Aucun fournisseur Mode & Vêtements"
                          : selectedRayonFilter === "connect"
                          ? "Aucun fournisseur Matériel & Connect"
                          : "Aucun fournisseur trouvé"}
                      </h3>
                      <p className="text-xs text-gray-400 mb-4">
                        {search
                          ? `Aucun résultat ne correspond à votre recherche "${search}".`
                          : "Il n'y a actuellement aucun fournisseur configuré dans cette catégorie."}
                      </p>
                      <button
                        onClick={() => handleOpenCreateModal(selectedRayonFilter !== "all" && selectedRayonFilter !== "other" ? selectedRayonFilter : "immo")}
                        className="flex items-center space-x-2 bg-primary hover:bg-primary-light text-white text-xs px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <Plus size={16} />
                        <span>
                          {selectedRayonFilter === "immo"
                            ? "Créer un Fournisseur Immobilier & Hôtels"
                            : selectedRayonFilter === "mode"
                            ? "Créer un Fournisseur Mode"
                            : selectedRayonFilter === "connect"
                            ? "Créer un Fournisseur Connect"
                            : "Créer un Fournisseur"}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => {
                  const supplierRayons = getSupplierRayons(supplier);
                  const isImmo = supplierRayons.includes("immo");
                  const isMode = supplierRayons.includes("mode");
                  const isConnect = supplierRayons.includes("connect");

                  return (
                    <tr key={supplier.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isImmo
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : isMode
                              ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                              : isConnect
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          }`}>
                            {isImmo ? (
                              <Home size={18} />
                            ) : isMode ? (
                              <ShoppingBag size={18} />
                            ) : isConnect ? (
                              <Zap size={18} />
                            ) : (
                              <Store size={18} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-white">{supplier.name}</span>
                              {supplier.role === 'SUB_ADMIN' && (
                                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                  Sous-Admin
                                </span>
                              )}
                              {supplier.role === 'SUB_SUPPLIER' && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                  Sous-Fournisseur
                                </span>
                              )}
                            </div>
                            
                            {/* Distinct Category Tag */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {isImmo && (
                                <span className="text-[10px] font-medium bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/25 flex items-center gap-1">
                                  <span>🏠</span>
                                  <span>Fournisseur Immo & Hôtels</span>
                                </span>
                              )}
                              {isMode && (
                                <span className="text-[10px] font-medium bg-pink-500/15 text-pink-300 px-2 py-0.5 rounded-md border border-pink-500/25 flex items-center gap-1">
                                  <span>👗</span>
                                  <span>Fournisseur Mode</span>
                                </span>
                              )}
                              {isConnect && (
                                <span className="text-[10px] font-medium bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/25 flex items-center gap-1">
                                  <span>⚡</span>
                                  <span>Fournisseur Connect</span>
                                </span>
                              )}
                            </div>

                            {(supplier.role === 'SUB_ADMIN' || supplier.role === 'SUB_SUPPLIER') && supplier.createdBy && (
                              <span className="text-[11px] text-gray-500 mt-1">
                                Créé par : {suppliers.find(s => s.id === supplier.createdBy)?.name || 'Parent inconnu'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{supplier.email}</td>
                      <td className="px-6 py-4">
                        {supplier.role === 'SUB_SUPPLIER' ? (
                          <div className="text-xs text-gray-500 italic">Hérité du compte parent</div>
                        ) : (
                          <>
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              {supplierRayons.length > 0 ? (
                                supplierRayons.map(r => {
                                  if (r === "immo") {
                                    return (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={() => setSelectedRayonFilter("immo")}
                                        className="px-2.5 py-0.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                                        title="Filtrer par Immobilier & Hôtels"
                                      >
                                        <span>🏠</span>
                                        <span>Immobilier & Hôtels</span>
                                      </button>
                                    );
                                  }
                                  if (r === "mode") {
                                    return (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={() => setSelectedRayonFilter("mode")}
                                        className="px-2.5 py-0.5 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                                        title="Filtrer par Mode & Vêtements"
                                      >
                                        <span>👗</span>
                                        <span>Mode</span>
                                      </button>
                                    );
                                  }
                                  if (r === "connect") {
                                    return (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={() => setSelectedRayonFilter("connect")}
                                        className="px-2.5 py-0.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                                        title="Filtrer par Matériel & Connect"
                                      >
                                        <span>⚡</span>
                                        <span>Connect</span>
                                      </button>
                                    );
                                  }
                                  return (
                                    <span key={r} className="px-2.5 py-0.5 bg-white/10 rounded-lg text-xs font-medium capitalize text-gray-300">
                                      {r}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-gray-500">Aucun accès</span>
                              )}
                            </div>
                            <button 
                              onClick={() => openAccessModal(supplier)}
                              className="text-xs text-primary-light hover:text-white flex items-center transition-colors"
                            >
                              <Shield size={12} className="mr-1" />
                              Gérer les accès
                            </button>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {(() => {
                            let statusStr = supplier.subscriptionStatus || "Non défini";
                            let statusClass = "text-gray-400";
                            
                            if (statusStr === "ACTIVE" || statusStr === "TRIAL") {
                              if (supplier.subscriptionEndDate) {
                                const endDate = new Date(supplier.subscriptionEndDate.toDate ? supplier.subscriptionEndDate.toDate() : supplier.subscriptionEndDate);
                                if (new Date() > endDate) {
                                  statusStr = "EXPIRÉ";
                                  statusClass = "text-red-500 font-bold";
                                } else {
                                  statusClass = statusStr === "TRIAL" ? "text-blue-400" : "text-green-400";
                                }
                              } else {
                                statusClass = statusStr === "TRIAL" ? "text-blue-400" : "text-green-400";
                              }
                            } else {
                              statusClass = "text-red-400";
                            }

                            return <span className={statusClass}>{statusStr}</span>;
                          })()}
                          {supplier.subscriptionEndDate && (
                            <span className="text-xs text-gray-500">
                              Échéance: {new Date(supplier.subscriptionEndDate.toDate ? supplier.subscriptionEndDate.toDate() : supplier.subscriptionEndDate).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                          <button 
                            onClick={() => { setSelectedSupplierId(supplier.id); setIsSubModalOpen(true); }}
                            className="text-xs text-primary-light mt-1 text-left hover:underline"
                          >
                            Prolonger
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {supplier.profileUpdateStatus === "PENDING_APPROVAL" || supplier.status === "PENDING_APPROVAL" ? (
                          <div className="flex flex-col space-y-2">
                            <span className="text-yellow-400 text-xs font-semibold">En attente</span>
                            <button 
                              onClick={() => openReviewModal(supplier)}
                              className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30 transition-colors"
                            >
                              Examiner
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">À jour</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="text-red-400 hover:bg-red-400/10 px-3 py-1 rounded-lg transition-colors text-xs font-medium"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Access Management Modal */}
      <AnimatePresence>
        {isAccessModalOpen && selectedSupplierForAccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#140b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Gérer les accès</h2>
                <button onClick={() => setIsAccessModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateAccess} className="p-6 space-y-4">
                <div className="mb-4">
                  <p className="text-sm text-gray-300 mb-2">
                    Sélectionnez les rayons auxquels <strong>{selectedSupplierForAccess.name}</strong> a le droit de vendre :
                  </p>
                </div>
                
                <div className="space-y-3">
                  {availableRayons.map((r) => (
                    <label key={r.id} className="flex items-center space-x-3 bg-white/5 border border-white/10 p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <input 
                        type="checkbox"
                        checked={selectedRayons.includes(r.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRayons([...selectedRayons, r.id]);
                          } else {
                            setSelectedRayons(selectedRayons.filter(id => id !== r.id));
                          }
                        }}
                        className="w-4 h-4 text-primary bg-black border-white/20 rounded focus:ring-primary focus:ring-2"
                      />
                      <span className="text-white text-sm font-medium">{r.label}</span>
                    </label>
                  ))}
                </div>
                
                <div className="pt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsAccessModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-light text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                    {isLoading ? "En cours..." : "Valider"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Méthode de notification</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 text-white cursor-pointer">
                      <input 
                        type="radio" 
                        name="notificationMethod" 
                        value="email" 
                        checked={notificationMethod === 'email'} 
                        onChange={() => setNotificationMethod('email')}
                        className="text-primary focus:ring-primary bg-black/20 border-white/10"
                      />
                      <span>Email</span>
                    </label>
                    <label className="flex items-center space-x-2 text-white cursor-pointer">
                      <input 
                        type="radio" 
                        name="notificationMethod" 
                        value="sms" 
                        checked={notificationMethod === 'sms'} 
                        onChange={() => setNotificationMethod('sms')}
                        className="text-primary focus:ring-primary bg-black/20 border-white/10"
                      />
                      <span>SMS</span>
                    </label>
                  </div>
                </div>

                {notificationMethod === 'sms' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Numéro de téléphone</label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+243..."
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                )}

                {/* Visual Category / Rayon Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Type de Prestataire & Rayon d'Affectation <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Immo & Hotel */}
                    <div
                      onClick={() => {
                        setSupplierCategory("immo");
                        setRole("SUPPLIER_IMMO");
                        setRayon("immo");
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        supplierCategory === "immo"
                          ? "bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xl">🏠</span>
                        {supplierCategory === "immo" ? (
                          <CheckCircle2 size={18} className="text-emerald-400" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-white/20" />
                        )}
                      </div>
                      <div className="font-semibold text-sm text-white">Immobilier & Hôtels</div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                        Appartements, villas, résidences, hôtels & nuitées
                      </div>
                    </div>

                    {/* Mode */}
                    <div
                      onClick={() => {
                        setSupplierCategory("mode");
                        setRole("supplier");
                        setRayon("mode");
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        supplierCategory === "mode"
                          ? "bg-pink-500/15 border-pink-500 text-white shadow-md shadow-pink-500/10"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xl">👗</span>
                        {supplierCategory === "mode" ? (
                          <CheckCircle2 size={18} className="text-pink-400" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-white/20" />
                        )}
                      </div>
                      <div className="font-semibold text-sm text-white">Mode & Vêtements</div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                        Prêt-à-porter, chaussures, sacs & accessoires
                      </div>
                    </div>

                    {/* Connect */}
                    <div
                      onClick={() => {
                        setSupplierCategory("connect");
                        setRole("supplier");
                        setRayon("connect");
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        supplierCategory === "connect"
                          ? "bg-cyan-500/15 border-cyan-500 text-white shadow-md shadow-cyan-500/10"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xl">⚡</span>
                        {supplierCategory === "connect" ? (
                          <CheckCircle2 size={18} className="text-cyan-400" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-white/20" />
                        )}
                      </div>
                      <div className="font-semibold text-sm text-white">Matériel & Connect</div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                        Smartphones, matériel informatique & réseaux
                      </div>
                    </div>

                    {/* Sub Admin */}
                    <div
                      onClick={() => {
                        setSupplierCategory("sub_admin");
                        setRole("SUB_ADMIN");
                        setRayon("");
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        supplierCategory === "sub_admin"
                          ? "bg-purple-500/15 border-purple-500 text-white shadow-md shadow-purple-500/10"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Shield size={20} className="text-purple-400" />
                        {supplierCategory === "sub_admin" ? (
                          <CheckCircle2 size={18} className="text-purple-400" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-white/20" />
                        )}
                      </div>
                      <div className="font-semibold text-sm text-white">Sous-administrateur</div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                        Délégation de gestion administrative plateforme
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {supplierCategory === "sub_admin"
                      ? "Le sous-administrateur aura accès à la gestion administrative."
                      : "Un abonnement d'essai de 30 jours sera automatiquement attribué au fournisseur."}
                  </p>
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

      {/* Subscription Update Modal */}
      <AnimatePresence>
        {isSubModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#140b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Renouveler Abonnement</h2>
                <button onClick={() => setIsSubModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateSubscription} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Nouvelle date d'échéance</label>
                  <input
                    type="date"
                    required
                    value={newSubDate}
                    onChange={(e) => setNewSubDate(e.target.value)}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  />
                </div>
                
                <div className="pt-4 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsSubModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary-light text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2">
                    {isLoading ? "En cours..." : "Sauvegarder"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Profile Modal */}
      <AnimatePresence>
        {isReviewModalOpen && selectedSupplierToApprove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#140b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                <h2 className="text-xl font-semibold text-white">Examiner les modifications</h2>
                <button onClick={() => setIsReviewModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Informations Soumises</h3>
                  <div className="bg-white/5 rounded-lg border border-white/10 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs text-gray-500 uppercase">Téléphone</span>
                        <span className="text-sm text-gray-200">{selectedSupplierToApprove.pendingProfile?.phone || "Non renseigné"}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 uppercase">Entreprise</span>
                        <span className="text-sm text-gray-200">{selectedSupplierToApprove.pendingProfile?.companyName || "Non renseigné"}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 uppercase">RCCM</span>
                        <span className="text-sm text-gray-200">{selectedSupplierToApprove.pendingProfile?.rccm || "Non renseigné"}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 uppercase">ID Nat</span>
                        <span className="text-sm text-gray-200">{selectedSupplierToApprove.pendingProfile?.idNat || "Non renseigné"}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 uppercase">NIF</span>
                        <span className="text-sm text-gray-200">{selectedSupplierToApprove.pendingProfile?.nif || "Non renseigné"}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500 uppercase">Couleur</span>
                        <div className="flex items-center space-x-2 mt-1">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: selectedSupplierToApprove.pendingProfile?.primaryColor || "#000" }} 
                          />
                          <span className="text-sm text-gray-200">{selectedSupplierToApprove.pendingProfile?.primaryColor || "Non renseigné"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedSupplierToApprove.pendingProfile?.logoUrl && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Logo</h3>
                    <div className="bg-white/5 rounded-lg border border-white/10 p-4 flex justify-center items-center h-32">
                      <img 
                        src={selectedSupplierToApprove.pendingProfile.logoUrl} 
                        alt="Logo" 
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10 shrink-0 flex justify-end space-x-3">
                <button 
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmApproveProfile}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Approbation..." : "Approuver le profil"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
