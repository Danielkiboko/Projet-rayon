"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Package, Calendar, MessageSquare, LogOut } from "lucide-react";
import Link from "next/link";

export default function ClientDashboard() {
  const { user, userData, signOut } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"orders" | "visits" | "messages">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  // TODO: Add chat list

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    // Fetch Orders
    const qOrders = query(
      collection(db, "orders"),
      where("clientId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(fetchedOrders);
    });

    // Fetch Visits
    const qVisits = query(
      collection(db, "visits"),
      where("clientId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubVisits = onSnapshot(qVisits, (snapshot) => {
      const fetchedVisits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVisits(fetchedVisits);
    });

    return () => {
      unsubOrders();
      unsubVisits();
    };
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  if (!user || !userData) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bonjour, {userData.name}</h1>
            <p className="text-gray-500">Bienvenue dans votre espace client</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium shadow-sm"
          >
            <LogOut size={18} />
            Se déconnecter
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-200 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
              activeTab === "orders" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Package size={18} /> Mes Achats
          </button>
          <button
            onClick={() => setActiveTab("visits")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
              activeTab === "visits" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Calendar size={18} /> Mes Visites
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
              activeTab === "messages" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <MessageSquare size={18} /> Messages
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === "orders" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {orders.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Vous n'avez pas encore passé de commande.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {orders.map(order => (
                      <li key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-900">Commande #{order.id.slice(-6)}</span>
                          <span className="text-sm font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                            {order.status || "En cours"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Total : <span className="font-medium text-gray-900">${order.totalAmount}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "visits" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {visits.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Vous n'avez aucune demande de visite.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {visits.map(visit => (
                      <li key={visit.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-900">{visit.propertyTitle}</span>
                          <span className={`text-sm font-medium px-2 py-1 rounded-md ${
                            visit.status === "APPROVED" ? "bg-green-100 text-green-700" :
                            visit.status === "PENDING" ? "bg-orange-100 text-orange-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {visit.status === "APPROVED" ? "Validée" : visit.status === "PENDING" ? "En attente" : visit.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 flex justify-between items-center mt-4">
                          <span>Date souhaitée : {visit.requestedDate || "Non spécifiée"}</span>
                          <Link href={`/dashboard/client/chats?supplierId=${visit.supplierId}`} className="text-primary hover:underline font-medium text-sm">
                            Contacter l'agent
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "messages" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Vos discussions</h3>
                <p className="text-gray-500 mb-6">Échangez directement avec les agents immobiliers pour vos visites.</p>
                <Link href="/dashboard/client/chats" className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors">
                  Ouvrir la messagerie
                </Link>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
