"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, Search, Calendar, User, DollarSign, X, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from "firebase/firestore";

interface Payment {
  id: string;
  tenantId?: string;
  clientName: string;
  totalAmount?: number;
  amount: number;
  remainingAmount?: number;
  method: string;
  reference: string;
  status: "COMPLETED" | "PENDING";
  createdAt: any;
  notes?: string;
}

interface Tenant {
  id: string;
  tenantName: string;
  rentAmount: number;
  propertyId?: string;
  propertyName?: string;
}

export default function SupplierPaymentsClient() {
  const { user } = useAuth();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [selectedTenant, setSelectedTenant] = useState("");
  const [clientName, setClientName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Espèces");
  const [reference, setReference] = useState(`PAY-${Math.floor(Math.random() * 1000000)}`);
  const [status, setStatus] = useState<"COMPLETED" | "PENDING">("COMPLETED");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user) return;

    // Fetch Payments
    const qPayments = query(
      collection(db, "payments"),
      where("supplierId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
      const paymentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Payment[];
      setPayments(paymentList);
      setLoading(false);
    });

    // Fetch Tenants
    const qTenants = query(
      collection(db, "tenants"),
      where("supplierId", "==", user.uid)
    );

    const unsubscribeTenants = onSnapshot(qTenants, (snapshot) => {
      const tenantList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tenant[];
      setTenants(tenantList);
    });

    return () => {
      unsubscribePayments();
      unsubscribeTenants();
    };
  }, [user]);

  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenant(tenantId);
    const t = tenants.find(x => x.id === tenantId);
    if (t) {
      setClientName(t.tenantName);
      if (t.rentAmount) {
        setTotalAmount(t.rentAmount.toString());
        setAmount(t.rentAmount.toString());
      } else {
        setTotalAmount("");
        setAmount("");
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !amount) return;
    
    setIsSubmitting(true);

    const numTotal = Number(totalAmount) || 0;
    const numPaid = Number(amount) || 0;
    const remaining = numTotal > 0 ? Math.max(0, numTotal - numPaid) : 0;

    try {
      await addDoc(collection(db, "payments"), {
        supplierId: user?.uid,
        tenantId: selectedTenant || null,
        clientName,
        totalAmount: numTotal,
        amount: numPaid,
        remainingAmount: remaining,
        method,
        reference: reference || `PAY-${Math.floor(Math.random() * 1000000)}`,
        status: remaining > 0 ? "PENDING" : status,
        notes,
        createdAt: serverTimestamp(),
      });

      setShowModal(false);
      setSelectedTenant("");
      setClientName("");
      setTotalAmount("");
      setAmount("");
      setMethod("Espèces");
      setReference(`PAY-${Math.floor(Math.random() * 1000000)}`);
      setStatus("COMPLETED");
      setNotes("");
    } catch (error) {
      console.error("Error creating payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCompleted = payments
    .filter(p => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter(p => 
    p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Paiements</h1>
          <p className="text-gray-400 text-sm mt-1">Gérez et suivez les paiements de vos clients.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          <span>Nouveau Paiement</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-500 rounded-xl flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Encaissé</p>
              <h3 className="text-2xl font-bold text-white">${totalCompleted.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#1a1a1a] p-4 rounded-2xl border border-white/5">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un client ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-white/5 text-gray-300">
              <tr>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Total Dû</th>
                <th className="px-6 py-4 font-medium">Payé</th>
                <th className="px-6 py-4 font-medium">Reste</th>
                <th className="px-6 py-4 font-medium">Méthode</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">Chargement des paiements...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">Aucun paiement trouvé.</td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{payment.clientName}</div>
                      {payment.reference && (
                        <div className="text-xs text-gray-500">Réf: {payment.reference}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-400">
                      ${payment.totalAmount ? payment.totalAmount.toFixed(2) : "0.00"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-red-400">
                      ${payment.remainingAmount ? payment.remainingAmount.toFixed(2) : "0.00"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-white/10 px-2 py-1 rounded-md text-xs">
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {payment.createdAt?.toDate ? new Date(payment.createdAt.toDate()).toLocaleDateString('fr-FR') : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {payment.remainingAmount && payment.remainingAmount > 0 ? (
                        <span className="flex items-center text-yellow-500 text-xs font-medium">
                          <Clock size={14} className="mr-1" />
                          Partiel / Reste
                        </span>
                      ) : payment.status === "COMPLETED" ? (
                        <span className="flex items-center text-green-500 text-xs font-medium">
                          <CheckCircle size={14} className="mr-1" />
                          Complété
                        </span>
                      ) : (
                        <span className="flex items-center text-yellow-500 text-xs font-medium">
                          <Clock size={14} className="mr-1" />
                          En attente
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Enregistrer un paiement</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              
              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Client / Locataire</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-gray-500" />
                  </div>
                  <select
                    value={selectedTenant}
                    onChange={(e) => handleTenantSelect(e.target.value)}
                    required
                    className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Sélectionner un locataire...</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.tenantName} {t.propertyName ? `(${t.propertyName})` : ''} - Loyer: ${t.rentAmount}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Total */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Total Dû ($)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-gray-500" />
                    </div>
                    <input
                      type="number"
                      value={totalAmount}
                      readOnly
                      placeholder="0.00"
                      className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Montant Payé */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Montant Payé ($)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-gray-500" />
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Reste à payer dynamique */}
              {totalAmount && amount && Number(totalAmount) - Number(amount) > 0 && (
                <div className="text-xs text-yellow-500 flex justify-end">
                  Reste à payer : ${(Number(totalAmount) - Number(amount)).toFixed(2)}
                </div>
              )}

              {/* Méthode */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Méthode de paiement</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Espèces">Espèces</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Virement Bancaire">Virement Bancaire</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Statut</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus("COMPLETED")}
                    className={`py-2 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                      status === "COMPLETED" ? "bg-green-600/20 border-green-500 text-green-500" : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <CheckCircle size={16} />
                    Complété
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("PENDING")}
                    className={`py-2 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
                      status === "PENDING" ? "bg-yellow-600/20 border-yellow-500 text-yellow-500" : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <Clock size={16} />
                    En attente
                  </button>
                </div>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Référence (Auto-générée)</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="PAY-XXXXXX"
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes (Optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Détails supplémentaires..."
                  rows={2}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
