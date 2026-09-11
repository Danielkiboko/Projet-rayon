"use client";

import { useState, useEffect } from "react";
import { Plus, X, FileText, Download, Trash2, Calendar, User, Search, Eye, Hotel, Home, CalendarCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";

export default function InvoiceManager() {
  const { user, userData } = useAuth();
  const activeSupplierId = userData?.parentSupplierId || user?.uid;
  const { formatPrice, currency } = useCurrency();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Branch & Filter State
  const [immoBranch, setImmoBranch] = useState<"generic" | "habitation" | "hotel">("habitation");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");

  // Form State
  const [invoiceType, setInvoiceType] = useState<"PROFORMA" | "INVOICE">("PROFORMA");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [items, setItems] = useState<any[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState(0);

  // Hotel Stay Helper State
  const [hotelRoom, setHotelRoom] = useState("");
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [hotelNightlyRate, setHotelNightlyRate] = useState("");
  const [hotelNights, setHotelNights] = useState(1);

  // Habitation Helper State
  const [habitationProperty, setHabitationProperty] = useState("");
  const [habitationPeriod, setHabitationPeriod] = useState("");
  const [habitationMonthlyRent, setHabitationMonthlyRent] = useState("");

  useEffect(() => {
    if (!user || !activeSupplierId) return;

    const q = query(
      collection(db, "invoices"),
      where("supplierId", "==", activeSupplierId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setInvoices(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user, activeSupplierId]);

  const resetForm = () => {
    setImmoBranch("habitation");
    setInvoiceType("PROFORMA");
    setClientName("");
    setClientAddress("");
    setClientPhone("");
    setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    setTaxRate(0);
    setHotelRoom("");
    setHotelCheckIn("");
    setHotelCheckOut("");
    setHotelNightlyRate("");
    setHotelNights(1);
    setHabitationProperty("");
    setHabitationPeriod("");
    setHabitationMonthlyRent("");
  };

  const applyHotelStayToItems = () => {
    if (!hotelRoom || !hotelNightlyRate) {
      alert("Veuillez indiquer au minimum la chambre et le tarif par nuit.");
      return;
    }
    const rate = parseFloat(hotelNightlyRate) || 0;
    const desc = `Séjour ${hotelRoom}${hotelCheckIn && hotelCheckOut ? ` (du ${hotelCheckIn} au ${hotelCheckOut})` : ""}`;
    setItems([
      {
        description: desc,
        quantity: hotelNights > 0 ? hotelNights : 1,
        unitPrice: rate
      }
    ]);
  };

  const applyHabitationRentToItems = () => {
    if (!habitationProperty || !habitationMonthlyRent) {
      alert("Veuillez indiquer au minimum le bien et le montant du loyer.");
      return;
    }
    const rent = parseFloat(habitationMonthlyRent) || 0;
    const desc = `Loyer mensuel - ${habitationProperty}${habitationPeriod ? ` (${habitationPeriod})` : ""}`;
    setItems([
      {
        description: desc,
        quantity: 1,
        unitPrice: rent
      }
    ]);
  };

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + (subtotal * (taxRate / 100));
  };

  const generatePDF = async (invoice: any) => {
    const { default: jsPDF } = await import("jspdf");
    await import("jspdf-autotable");
    
    const docPdf = new jsPDF();
    const isProforma = invoice.type === "PROFORMA";
    const branch = invoice.immoBranch || "generic";
    
    let title = isProforma ? "FACTURE PROFORMA" : "FACTURE";
    if (branch === "hotel") {
      title = isProforma ? "NOTE D'HÔTEL PROFORMA" : "NOTE D'HÔTEL & FACTURE DE SÉJOUR";
    } else if (branch === "habitation") {
      title = isProforma ? "PROFORMA IMMOBILIÈRE" : "QUITTANCE DE LOYER / FACTURE IMMOBILIÈRE";
    }

    docPdf.setFontSize(18);
    docPdf.text(title, 105, 20, { align: "center" });

    docPdf.setFontSize(11);
    docPdf.text(`Fournisseur: ${userData?.displayName || userData?.name || "Rayon Immo & Hospitality"}`, 14, 38);
    if (userData?.rccm) docPdf.text(`RCCM: ${userData.rccm}`, 14, 44);
    if (userData?.idNat) docPdf.text(`Id. Nat: ${userData.idNat}`, 14, 50);
    if (userData?.nif) docPdf.text(`NIF: ${userData.nif}`, 14, 56);

    const clientLabel = branch === "hotel" ? "Voyageur / Client" : (branch === "habitation" ? "Locataire / Client" : "Client");
    docPdf.text(`${clientLabel}: ${invoice.clientName}`, 120, 38);
    docPdf.text(`Adresse: ${invoice.clientAddress || "-"}`, 120, 44);
    docPdf.text(`Tél: ${invoice.clientPhone || "-"}`, 120, 50);
    
    const dateStr = invoice.createdAt ? new Date(invoice.createdAt.seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString();
    docPdf.text(`Date d'émission: ${dateStr}`, 120, 56);

    // Hotel Stay Info in PDF
    let startY = 66;
    if (branch === "hotel" && invoice.stayDetails) {
      docPdf.setFontSize(10);
      docPdf.setTextColor(180, 100, 0);
      docPdf.text(`Détails Séjour: Chambre ${invoice.stayDetails.room || "-"} | Arrivée: ${invoice.stayDetails.checkIn || "-"} | Départ: ${invoice.stayDetails.checkOut || "-"} | ${invoice.stayDetails.nights || 1} nuitée(s)`, 14, 63);
      docPdf.setTextColor(0, 0, 0);
      startY = 68;
    }

    const tableBody = invoice.items.map((item: any) => [
      item.description,
      item.quantity.toString(),
      `${item.unitPrice.toFixed(2)} ${currency}`,
      `${(item.quantity * item.unitPrice).toFixed(2)} ${currency}`
    ]);

    (docPdf as any).autoTable({
      startY: startY,
      head: [['Désignation / Prestation', 'Quantité / Nuitées', 'Prix Unitaire', 'Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: branch === "hotel" ? [180, 120, 30] : (branch === "habitation" ? [20, 110, 60] : [66, 66, 66]) }
    });

    const finalY = (docPdf as any).lastAutoTable.finalY || 70;
    
    docPdf.setFontSize(11);
    docPdf.text(`Sous-total: ${invoice.subtotal.toFixed(2)} ${currency}`, 140, finalY + 10);
    if (invoice.taxRate > 0) {
      docPdf.text(`TVA / Taxe (${invoice.taxRate}%): ${((invoice.subtotal * invoice.taxRate) / 100).toFixed(2)} ${currency}`, 140, finalY + 16);
    }
    docPdf.setFontSize(13);
    docPdf.text(`Total à payer: ${invoice.total.toFixed(2)} ${currency}`, 140, finalY + (invoice.taxRate > 0 ? 24 : 18));

    const prefix = branch === "hotel" ? "Note_Hotel" : (branch === "habitation" ? "Quittance_Loyer" : (isProforma ? "Proforma" : "Facture"));
    docPdf.save(`${prefix}_${invoice.clientName.replace(/\s+/g, '_')}_${dateStr}.pdf`);
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      alert("Veuillez remplir correctement tous les articles (description, quantité > 0, prix > 0).");
      return;
    }

    setIsProcessing(true);
    try {
      const subtotal = calculateSubtotal();
      const total = calculateTotal();

      const invoicePayload: any = {
        supplierId: activeSupplierId,
        type: invoiceType,
        immoBranch,
        clientName,
        clientAddress,
        clientPhone,
        items,
        taxRate,
        subtotal,
        total,
        status: invoiceType === "PROFORMA" ? "DRAFT" : "UNPAID",
        createdAt: serverTimestamp()
      };

      if (immoBranch === "hotel") {
        invoicePayload.stayDetails = {
          room: hotelRoom,
          checkIn: hotelCheckIn,
          checkOut: hotelCheckOut,
          nights: hotelNights,
          nightlyRate: parseFloat(hotelNightlyRate) || 0
        };
      } else if (immoBranch === "habitation") {
        invoicePayload.habitationDetails = {
          property: habitationProperty,
          period: habitationPeriod,
          monthlyRent: parseFloat(habitationMonthlyRent) || 0
        };
      }

      await addDoc(collection(db, "invoices"), invoicePayload);

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce document ?")) {
      try {
        await deleteDoc(doc(db, "invoices", id));
      } catch (error) {
        console.error("Error deleting invoice", error);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.clientName.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedBranchFilter === "all") return true;
    if (selectedBranchFilter === "hotel") return inv.immoBranch === "hotel";
    if (selectedBranchFilter === "habitation") return inv.immoBranch === "habitation";
    return true;
  });

  const habitationCount = invoices.filter(i => i.immoBranch === "habitation").length;
  const hotelCount = invoices.filter(i => i.immoBranch === "hotel").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Proformas & Factures Connectées</h1>
          <p className="text-sm text-gray-400 mt-1">Facturation connectée pour baux d'habitation et séjours hôteliers.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center hover:bg-primary-light transition-colors shadow-sm w-fit"
        >
          <Plus size={18} className="mr-2" /> Créer une facture / note
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setSelectedBranchFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedBranchFilter === "all" ? "bg-white text-gray-950 shadow-sm" : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              Toutes ({invoices.length})
            </button>
            <button
              onClick={() => setSelectedBranchFilter("habitation")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
                selectedBranchFilter === "habitation" ? "bg-emerald-600 text-white shadow-sm" : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              <Home size={13} />
              <span>Habitation ({habitationCount})</span>
            </button>
            <button
              onClick={() => setSelectedBranchFilter("hotel")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
                selectedBranchFilter === "hotel" ? "bg-amber-600 text-white shadow-sm" : "bg-white/5 text-gray-400 hover:text-white"
              }`}
            >
              <Hotel size={13} />
              <span>Hôtellerie ({hotelCount})</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                <th className="p-4 rounded-tl-xl">Type & Branche</th>
                <th className="p-4">Client / Voyageur</th>
                <th className="p-4">Date</th>
                <th className="p-4">Total</th>
                <th className="p-4 text-right rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Chargement...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">Aucun document trouvé.</td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-semibold text-white">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                          inv.type === 'PROFORMA' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {inv.type === "PROFORMA" ? "Proforma" : "Facture"}
                        </span>
                        {inv.immoBranch === "hotel" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded font-medium">
                            <Hotel size={11} /> Note de séjour
                          </span>
                        ) : inv.immoBranch === "habitation" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded font-medium">
                            <Home size={11} /> Quittance loyer
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">{inv.clientName}</div>
                      {inv.stayDetails?.room && (
                        <div className="text-xs text-amber-400/80">Chambre: {inv.stayDetails.room} ({inv.stayDetails.nights || 1} n.)</div>
                      )}
                    </td>
                    <td className="p-4">{inv.createdAt ? new Date(inv.createdAt.seconds * 1000).toLocaleDateString() : "-"}</td>
                    <td className="p-4 font-bold text-white">{formatPrice(inv.total)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => generatePDF(inv)}
                        title="Télécharger PDF officiel"
                        className="inline-flex p-2 bg-white/5 text-gray-400 hover:text-white rounded-lg hover:bg-blue-600 transition-colors border border-transparent hover:border-blue-600"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(inv.id)}
                        className="inline-flex p-2 bg-white/5 text-gray-400 hover:text-white rounded-lg hover:bg-red-600 transition-colors border border-transparent hover:border-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl bg-[#140b2e] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] my-4"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-[#140b2e]">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <FileText className="mr-2 text-primary" size={24}/> Créer un Document Comptable
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveInvoice} className="p-4 space-y-6 overflow-y-auto scrollbar-hide">
                {/* ── Sélecteur de Branche Comptable ── */}
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                    Branche d'activité & type de document
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setImmoBranch("habitation")}
                      className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                        immoBranch === "habitation"
                          ? "bg-emerald-500/20 border-emerald-500 text-white"
                          : "bg-black/20 border-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      <Home size={18} className={immoBranch === "habitation" ? "text-emerald-400" : "text-gray-400"} />
                      <div>
                        <div className="text-sm font-bold">🏠 Habitation (Loyer & Bail)</div>
                        <div className="text-[11px] text-gray-400">Quittances de loyer, cautions, charges</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImmoBranch("hotel")}
                      className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                        immoBranch === "hotel"
                          ? "bg-amber-500/20 border-amber-500 text-white"
                          : "bg-black/20 border-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      <Hotel size={18} className={immoBranch === "hotel" ? "text-amber-400" : "text-gray-400"} />
                      <div>
                        <div className="text-sm font-bold">🏨 Hôtellerie (Nuitées & Séjour)</div>
                        <div className="text-[11px] text-gray-400">Notes d'hôtel, chambres, check-in/out</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" value="PROFORMA" checked={invoiceType === "PROFORMA"} onChange={() => setInvoiceType("PROFORMA")} className="text-primary focus:ring-primary h-4 w-4 bg-black/20 border-white/20"/>
                    <span className="text-white font-medium">Facture Proforma / Devis</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" value="INVOICE" checked={invoiceType === "INVOICE"} onChange={() => setInvoiceType("INVOICE")} className="text-primary focus:ring-primary h-4 w-4 bg-black/20 border-white/20"/>
                    <span className="text-white font-medium">Facture Définitive / Note</span>
                  </label>
                </div>

                {/* ── Assistant Rapide Hôtellerie ── */}
                {immoBranch === "hotel" && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Hotel size={14} /> <span>Assistant Séjour Hôtelier</span>
                      </div>
                      <span className="text-[11px] text-amber-200/70">Calculateur automatique</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-gray-300 block mb-1">Chambre / Suite</label>
                        <input
                          type="text"
                          placeholder="Ex: Suite Deluxe #301"
                          value={hotelRoom}
                          onChange={(e) => setHotelRoom(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-black/30 border border-white/10 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 block mb-1">Arrivée</label>
                        <input
                          type="date"
                          value={hotelCheckIn}
                          onChange={(e) => setHotelCheckIn(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-black/30 border border-white/10 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 block mb-1">Départ</label>
                        <input
                          type="date"
                          value={hotelCheckOut}
                          onChange={(e) => {
                            setHotelCheckOut(e.target.value);
                            if (hotelCheckIn && e.target.value) {
                              const d1 = new Date(hotelCheckIn);
                              const d2 = new Date(e.target.value);
                              const diffTime = Math.abs(d2.getTime() - d1.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
                              setHotelNights(diffDays);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 bg-black/30 border border-white/10 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 block mb-1">Tarif / nuit ($)</label>
                        <input
                          type="number"
                          placeholder="Ex: 80"
                          value={hotelNightlyRate}
                          onChange={(e) => setHotelNightlyRate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-black/30 border border-white/10 rounded text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-amber-200">
                        Total calculé : <strong>{hotelNights} nuit(s) × {hotelNightlyRate || 0}$ = {(hotelNights * (parseFloat(hotelNightlyRate) || 0)).toFixed(2)}$</strong>
                      </span>
                      <button
                        type="button"
                        onClick={applyHotelStayToItems}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded text-xs transition-colors flex items-center gap-1"
                      >
                        <Sparkles size={12} /> Insérer dans la facture
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Assistant Rapide Habitation ── */}
                {immoBranch === "habitation" && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                        <Home size={14} /> <span>Assistant Quittance Habitation</span>
                      </div>
                      <span className="text-[11px] text-emerald-200/70">Calculateur loyer & bail</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-gray-300 block mb-1">Bien / Appartement</label>
                        <input
                          type="text"
                          placeholder="Ex: Villa Gombe Lot #12"
                          value={habitationProperty}
                          onChange={(e) => setHabitationProperty(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-black/30 border border-white/10 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 block mb-1">Période concernée</label>
                        <input
                          type="text"
                          placeholder="Ex: Septembre 2026"
                          value={habitationPeriod}
                          onChange={(e) => setHabitationPeriod(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-black/30 border border-white/10 rounded text-white"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 block mb-1">Loyer mensuel ($)</label>
                        <input
                          type="number"
                          placeholder="Ex: 500"
                          value={habitationMonthlyRent}
                          onChange={(e) => setHabitationMonthlyRent(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-black/30 border border-white/10 rounded text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={applyHabitationRentToItems}
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded text-xs transition-colors flex items-center gap-1"
                      >
                        <Sparkles size={12} /> Insérer dans la facture
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">
                      {immoBranch === "hotel" ? "Nom du Voyageur / Client" : (immoBranch === "habitation" ? "Nom du Locataire / Client" : "Nom du Client / Entreprise")}
                    </label>
                    <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Téléphone (Optionnel)</label>
                    <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-300">Adresse du Client (Optionnel)</label>
                    <input type="text" value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-3">Articles</h3>
                  {items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex-1 w-full">
                        <input type="text" required placeholder="Description de l'article" value={item.description} onChange={e => handleItemChange(index, "description", e.target.value)} className="w-full px-3 py-2 bg-black/30 border border-white/5 rounded-lg focus:outline-none focus:border-primary text-white text-sm" />
                      </div>
                      <div className="w-full sm:w-24">
                        <input type="number" required min="1" placeholder="Qté" value={item.quantity} onChange={e => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-black/30 border border-white/5 rounded-lg focus:outline-none focus:border-primary text-white text-sm text-center" />
                      </div>
                      <div className="w-full sm:w-32">
                        <input type="number" required min="0" step="0.01" placeholder="Prix Unitaire" value={item.unitPrice} onChange={e => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 bg-black/30 border border-white/5 rounded-lg focus:outline-none focus:border-primary text-white text-sm text-right" />
                      </div>
                      {items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors shrink-0">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={handleAddItem} className="mt-2 text-primary hover:text-primary-light text-sm font-semibold flex items-center transition-colors">
                    <Plus size={16} className="mr-1" /> Ajouter une ligne
                  </button>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10">
                  <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between text-gray-300 text-sm">
                      <span>Sous-total</span>
                      <span>{formatPrice(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-gray-300 text-sm items-center">
                      <span>TVA (%)</span>
                      <input type="number" min="0" max="100" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 bg-black/20 border border-white/10 rounded focus:outline-none text-right" />
                    </div>
                    <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
                      <span>TOTAL</span>
                      <span>{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3 border-t border-white/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Annuler</button>
                  <button type="submit" disabled={isProcessing} className="px-6 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center">
                    {isProcessing ? "Enregistrement..." : <><FileText size={18} className="mr-2"/> Enregistrer</>}
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
