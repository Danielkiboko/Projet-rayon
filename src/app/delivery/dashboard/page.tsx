"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Package, MapPin, CheckCircle, LogOut, Navigation } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

export default function DeliveryDashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myOrder, setMyOrder] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Protect route
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch orders
  useEffect(() => {
    if (!user) return;

    // Listen to orders awaiting a driver
    const qAvailable = query(collection(db, "orders"), where("status", "==", "CONFIRMED_AWAITING_DRIVER"));
    const unsubAvailable = onSnapshot(qAvailable, (snapshot) => {
      const orders: any[] = [];
      snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() });
      });
      setAvailableOrders(orders);
    });

    // Listen to the order currently accepted by this driver
    const qMyOrder = query(collection(db, "orders"), where("driverId", "==", user.uid));
    const unsubMyOrder = onSnapshot(qMyOrder, (snapshot) => {
      let activeOrder = null;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.status === "ACCEPTED" || data.status === "ARRIVED_AWAITING_PAYMENT") {
          activeOrder = { id: doc.id, ...data };
        }
      });
      setMyOrder(activeOrder);
    });

    return () => {
      unsubAvailable();
      unsubMyOrder();
    };
  }, [user]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;
  }

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "ACCEPTED",
        driverId: user.uid,
      });
    } catch (error) {
      console.error("Error accepting order", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmArrival = async () => {
    if (!myOrder) return;
    setIsProcessing(true);
    try {
      // 1. Update status
      await updateDoc(doc(db, "orders", myOrder.id), {
        status: "ARRIVED_AWAITING_PAYMENT",
      });

      // 2. Send SMS to client with payment link
      const paymentLink = `${window.location.origin}/checkout/pay/${myOrder.id}`;
      const message = `Rayon: Votre livreur est arrivé ! Veuillez payer le solde de ${myOrder.remainingBalance} AED pour récupérer votre commande. Lien: ${paymentLink}`;
      
      await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: myOrder.clientPhone,
          message: message,
        }),
      });

    } catch (error) {
      console.error("Error confirming arrival", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Header */}
      <div className="bg-gray-900 text-white p-4 sticky top-0 z-10 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-bold">Rayon Livreur</h1>
          <p className="text-xs text-gray-300">Bienvenue, {user?.displayName || "Livreur"}</p>
        </div>
        <button onClick={() => signOut()} className="p-2 bg-gray-800 rounded-full hover:bg-red-600 transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto mt-4">
        {/* Status Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
            <span className="font-semibold text-gray-900">
              {myOrder ? "En course" : "En ligne & prêt"}
            </span>
          </div>
          <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
            {myOrder ? "1 Course active" : `${availableOrders.length} dispo`}
          </span>
        </div>

        {myOrder ? (
          // ACTIVE ORDER VIEW
          <>
            <h2 className="font-bold text-blue-600 uppercase text-xs tracking-wider mt-6 mb-2 flex items-center">
              <Navigation size={14} className="mr-1" /> Course en cours
            </h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden ring-2 ring-blue-50">
              <div className="p-4 border-b border-gray-100 bg-blue-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-blue-900 text-sm">#ORD-{myOrder.id.slice(0, 6).toUpperCase()}</span>
                  <span className="font-bold text-gray-900">{myOrder.remainingBalance} AED</span>
                </div>
                <p className="text-xs text-blue-800 font-medium">Statut: {myOrder.status === "ACCEPTED" ? "En route vers le client" : "Arrivé - En attente du paiement"}</p>
              </div>
              
              <div className="p-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                    <MapPin size={14} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Adresse de livraison (Client)</p>
                    <p className="text-sm font-bold text-gray-900">{myOrder.clientAddress}</p>
                    <p className="text-xs text-gray-600 mt-1">Tel: {myOrder.clientPhone}</p>
                    
                    {myOrder.location && (
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${myOrder.location.lat},${myOrder.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        📍 Ouvrir le GPS (Google Maps)
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                {myOrder.status === "ACCEPTED" ? (
                  <button 
                    onClick={handleConfirmArrival}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-sm active:scale-95 transition-transform flex items-center justify-center"
                  >
                    {isProcessing ? "Patientez..." : "Je suis arrivé (Envoyer SMS Paiement)"}
                  </button>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-500 font-bold py-3.5 rounded-xl flex flex-col items-center justify-center text-sm">
                    <span>En attente du paiement par le client...</span>
                    <span className="text-xs font-normal mt-1 text-gray-400">(La course disparaîtra une fois payée)</span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // AVAILABLE ORDERS VIEW
          <>
            <h2 className="font-bold text-gray-500 uppercase text-xs tracking-wider mt-6 mb-2">Nouvelles courses disponibles</h2>
            
            {availableOrders.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Aucune autre course dans votre zone pour le moment.</p>
              </div>
            ) : (
              availableOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4">
                  <div className="p-4 border-b border-gray-100 bg-orange-50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-orange-700 text-sm">#ORD-{order.id.slice(0, 6).toUpperCase()}</span>
                      <span className="font-bold text-gray-900">{order.remainingBalance} AED</span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                        <MapPin size={14} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Livraison</p>
                        <p className="text-sm font-bold text-gray-900">{order.clientAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button 
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={isProcessing}
                      className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-gray-800 active:scale-95 transition-transform flex items-center justify-center"
                    >
                      <CheckCircle size={18} className="mr-2" /> Accepter la course
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

      </div>
    </div>
  );
}
