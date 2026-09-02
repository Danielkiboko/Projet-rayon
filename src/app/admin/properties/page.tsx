"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  ShieldAlert,
  Trash2,
  XCircle,
  CheckCircle,
  Building,
  MapPin
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useCurrency } from "@/context/CurrencyContext";

type Property = {
  id: string;
  title: { fr: string; en: string } | string;
  price: string | number;
  image: string;
  type: string;
  location: string;
  status: string;
  supplierId?: string;
  rejectionReason?: string;
  [key: string]: any;
};

export default function AdminPropertiesPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [properties, setProperties] = useState<Property[]>([]);
  
  // Protect route for Super Admin and authorized SUB_ADMINs
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        const isSuperAdmin = user.email === "danielkiboko218@gmail.com";
        const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN";
        
        if (!isSuperAdmin && !isAuthorizedSubAdmin) {
          router.push("/");
        }
      }
    }
  }, [user, userData, loading, router]);

  // Fetch properties
  useEffect(() => {
    if (!user || !userData) return;
    const isSuperAdmin = user.email === "danielkiboko218@gmail.com";
    const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN";
    if (!isSuperAdmin && !isAuthorizedSubAdmin) return;

    const q = query(collection(db, "properties"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProperties: Property[] = [];
      snapshot.forEach((docSnap) => {
        fetchedProperties.push({ id: docSnap.id, ...docSnap.data() } as Property);
      });
      setProperties(fetchedProperties);
    }, (error) => {
      console.error("Error fetching properties:", error);
    });

    return () => unsubscribe();
  }, [user, userData]);

  const handleDeleteProperty = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette annonce immobilière ? Cette action est irréversible.")) {
      try {
        await deleteDoc(doc(db, "properties", id));
      } catch (error) {
        console.error("Error deleting property", error);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const handleApproveProperty = async (id: string) => {
    if (confirm("Approuver et publier ce bien immobilier ?")) {
      try {
        await updateDoc(doc(db, "properties", id), {
          status: "Disponible" 
        });
      } catch (error) {
        console.error("Error approving property", error);
        alert("Erreur lors de l'approbation.");
      }
    }
  };

  const handleRejectProperty = async (id: string) => {
    const reason = prompt("Motif de rejet (sera visible par le fournisseur) :");
    if (reason !== null) {
      try {
        await updateDoc(doc(db, "properties", id), {
          status: "REJECTED",
          rejectionReason: reason
        });
      } catch (error) {
        console.error("Error rejecting property", error);
        alert("Erreur lors du rejet.");
      }
    }
  };

  const getTitle = (titleObj: Record<string, string> | string | null | undefined) => {
    if (typeof titleObj === 'object' && titleObj !== null) {
      return titleObj.fr || titleObj.en || "Sans titre";
    }
    return titleObj || "Sans titre";
  };

  const isSuperAdmin = user?.email === "danielkiboko218@gmail.com";
  const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN";

  if (loading || !user || (!isSuperAdmin && !isAuthorizedSubAdmin)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-white flex flex-col items-center">
          <ShieldAlert size={48} className="text-gray-500 mb-4 animate-pulse" />
          <p>Vérification des accès sécurisés...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building className="text-blue-500" /> Gestion de l'Immobilier
          </h2>
          <p className="text-gray-400 mt-1 text-sm">Validez et gérez toutes les annonces immobilières de la plateforme.</p>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-[#1a1a1a] rounded-2xl shadow-sm border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                <th className="p-4 w-16">Image</th>
                <th className="p-4">Titre de l'annonce</th>
                <th className="p-4">Type</th>
                <th className="p-4">Localisation</th>
                <th className="p-4">Prix/Loyer</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-300">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500 font-medium">
                    Aucune annonce immobilière n'a été trouvée.
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr key={property.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={property.image} alt="bien immo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {getTitle(property.title)}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500 uppercase tracking-wider">
                        {property.type || "Non défini"}
                      </span>
                    </td>
                    <td className="p-4 flex items-center gap-1">
                      <MapPin size={14} className="text-gray-400" />
                      {property.location || "-"}
                    </td>
                    <td className="p-4 font-bold text-white">
                      {typeof property.price === "number" ? formatPrice(property.price) : property.price}
                    </td>
                    <td className="p-4">
                      {property.status === "PENDING_APPROVAL" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-500/10 text-orange-500 uppercase tracking-wider">
                          En attente
                        </span>
                      ) : property.status === "Disponible" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-500/10 text-green-500 uppercase tracking-wider">
                          Publié
                        </span>
                      ) : property.status === "REJECTED" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-500 uppercase tracking-wider">
                          Rejeté
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-gray-300 uppercase tracking-wider">
                          {property.status || "Inconnu"}
                        </span>
                      )}
                      {property.status === "REJECTED" && property.rejectionReason && (
                        <div className="text-xs text-red-400 mt-1">Motif: {property.rejectionReason}</div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {(property.status !== "Disponible") && (
                        <>
                          <button 
                            onClick={() => handleApproveProperty(property.id)}
                            title="Approuver et Publier"
                            className="inline-flex p-2 bg-white/5 text-orange-500 hover:text-white rounded-lg hover:bg-green-500 transition-colors border border-transparent hover:border-green-500"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleRejectProperty(property.id)}
                            title="Rejeter"
                            className="inline-flex p-2 bg-white/5 text-red-500 hover:text-white rounded-lg hover:bg-red-500 transition-colors border border-transparent hover:border-red-500"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDeleteProperty(property.id)}
                        title="Supprimer"
                        className="inline-flex p-2 bg-white/5 text-gray-400 hover:text-white rounded-lg hover:bg-red-600 transition-colors border border-transparent hover:border-red-600 ml-1"
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
    </>
  );
}
