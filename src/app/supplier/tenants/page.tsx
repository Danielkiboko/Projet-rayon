"use client";

import { useState, useEffect } from "react";
import { Users, Search, Plus, Bell, Home, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

interface Tenant {
  id: string;
  name: string;
  phone: string;
  email: string;
  propertyId: string;
  propertyName: string;
  unitName?: string;
  rentAmount: number;
  nextPayment: string;
  status: string;
  periodicity: string;
}

interface Property {
  id: string;
  title: { fr: string; en: string };
  price: number;
  immoDetails?: {
    levels?: any[];
  }
}

export default function SupplierTenantsPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [rentAmount, setRentAmount] = useState<number | "">("");
  const [nextPayment, setNextPayment] = useState("");
  const [periodicity, setPeriodicity] = useState("Mensuel");

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {

      // Fetch Properties
      const propsQuery = query(collection(db, "properties"), where("supplierId", "==", user.uid));
      const propsSnap = await getDocs(propsQuery);
      const propsData = propsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Property[];
      setProperties(propsData);

      // Fetch Tenants
      const tenantsQuery = query(collection(db, "tenants"), where("supplierId", "==", user.uid));
      const tenantsSnap = await getDocs(tenantsQuery);
      const tenantsData = tenantsSnap.docs.map(d => {
        const data = d.data();
        let calculatedStatus = data.status || "À jour";
        
        if (data.nextPayment) {
          const paymentDate = new Date(data.nextPayment);
          const today = new Date();
          paymentDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);

          if (paymentDate < today) {
            calculatedStatus = "En retard";
          } else {
            calculatedStatus = "À jour";
          }
        }
        
        return { id: d.id, ...data, status: calculatedStatus };
      }) as Tenant[];
      setTenants(tenantsData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // When a property is selected, auto-fill the rent amount
  useEffect(() => {
    if (selectedPropertyId) {
      const prop = properties.find(p => p.id === selectedPropertyId);
      if (prop) {
        setRentAmount(prop.price || "");
      }
      setSelectedLevelId("");
      setSelectedUnitId("");
    }
  }, [selectedPropertyId, properties]);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const levels = selectedProperty?.immoDetails?.levels || [];
  const selectedLevel = levels.find((l: any) => l.id === selectedLevelId);
  const units = selectedLevel?.units || [];

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) return alert("Veuillez sélectionner une propriété");
    if (!rentAmount) return alert("Veuillez définir un loyer");
    
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Non connecté");

      let unitName = "";
      if (selectedLevel && selectedUnitId) {
         const unit = units.find((u: any) => u.id === selectedUnitId);
         if (unit) unitName = `${selectedLevel.name} - ${unit.name}`;
      }

      const newTenant = {
        supplierId: user.uid,
        name,
        phone,
        email,
        propertyId: selectedPropertyId,
        propertyName: selectedProperty?.title?.fr || "Propriété",
        unitName,
        levelId: selectedLevelId,
        unitId: selectedUnitId,
        rentAmount: Number(rentAmount),
        nextPayment,
        periodicity,
        status: "À jour",
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "tenants"), newTenant);

      // --- LOGIC TO UPDATE PROPERTY/UNIT STATUS ---
      const propRef = doc(db, "properties", selectedPropertyId);
      if (levels.length === 0) {
        // Simple property without sub-units
        await updateDoc(propRef, { status: "Loué" });
      } else {
        // It has sub-units. Decrease capacity of the selected unit.
        const propDoc = await getDoc(propRef);
        if (propDoc.exists()) {
           const data = propDoc.data();
           const currentLevels = data.immoDetails?.levels || [];
           let allUnitsTaken = true;

           const updatedLevels = currentLevels.map((l: any) => {
              if (l.id === selectedLevelId) {
                 l.units = l.units.map((u: any) => {
                    if (u.id === selectedUnitId) {
                       u.capacity = Math.max(0, (u.capacity || 1) - 1);
                    }
                    if ((u.capacity || 1) > 0) allUnitsTaken = false;
                    return u;
                 });
              } else {
                 l.units.forEach((u: any) => {
                    if ((u.capacity || 1) > 0) allUnitsTaken = false;
                 });
              }
              return l;
           });

           await updateDoc(propRef, {
             "immoDetails.levels": updatedLevels,
             status: allUnitsTaken ? "Loué" : "Disponible" // Hide only if ALL units are taken
           });
        }
      }

      alert("Locataire ajouté avec succès !");
      setIsModalOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      setSelectedPropertyId("");
      setSelectedLevelId("");
      setSelectedUnitId("");
      setRentAmount("");
      setNextPayment("");
      setPeriodicity("Mensuel");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout du locataire");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter(
    (t) => (t.name || "").toLowerCase().includes(search.toLowerCase()) || (t.propertyName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mes Locataires</h1>
          <p className="text-sm text-gray-400">Gérez vos locataires et suivez les paiements de loyer.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Ajouter un locataire</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Locataires</p>
            <p className="text-2xl font-bold text-white mt-1">{tenants.length}</p>
          </div>
          <div className="p-3 bg-blue-400/10 text-blue-400 rounded-lg">
            <Users size={20} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">En retard</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{tenants.filter(t => t.status === "En retard").length}</p>
          </div>
          <div className="p-3 bg-red-400/10 text-red-400 rounded-lg">
            <Bell size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un locataire..."
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
                <th className="px-6 py-4">Propriété</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Loyer</th>
                <th className="px-6 py-4">Prochain paiement</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Chargement...</td></tr>
              ) : filteredTenants.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Aucun locataire trouvé.</td></tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary-light uppercase">
                        {tenant.name.charAt(0)}
                      </div>
                      <span>{tenant.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <Home size={14} className="text-gray-400" />
                          <span className="font-medium text-white">{tenant.propertyName}</span>
                        </div>
                        {tenant.unitName && (
                           <span className="text-xs text-gray-400 ml-5">{tenant.unitName}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{tenant.phone}</td>
                    <td className="px-6 py-4 font-semibold text-white">{tenant.rentAmount} $</td>
                    <td className="px-6 py-4">{new Date(tenant.nextPayment).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${tenant.status === "À jour" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary-light hover:text-white transition-colors flex items-center justify-end space-x-1 ml-auto">
                        <Bell size={16} />
                        <span>Rappeler</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TENANT MODAL */}
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
                <h2 className="text-xl font-semibold text-white">Ajouter un locataire</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Nom du locataire</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Téléphone (SMS)</label>
                    <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Propriété associée</label>
                  <select required value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white [&>option]:bg-[#140b2e]">
                    <option value="">Sélectionner une propriété...</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.title?.fr || "Propriété sans nom"}</option>
                    ))}
                  </select>
                </div>

                {levels.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 border-l-2 border-primary/50 pl-4 py-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-300">Niveau</label>
                      <select required value={selectedLevelId} onChange={(e) => setSelectedLevelId(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white [&>option]:bg-[#140b2e]">
                        <option value="">Sélectionner...</option>
                        {levels.map((l: any) => (
                          <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                    {selectedLevelId && (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-300">Sous-unité</label>
                        <select required value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white [&>option]:bg-[#140b2e]">
                          <option value="">Sélectionner...</option>
                          {units.filter((u: any) => (u.capacity || 1) > 0).map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name} ({u.type})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Loyer convenu ($)</label>
                    <input type="number" required value={rentAmount} onChange={(e) => setRentAmount(Number(e.target.value))} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Périodicité</label>
                    <select required value={periodicity} onChange={(e) => setPeriodicity(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white [&>option]:bg-[#140b2e]">
                      <option value="Mensuel">Mensuel</option>
                      <option value="Trimestriel">Trimestriel</option>
                      <option value="Annuel">Annuel</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Prochaine échéance</label>
                    <input type="date" required value={nextPayment} onChange={(e) => setNextPayment(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white [color-scheme:dark]" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3 border-t border-white/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                    Annuler
                  </button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors flex items-center disabled:opacity-50">
                    {isSubmitting ? "Ajout..." : "Confirmer"}
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
