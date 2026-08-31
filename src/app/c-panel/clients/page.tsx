"use client";

import { useState, useEffect } from "react";
import { Search, Users as UsersIcon, UserCheck, UserX, Clock } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  isOnline: boolean;
  lastConnection: Date | null;
  role?: string;
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to max 50 users to prevent quota exhaustion on free tier
    const q = query(collection(db, "users"), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData: ClientData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filter out staff roles
        const role = data.role?.toUpperCase();
        if (role && ["ADMIN", "SUPER_ADMIN", "SUB_ADMIN", "SUPPLIER", "FOURNISSEUR", "DRIVER", "DELIVERY", "LIVREUR"].includes(role)) {
          return;
        }

        let lastConn = null;
        if (data.lastConnection) {
          lastConn = data.lastConnection.toDate();
        }

        clientsData.push({
          id: doc.id,
          name: data.displayName || data.firstName || "Client Anonyme",
          email: data.email || "Non renseigné",
          phone: data.phoneNumber || data.phone || "Non renseigné",
          isOnline: !!data.isOnline,
          lastConnection: lastConn,
          role: data.role || "CLIENT"
        });
      });
      
      // Sort by online status first, then by last connection
      clientsData.sort((a, b) => {
        if (a.isOnline === b.isOnline) {
          if (!a.lastConnection) return 1;
          if (!b.lastConnection) return -1;
          return b.lastConnection.getTime() - a.lastConnection.getTime();
        }
        return a.isOnline ? -1 : 1;
      });

      setClients(clientsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching clients:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date: Date | null) => {
    if (!date) return "Jamais";
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const activeClientsCount = clients.filter(c => c.isOnline).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients & Utilisateurs</h1>
          <p className="text-sm text-gray-400">Suivez l'activité et le statut de vos clients en temps réel.</p>
        </div>
        
        <div className="flex space-x-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between min-w-[150px]">
            <div>
              <p className="text-sm text-gray-400">Total Clients</p>
              <p className="text-2xl font-bold text-white mt-1">{clients.length}</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <UsersIcon size={20} />
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between min-w-[150px]">
            <div>
              <p className="text-sm text-gray-400">En Ligne</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{activeClientsCount}</p>
            </div>
            <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
              <UserCheck size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
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
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Dernière connexion</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Chargement des données en temps réel...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Aucun client trouvé.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{client.name}</div>
                        <div className="text-xs text-gray-500">ID: {client.id.substring(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{client.email}</div>
                      <div className="text-xs text-gray-400 mt-1">{client.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {client.isOnline ? (
                        <span className="flex items-center space-x-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full w-fit">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          <span className="text-xs font-semibold">En Ligne</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-2 text-gray-400 bg-gray-400/10 px-3 py-1 rounded-full w-fit">
                          <UserX size={14} />
                          <span className="text-xs font-semibold">Hors ligne</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Clock size={16} />
                        <span>{formatDate(client.lastConnection)}</span>
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
