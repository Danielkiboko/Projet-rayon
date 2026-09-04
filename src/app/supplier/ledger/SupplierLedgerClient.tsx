"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Download, Filter, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SupplierLedgerClient() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "payments"),
      where("supplierId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      let runningBalance = 0;

      // Firestore returns desc order. To calculate running balance properly, 
      // we need ascending order (oldest first). We reverse it.
      const rawDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any })).reverse();
      
      rawDocs.forEach(dataItem => {
        // Assume mostly COMPLETED are booked
        if (dataItem.status === "COMPLETED" || dataItem.status === "REFUNDED") {
           const amount = dataItem.amount || 0;
           const isCredit = amount >= 0 && dataItem.status !== "REFUNDED";
           const value = Math.abs(amount);

           runningBalance += isCredit ? value : -value;

           data.push({
             id: dataItem.id,
             date: dataItem.createdAt ? new Date((dataItem.createdAt.seconds || dataItem.createdAt._seconds) * 1000) : new Date(),
             description: `Paiement ${dataItem.tenantName ? `de ${dataItem.tenantName}` : ''} ${dataItem.propertyTitle ? `pour ${dataItem.propertyTitle}` : ''}`,
             debit: !isCredit ? value : 0,
             credit: isCredit ? value : 0,
             balance: runningBalance,
             status: dataItem.status
           });
        }
      });

      // Reverse back to show newest first in the UI
      setTransactions(data.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Filter transactions based on date and search
  const filteredTransactions = transactions.filter(t => {
    let matchesSearch = true;
    let matchesDate = true;

    if (searchTerm) {
      matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    }

    if (startDate) {
      matchesDate = matchesDate && t.date >= new Date(startDate);
    }
    if (endDate) {
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && t.date <= endD;
    }

    return matchesSearch && matchesDate;
  });

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Livre de Caisse / Journal des Activités", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Généré le : ${new Date().toLocaleDateString("fr-FR")}`, 14, 30);
    if (startDate || endDate) {
      doc.text(`Période : ${startDate || "Début"} au ${endDate || "Fin"}`, 14, 36);
    }

    const tableColumn = ["Date", "Libellé", "Débit (D)", "Crédit (C)", "Solde"];
    const tableRows = filteredTransactions.map(t => [
      t.date.toLocaleDateString("fr-FR"),
      t.description,
      t.debit > 0 ? `$${t.debit.toFixed(2)}` : "-",
      t.credit > 0 ? `$${t.credit.toFixed(2)}` : "-",
      `$${t.balance.toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }, // Slate 900
    });

    doc.save(`livre_de_caisse_${new Date().getTime()}.pdf`);
  };

  const downloadCSV = () => {
    const headers = ["Date", "Libelle", "Debit", "Credit", "Solde"];
    const rows = filteredTransactions.map(t => [
      t.date.toLocaleDateString("fr-FR"),
      `"${t.description}"`, // Escape quotes
      t.debit,
      t.credit,
      t.balance
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `livre_de_caisse_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="text-white animate-pulse">Chargement du journal des activités...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Livre de Caisse</h1>
          <p className="text-sm text-gray-400 mt-1">Journal des activités financières (Débits et Crédits)</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={downloadCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors flex-1 sm:flex-none border border-white/10"
          >
            <Download size={16} />
            CSV
          </button>
          <button 
            onClick={downloadPDF}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors flex-1 sm:flex-none shadow-lg shadow-amber-900/20"
          >
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-black/20 border border-white/10 rounded-lg px-3 py-2 w-full md:w-64">
              <Search size={16} className="text-gray-500 mr-2" />
              <input 
                type="text" 
                placeholder="Rechercher un libellé..." 
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Filter size={16} />
              <span>Période:</span>
            </div>
            <input 
              type="date" 
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500/50 transition-colors"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-gray-500">-</span>
            <input 
              type="date" 
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-amber-500/50 transition-colors"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                <th className="p-4 rounded-tl-lg w-32">Date</th>
                <th className="p-4">Libellé</th>
                <th className="p-4 w-32 text-right">Débit (D)</th>
                <th className="p-4 w-32 text-right">Crédit (C)</th>
                <th className="p-4 w-32 text-right rounded-tr-lg">Solde</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-medium">
                    Aucune transaction trouvée pour cette période.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-gray-400">{t.date.toLocaleDateString("fr-FR")}</td>
                    <td className="p-4 text-white font-medium">{t.description}</td>
                    <td className="p-4 text-right font-mono text-orange-400">
                      {t.debit > 0 ? `$${t.debit.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-400">
                      {t.credit > 0 ? `$${t.credit.toFixed(2)}` : "-"}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-white">
                      ${t.balance.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
