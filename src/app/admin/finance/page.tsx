"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ArrowDownRight, ArrowUpRight, Plus, Download, X, Search, FileText } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  type: "SUBSCRIPTION" | "EXPENSE" | "OTHER_INCOME";
  amount: number;
  currency: string;
  description: string;
  referenceId?: string;
  status: "COMPLETED" | "PENDING";
  createdAt: any;
}

export default function AdminFinancePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [txType, setTxType] = useState<"SUBSCRIPTION" | "EXPENSE" | "OTHER_INCOME">("SUBSCRIPTION");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || (userData?.role !== "SUPER_ADMIN" && userData?.role !== "SUB_ADMIN"))) {
      router.push("/");
      return;
    }

    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Transaction[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching transactions:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData, loading, router]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "transactions"), {
        type: txType,
        amount: Number(amount),
        currency: "USD",
        description,
        referenceId: referenceId || null,
        status: "COMPLETED",
        createdAt: serverTimestamp(),
        createdBy: user?.uid
      });
      setIsModalOpen(false);
      setAmount("");
      setDescription("");
      setReferenceId("");
      setTxType("SUBSCRIPTION");
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Erreur lors de l'ajout de la transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadCSV = () => {
    const headers = ["Date", "Type", "Montant (USD)", "Description", "Reference", "Statut"];
    const rows = filteredTransactions.map(t => [
      t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('fr-FR') : 'N/A',
      t.type,
      t.amount.toString(),
      `"${t.description}"`,
      t.referenceId || "N/A",
      t.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `livre_de_caisse_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter !== "ALL" && t.type !== filter) return false;
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !(t.referenceId || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalIncome = transactions.filter(t => t.type === "SUBSCRIPTION" || t.type === "OTHER_INCOME").reduce((acc, t) => acc + t.amount, 0);
  const totalPayout = transactions.filter(t => t.type === "EXPENSE").reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalPayout;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Livre de Caisse</h1>
          <p className="text-sm text-gray-400">Gérez et suivez toutes les transactions financières.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={downloadCSV}
            className="flex items-center space-x-2 bg-black/20 hover:bg-black/40 border border-white/10 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={20} />
            <span>Exporter CSV</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Ajouter Opération</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 text-sm font-medium">Solde Caisse</h3>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wallet className="text-blue-400" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mt-4">${balance.toFixed(2)}</p>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 text-sm font-medium">Total Entrées (Revenus)</h3>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <ArrowDownRight className="text-green-400" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mt-4">${totalIncome.toFixed(2)}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 text-sm font-medium">Total Sorties (Dépenses/Paiements)</h3>
            <div className="p-2 bg-red-500/20 rounded-lg">
              <ArrowUpRight className="text-red-400" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mt-4">${totalPayout.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "ALL" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter("SUBSCRIPTION")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "SUBSCRIPTION" ? "bg-green-500/20 text-green-400" : "text-gray-400 hover:text-white"}`}
            >
              Abonnements Fournisseurs
            </button>
            <button
              onClick={() => setFilter("OTHER_INCOME")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "OTHER_INCOME" ? "bg-blue-500/20 text-blue-400" : "text-gray-400 hover:text-white"}`}
            >
              Autres Entrées
            </button>
            <button
              onClick={() => setFilter("EXPENSE")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "EXPENSE" ? "bg-red-500/20 text-red-400" : "text-gray-400 hover:text-white"}`}
            >
              Dépenses de Plateforme
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher une transaction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/20 text-gray-400">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Référence</th>
                <th className="px-6 py-4 text-right">Montant (USD)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Chargement...</td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">Aucune transaction trouvée.</td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {t.type === "SUBSCRIPTION" && <span className="inline-flex items-center text-green-400 bg-green-400/10 px-2 py-1 rounded text-xs"><ArrowDownRight size={12} className="mr-1"/> Abonnement</span>}
                      {t.type === "OTHER_INCOME" && <span className="inline-flex items-center text-blue-400 bg-blue-400/10 px-2 py-1 rounded text-xs"><ArrowDownRight size={12} className="mr-1"/> Autre Entrée</span>}
                      {t.type === "EXPENSE" && <span className="inline-flex items-center text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs"><ArrowUpRight size={12} className="mr-1"/> Dépense</span>}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{t.description}</td>
                    <td className="px-6 py-4 text-gray-400">{t.referenceId || "-"}</td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'SUBSCRIPTION' || t.type === 'OTHER_INCOME' ? 'text-green-400' : 'text-white'}`}>
                      {t.type === 'SUBSCRIPTION' || t.type === 'OTHER_INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Transaction */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#140b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Nouvelle Opération</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Type d'opération</label>
                  <select 
                    value={txType}
                    onChange={(e: any) => setTxType(e.target.value)}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  >
                    <option value="SUBSCRIPTION">Paiement d'Abonnement Fournisseur</option>
                    <option value="OTHER_INCOME">Autre Entrée (Investissement, etc.)</option>
                    <option value="EXPENSE">Dépense de Plateforme (Serveurs, Marketing...)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Montant (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    placeholder="ex: 150.00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    placeholder="ex: Abonnement Magasin Mode XYZ"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Référence (Optionnel)</label>
                  <input
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    placeholder="ID Commande ou ID Fournisseur"
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors flex items-center disabled:opacity-50"
                  >
                    {isSubmitting ? "Enregistrement..." : "Enregistrer"}
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
