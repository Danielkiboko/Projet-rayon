"use client";

import { useState, useEffect } from "react";
import { 
  Hotel, Calendar, Users, Phone, CheckCircle2, Clock, 
  XCircle, Search, DollarSign, LogIn, LogOut, FileText, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, onSnapshot, orderBy, 
  doc, updateDoc, addDoc, serverTimestamp 
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { generateHotelBookingReceiptPDF } from "@/lib/invoiceGenerator";

interface HotelBooking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  supplierId: string;
  clientId?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number | string;
  roomType: string;
  totalPrice?: number;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  createdAt: any;
}

export default function HotelBookingsManager() {
  const { user, userData } = useAuth();
  const activeSupplierId = userData?.parentSupplierId || user?.uid;
  const { formatPrice, currency } = useCurrency();

  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSupplierId) return;

    const q = query(
      collection(db, "hotel_bookings"),
      where("supplierId", "==", activeSupplierId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: HotelBooking[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as HotelBooking);
      });
      // Sort newest first
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.checkInDate || 0).getTime();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.checkInDate || 0).getTime();
        return timeB - timeA;
      });
      setBookings(list);
      setLoading(false);
    }, (error) => {
      console.error("Error loading hotel bookings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeSupplierId]);

  const updateBookingStatus = async (bookingId: string, newStatus: HotelBooking["status"]) => {
    setIsProcessing(bookingId);
    try {
      const ref = doc(db, "hotel_bookings", bookingId);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error updating booking status:", err);
      alert("Erreur lors de la mise à jour de la réservation.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCheckOutAndBill = async (booking: HotelBooking) => {
    const defaultAmount = booking.totalPrice || 100;
    const amountStr = prompt(`Confirmer le Check-out pour ${booking.guestName}.\nMontant du séjour à encaisser ($) :`, defaultAmount.toString());
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return alert("Montant invalide.");

    setIsProcessing(booking.id);
    try {
      // 1. Marquer la réservation comme clôturée
      await updateDoc(doc(db, "hotel_bookings", booking.id), {
        status: "CHECKED_OUT",
        totalPrice: amount,
        checkedOutAt: serverTimestamp()
      });

      // 2. Enregistrer l'encaissement en caisse
      await addDoc(collection(db, "payments"), {
        supplierId: activeSupplierId,
        clientName: booking.guestName,
        clientPhone: booking.guestPhone,
        propertyId: booking.propertyId,
        propertyTitle: booking.propertyTitle,
        amount: amount,
        currency: "USD",
        reference: `Séjour Hôtel : ${booking.roomType} (${booking.checkInDate} au ${booking.checkOutDate})`,
        type: "HOTEL_STAY",
        date: new Date().toISOString(),
        status: "COMPLETED",
        createdAt: serverTimestamp()
      });

      alert("Check-out effectué et encaissement validé dans votre livre de caisse !");
    } catch (err) {
      console.error("Error checking out:", err);
      alert("Erreur lors de la clôture du séjour.");
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = 
      (b.guestName || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.guestPhone || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.propertyTitle || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.roomType || "").toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && b.status === statusFilter;
  });

  const pendingCount = bookings.filter(b => b.status === "PENDING").length;
  const inStayCount = bookings.filter(b => b.status === "CHECKED_IN").length;
  const confirmedCount = bookings.filter(b => b.status === "CONFIRMED").length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">En attente</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">{pendingCount}</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Confirmées</p>
            <p className="text-2xl font-extrabold text-blue-400 mt-1">{confirmedCount}</p>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">En séjour (Chambres occupées)</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">{inStayCount}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <LogIn size={22} />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Total Historique</p>
            <p className="text-2xl font-extrabold text-white mt-1">{bookings.length}</p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Hotel size={22} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white/5 border border-white/10 p-4 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "Toutes" },
            { id: "PENDING", label: `En attente (${pendingCount})` },
            { id: "CONFIRMED", label: `Confirmées (${confirmedCount})` },
            { id: "CHECKED_IN", label: `En séjour (${inStayCount})` },
            { id: "CHECKED_OUT", label: "Clôturées" },
            { id: "CANCELLED", label: "Annulées" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? "bg-amber-500 text-black shadow"
                  : "bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher client, chambre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/30 text-gray-400">
              <tr>
                <th className="px-5 py-3.5">Client & Voyageur</th>
                <th className="px-5 py-3.5">Établissement & Chambre</th>
                <th className="px-5 py-3.5">Dates du Séjour</th>
                <th className="px-5 py-3.5">Personnes</th>
                <th className="px-5 py-3.5">Statut</th>
                <th className="px-5 py-3.5 text-right">Actions Hôtelières</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Chargement des réservations...</td></tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Hotel size={36} className="mx-auto text-gray-500 mb-2 opacity-60" />
                    <p className="font-semibold">Aucune réservation trouvée dans cette catégorie.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{b.guestName}</span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <Phone size={12} className="text-amber-400" />
                        <span>{b.guestPhone}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{b.propertyTitle}</div>
                      <div className="text-xs text-amber-300/80">Type : {b.roomType}</div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-white">
                        <Calendar size={13} className="text-gray-400 shrink-0" />
                        <span>Du <strong>{b.checkInDate}</strong> au <strong>{b.checkOutDate}</strong></span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-300">
                        <Users size={13} className="text-gray-400" />
                        <span>{b.guestsCount || 1} pers.</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        b.status === "PENDING"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : b.status === "CONFIRMED"
                          ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                          : b.status === "CHECKED_IN"
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          : b.status === "CHECKED_OUT"
                          ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                          : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
                      }`}>
                        {b.status === "PENDING" && "En attente"}
                        {b.status === "CONFIRMED" && "Confirmée"}
                        {b.status === "CHECKED_IN" && "En séjour"}
                        {b.status === "CHECKED_OUT" && "Séjour terminé"}
                        {b.status === "CANCELLED" && "Annulée"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {b.status === "PENDING" && (
                          <>
                            <button
                              disabled={isProcessing === b.id}
                              onClick={() => updateBookingStatus(b.id, "CONFIRMED")}
                              className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                            >
                              <CheckCircle2 size={13} />
                              <span>Confirmer</span>
                            </button>
                            <button
                              disabled={isProcessing === b.id}
                              onClick={() => updateBookingStatus(b.id, "CANCELLED")}
                              className="px-2 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-lg text-xs transition-all"
                            >
                              <span>Refuser</span>
                            </button>
                          </>
                        )}

                        {b.status === "CONFIRMED" && (
                          <button
                            disabled={isProcessing === b.id}
                            onClick={() => updateBookingStatus(b.id, "CHECKED_IN")}
                            className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <LogIn size={13} />
                            <span>Check-in</span>
                          </button>
                        )}

                        {b.status === "CHECKED_IN" && (
                          <button
                            disabled={isProcessing === b.id}
                            onClick={() => handleCheckOutAndBill(b)}
                            className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-lg text-xs font-bold flex items-center gap-1 shadow transition-all"
                          >
                            <LogOut size={13} />
                            <span>Check-out & Encaisser</span>
                          </button>
                        )}

                        {b.status === "CHECKED_OUT" && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <DollarSign size={13} className="text-emerald-400" />
                            <span>Encaissé {b.totalPrice ? `(${b.totalPrice} $)` : ""}</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => generateHotelBookingReceiptPDF(b)}
                          title="Télécharger le bon de réservation / reçu officiel PDF"
                          className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-white/10 rounded-lg transition-colors ml-1"
                        >
                          <FileText size={15} />
                        </button>
                      </div>
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
