"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Send, Plus, Search, Calendar, User, DollarSign, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, onSnapshot } from "firebase/firestore";
import ModalActions from "@/components/shared/ModalActions";

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  rentAmount: number;
  propertyId?: string;
  propertyName?: string;
}

export default function SupplierInvoices() {
  const { user, userData } = useAuth();
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [invoiceType, setInvoiceType] = useState("Facture"); // Facture ou Proforma
  const [selectedTenant, setSelectedTenant] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "tenants"),
      where("supplierId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tenantList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tenant[];
      setTenants(tenantList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const generatePDF = async (tenant: Tenant, type: string, invAmount: string, invDesc: string, due: string) => {
    // Dynamic import for client side only
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    const invoiceNum = `INV-${Math.floor(Math.random() * 1000000)}`;
    const dateStr = new Date().toLocaleDateString("fr-FR");

    // Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Blue
    doc.text(type.toUpperCase(), 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Numéro: ${invoiceNum}`, 14, 30);
    doc.text(`Date: ${dateStr}`, 14, 35);
    if (due) doc.text(`Échéance: ${new Date(due).toLocaleDateString("fr-FR")}`, 14, 40);

    // Supplier Info
    let supplierStartY = 20;

    if (userData?.logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = userData.logoUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          doc.addImage(dataUrl, 'PNG', 120, 5, 20, 20);
          supplierStartY = 30; // Shift text down if logo is present
        }
      } catch (e) {
        console.warn("Could not load logo for PDF", e);
      }
    }

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Émetteur :", 120, supplierStartY);
    doc.setFontSize(10);
    doc.setTextColor(100);
    
    let currentY = supplierStartY + 5;
    doc.text(userData?.companyName || userData?.company || userData?.nom || "Bailleur", 120, currentY);
    
    if (userData?.address) {
      currentY += 5;
      doc.text(userData.address, 120, currentY);
    }
    if (userData?.email) {
      currentY += 5;
      doc.text(userData.email, 120, currentY);
    }
    if (userData?.phone) {
      currentY += 5;
      doc.text(userData.phone, 120, currentY);
    }
    if (userData?.rccm) {
      currentY += 5;
      doc.text(`RCCM: ${userData.rccm}`, 120, currentY);
    }
    if (userData?.idNat) {
      currentY += 5;
      doc.text(`ID Nat: ${userData.idNat}`, 120, currentY);
    }
    if (userData?.nif) {
      currentY += 5;
      doc.text(`NIF: ${userData.nif}`, 120, currentY);
    }

    // Client Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Adressé à :", 14, 55);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(tenant.name || "Client", 14, 60);
    if (tenant.email) doc.text(tenant.email, 14, 65);
    if (tenant.phone) doc.text(tenant.phone, 14, 70);

    // Table
    autoTable(doc, {
      startY: 85,
      head: [['Description', 'Quantité', 'Prix Unitaire', 'Total']],
      body: [
        [invDesc || 'Loyer', '1', `$${invAmount}`, `$${invAmount}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Total
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total à payer: $${invAmount}`, 150, finalY + 10);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Merci pour votre confiance - Propulsé par Rayons", 105, 280, { align: 'center' });

    return { doc, invoiceNum };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !amount) return;
    
    setIsSubmitting(true);
    const tenant = tenants.find(t => t.id === selectedTenant);
    if (!tenant) return;
    
    if (!tenant.propertyId) {
      alert("Ce locataire n'est rattaché à aucun bien. Veuillez le rattacher à un bien (appartement/chaise) avant de le facturer.");
      return;
    }

    try {
      // 1. Generate PDF
      const { doc, invoiceNum } = await generatePDF(tenant, invoiceType, amount, description, dueDate);
      
      // 2. Save file
      doc.save(`${invoiceType}_${tenant.name}_${invoiceNum}.pdf`);

      // 3. Save to Firestore
      await addDoc(collection(db, "invoices"), {
        supplierId: user?.uid,
        tenantId: tenant.id,
        tenantName: tenant.name,
        type: invoiceType,
        amount: Number(amount),
        description,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        invoiceNum,
        createdAt: serverTimestamp(),
        status: "SENT"
      });

      setShowModal(false);
      setSelectedTenant("");
      setAmount("");
      setDescription("");
      setDueDate("");
    } catch (error) {
      console.error("Error generating invoice:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenant(tenantId);
    const t = tenants.find(x => x.id === tenantId);
    if (t) {
      setAmount(t.rentAmount ? t.rentAmount.toString() : "");
      
      if (t.propertyName) {
        setDescription(`Loyer pour ${new Date().toLocaleString('fr-FR', { month: 'long' })} - ${t.propertyName}`);
      } else {
        setDescription(`Loyer pour ${new Date().toLocaleString('fr-FR', { month: 'long' })}`);
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Facturation & Proformas</h1>
          <p className="text-gray-400 text-sm mt-1">Générez des documents professionnels pour vos locataires.</p>
        </div>
        
        {(!userData?.rccm || !userData?.nif || !userData?.logoUrl || !userData?.idNat) ? (
          <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-red-400 text-sm font-medium">
            Complétez votre profil légal (RCCM, NIF, Logo) dans les paramètres pour facturer.
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            <span>Nouveau Document</span>
          </button>
        )}
      </div>

      {/* Hero Empty State for the moment (Historique will go here later) */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-blue-500">
          <FileText size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Historique des factures</h2>
        <p className="text-gray-400 text-sm max-w-md">
          Retrouvez ici l'historique des factures et proformas générés. Cliquez sur "Nouveau Document" pour commencer.
        </p>
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
              <h2 className="text-lg font-bold text-white">Créer un document</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Type de document</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInvoiceType("Facture")}
                    className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                      invoiceType === "Facture" ? "bg-blue-600/20 border-blue-500 text-blue-500" : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    Facture
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceType("Proforma")}
                    className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                      invoiceType === "Proforma" ? "bg-purple-600/20 border-purple-500 text-purple-500" : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    Proforma
                  </button>
                </div>
              </div>

              {/* Locataire */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Locataire / Client</label>
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
                      <option key={t.id} value={t.id} disabled={!t.propertyId}>
                        {t.name} {t.propertyName ? `(${t.propertyName})` : '(Aucun bien rattaché - Invalide)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Montant ($)</label>
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Loyer du mois de Septembre"
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date d'échéance (Optionnel)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <ModalActions 
                onCancel={() => setShowModal(false)}
                isSubmitting={isSubmitting}
                submitIcon="download"
                submitText="Créer la facture"
              />
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
