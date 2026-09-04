"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, X, Search, Home, Image as ImageIcon, AlertCircle, 
  MapPin, CheckCircle, XCircle, Trash2, Building 
} from "lucide-react";
import { useProductAiAssistant, handleImageUploadShared } from "@/hooks/useProductAiAssistant";
import AiAssistantChat from "@/components/shared/AiAssistantChat";
import ImageUploadArea from "@/components/shared/ImageUploadArea";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, getDocs, addDoc, updateDoc, 
  deleteDoc, doc, serverTimestamp, orderBy, onSnapshot 
} from "firebase/firestore";
import { useCurrency } from "@/context/CurrencyContext";

interface PropertyManagerProps {
  isAdmin: boolean;
}

export default function PropertyManager({ isAdmin }: PropertyManagerProps) {
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();
  
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [typeTransaction, setTypeTransaction] = useState("Vente");
  const [propertyPrice, setPropertyPrice] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [propertyCoords, setPropertyCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [propertyDesc, setPropertyDesc] = useState("");

  const {
    chatMessages,
    chatInput,
    setChatInput,
    isAiLoading,
    analyzeImage,
    handleSendMessage,
    resetChat
  } = useProductAiAssistant({
    onAiDataParsed: (autoFill) => {
      if (autoFill.title) setPropertyTitle(autoFill.title.fr || autoFill.title);
      if (autoFill.category) setPropertyType(autoFill.category);
      if (autoFill.price) setPropertyPrice(autoFill.price);
      if (autoFill.description) setPropertyDesc(autoFill.description);
    },
    apiEndpoint: '/api/ai/product-assistant'
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Structure Dynamique (Niveaux, Appartements, Bureaux, Chaises)
  const [levels, setLevels] = useState<{
    id: string;
    name: string;
    units: {
      id: string;
      name: string;
      type: string;
      capacity: number;
    }[]
  }[]>([]);

  // Fetch properties
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    let unsubscribe = () => {};

    if (isAdmin) {
      // Admin: Fetch all properties, real-time
      const q = query(collection(db, "properties"), orderBy("createdAt", "desc"));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedProperties: any[] = [];
        snapshot.forEach((docSnap) => {
          fetchedProperties.push({ id: docSnap.id, ...docSnap.data() });
        });
        setProperties(fetchedProperties);
        setIsLoading(false);
      });
    } else {
      // Supplier: Fetch only their properties
      const q = query(collection(db, "properties"), where("supplierId", "==", user.uid));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const prods: any[] = [];
        snapshot.forEach(docSnap => prods.push({ id: docSnap.id, ...docSnap.data() }));
        setProperties(prods);
        setIsLoading(false);
      });
    }

    return () => unsubscribe();
  }, [user, isAdmin]);

  const resetForm = () => {
    setEditingId(null);
    setPropertyTitle("");
    setPropertyType("");
    setTypeTransaction("Vente");
    setPropertyPrice("");
    setPropertyLocation("");
    setPropertyCoords(null);
    setPropertyDesc("");
    setLevels([]);
    setImagePreview(null);
    setImageFile(null);
    resetChat();
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleGetLocation = () => {
    setIsFetchingGps(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPropertyCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsFetchingGps(false);
        },
        (error) => {
          console.error("Erreur GPS:", error);
          alert("Impossible de récupérer la position. Assurez-vous d'avoir autorisé l'accès au GPS.");
          setIsFetchingGps(false);
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      setIsFetchingGps(false);
    }
  };

  const handleAddLevel = () => {
    setLevels([...levels, { id: Date.now().toString(), name: `Niveau ${levels.length + 1}`, units: [] }]);
  };

  const handleRemoveLevel = (lIndex: number) => {
    const newLevels = [...levels];
    newLevels.splice(lIndex, 1);
    setLevels(newLevels);
  };

  const handleUpdateLevelName = (lIndex: number, name: string) => {
    const newLevels = [...levels];
    newLevels[lIndex].name = name;
    setLevels(newLevels);
  };

  const handleAddUnit = (lIndex: number) => {
    const newLevels = [...levels];
    newLevels[lIndex].units.push({
      id: Date.now().toString(),
      name: "",
      type: "appartement",
      capacity: 1
    });
    setLevels(newLevels);
  };

  const handleRemoveUnit = (lIndex: number, uIndex: number) => {
    const newLevels = [...levels];
    newLevels[lIndex].units.splice(uIndex, 1);
    setLevels(newLevels);
  };

  const handleUpdateUnit = (lIndex: number, uIndex: number, field: string, value: any) => {
    const newLevels = [...levels];
    newLevels[lIndex].units[uIndex] = { ...newLevels[lIndex].units[uIndex], [field]: value };
    setLevels(newLevels);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUploadShared(
      e,
      setImageFile,
      setImagePreview,
      analyzeImage,
      "Voici la photo de ma propriété immobilière. Peux-tu l'analyser pour vérifier si elle est pertinente, et m'aider à créer une bonne description ? Si la photo ne ressemble pas à un bien immobilier, dis-le moi."
    );
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);

    const propertyData = {
      title: { fr: propertyTitle, en: propertyTitle }, // Simulating i18n
      type: propertyType,
      typeTransaction,
      price: parseFloat(propertyPrice.toString().replace(/[^0-9.]/g, '') || "0"),
      location: propertyLocation,
      description: propertyDesc,
      image: imagePreview || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800",
      propertyCoords: propertyCoords,
      supplierId: user.uid,
      immoDetails: {
        area: 0,
        beds: 0,
        baths: 0,
        levels: levels
      }
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "properties", editingId), propertyData);
      } else {
        await addDoc(collection(db, "properties"), {
          ...propertyData,
          status: isAdmin ? "Disponible" : "PENDING_APPROVAL",
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde de la propriété:", error);
      alert("Une erreur est survenue: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette propriété ? Cette action est irréversible.")) {
      try {
        await deleteDoc(doc(db, "properties", id));
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const handleApproveProperty = async (property: any) => {
    if (!isAdmin) return;
    if (confirm("Approuver et publier ce bien immobilier ?")) {
      try {
        await updateDoc(doc(db, "properties", property.id), {
          status: "Disponible" 
        });

        if (property.supplierId) {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "PROPERTY_APPROVED",
              supplierId: property.supplierId
            })
          });
        }
      } catch (error) {
        console.error("Error approving property", error);
        alert("Erreur lors de l'approbation.");
      }
    }
  };

  const handleRejectProperty = async (id: string) => {
    if (!isAdmin) return;
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

  const filteredProperties = properties.filter(p => {
    const title = getTitle(p.title).toLowerCase();
    return title.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building className="text-blue-500" /> 
            {isAdmin ? "Gestion de l'Immobilier" : "Mes Propriétés"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isAdmin 
              ? "Validez et gérez toutes les annonces immobilières de la plateforme."
              : "Gérez vos biens immobiliers et publiez-les dans le rayon Immo."
            }
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAddModal}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center hover:bg-primary-light transition-colors shadow-sm"
          >
            <Plus size={18} className="mr-2" /> Ajouter une propriété
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Propriétés</p>
            <p className="text-2xl font-bold text-white mt-1">{properties.length}</p>
          </div>
          <div className="p-3 bg-blue-400/10 text-blue-400 rounded-lg">
            <Home size={20} />
          </div>
        </div>
        {!isAdmin && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Propriétés Vides / En attente</p>
              <p className="text-2xl font-bold text-white mt-1">{properties.filter(p => p.status !== 'Disponible').length}</p>
            </div>
            <div className="p-3 bg-green-400/10 text-green-400 rounded-lg">
              <AlertCircle size={20} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl shadow-sm border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher une propriété..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm transition-all"
            />
          </div>
        </div>

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
              {isLoading ? (
                <tr><td colSpan={7} className="p-12 text-center text-gray-500 font-medium">Chargement...</td></tr>
              ) : filteredProperties.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-gray-500 font-medium">Aucune propriété trouvée.</td></tr>
              ) : (
                filteredProperties.map((property) => (
                  <tr key={property.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center">
                        {property.image ? (
                           // eslint-disable-next-line @next/next/no-img-element
                           <img src={property.image} alt="bien immo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                           <Home size={16} className="text-primary-light" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-white">
                      <span className="line-clamp-1">{getTitle(property.title)}</span>
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
                    <td className="p-4 text-right whitespace-nowrap">
                      {isAdmin && (property.status !== "Disponible") && (
                        <>
                          <button 
                            onClick={() => handleApproveProperty(property)}
                            title="Approuver et Publier"
                            className="inline-flex p-2 bg-white/5 text-orange-500 hover:text-white rounded-lg hover:bg-green-500 transition-colors border border-transparent hover:border-green-500 mr-2"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleRejectProperty(property.id)}
                            title="Rejeter"
                            className="inline-flex p-2 bg-white/5 text-red-500 hover:text-white rounded-lg hover:bg-red-500 transition-colors border border-transparent hover:border-red-500 mr-2"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDeleteProperty(property.id)}
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

      {/* Create Property Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[#140b2e] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] my-4"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-[#140b2e]">
                <h2 className="text-xl font-semibold text-white">Ajouter une propriété</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveProperty} className="p-4 space-y-5 overflow-y-auto scrollbar-hide">
                
                {/* Image Upload Area */}
                <ImageUploadArea
                  imagePreview={imagePreview}
                  fileInputRef={fileInputRef}
                  handleImageUpload={handleImageUpload}
                  onClear={() => {
                    setImagePreview(null);
                    setImageFile(null);
                    resetChat();
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  onUrlChange={(url) => setImagePreview(url)}
                />

                <div className="space-y-4">
                  {/* AI Chat Assistant */}
                  {imageFile && (
                    <AiAssistantChat 
                      title="Assistant IA Immo"
                      chatMessages={chatMessages}
                      chatInput={chatInput}
                      setChatInput={setChatInput}
                      isAiLoading={isAiLoading}
                      handleSendMessage={handleSendMessage}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-300">Titre de l'annonce</label>
                    <input
                      type="text"
                      required
                      value={propertyTitle}
                      onChange={(e) => setPropertyTitle(e.target.value)}
                      placeholder="Ex: Bel appartement 3 pièces"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Type de bien</label>
                    <select required value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white">
                      <option value="">Sélectionner</option>
                      <option value="appartement">Appartement</option>
                      <option value="maison">Maison / Villa</option>
                      <option value="studio">Studio</option>
                      <option value="terrain">Terrain</option>
                      <option value="commercial">Local Commercial</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Type de Transaction</label>
                    <select required value={typeTransaction} onChange={(e) => setTypeTransaction(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white">
                      <option value="Vente">À Vendre</option>
                      <option value="Location">À Louer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Loyer / Prix ({currency})</label>
                    <input
                      type="text"
                      required
                      value={propertyPrice}
                      onChange={(e) => setPropertyPrice(e.target.value)}
                      placeholder="Ex: 500"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Localisation</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={propertyLocation}
                        onChange={(e) => setPropertyLocation(e.target.value)}
                        placeholder="Ex: Gombe, Kinshasa"
                        className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Coordonnées GPS de la propriété (Requis pour l'itinéraire visiteur)</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isFetchingGps}
                      className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <MapPin size={16} />
                      {isFetchingGps ? "Recherche en cours..." : "📍 Obtenir ma position actuelle"}
                    </button>
                    {propertyCoords && (
                      <span className="text-xs text-green-400 font-medium">
                        ✓ Position enregistrée ({propertyCoords.lat.toFixed(4)}, {propertyCoords.lng.toFixed(4)})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">Position qui sera partagée au visiteur pour générer son itinéraire depuis son point de départ.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Description détaillée</label>
                  <textarea
                    rows={4}
                    value={propertyDesc}
                    onChange={(e) => setPropertyDesc(e.target.value)}
                    placeholder="Décrivez les atouts de votre bien (nombre de pièces, salle de bain, commodités...)"
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  ></textarea>
                </div>

                {/* Dynamic Structure Builder */}
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-300">Structure du bâtiment (Niveaux, Appartements, Bureaux)</label>
                    <button 
                      type="button" 
                      onClick={handleAddLevel} 
                      className="text-xs bg-primary/20 hover:bg-primary/40 transition-colors text-primary-light px-3 py-1.5 rounded-lg flex items-center space-x-1"
                    >
                      <Plus size={14} /> <span>Ajouter un niveau</span>
                    </button>
                  </div>
                  
                  {levels.length === 0 && (
                     <p className="text-xs text-gray-500 italic">Aucun niveau défini. (Optionnel)</p>
                  )}

                  {levels.map((level, lIndex) => (
                    <div key={level.id} className="p-4 bg-black/20 border border-white/10 rounded-xl space-y-4">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={level.name} 
                          onChange={(e) => handleUpdateLevelName(lIndex, e.target.value)} 
                          placeholder="Nom du niveau (ex: RDC, 1er Étage)" 
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary" 
                        />
                        <button type="button" onClick={() => handleRemoveLevel(lIndex)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                          <X size={16}/>
                        </button>
                      </div>
                      
                      <div className="pl-4 ml-2 border-l-2 border-white/10 space-y-3">
                         {level.units.map((unit, uIndex) => (
                             <div key={unit.id} className="flex flex-col sm:flex-row gap-2">
                                <input 
                                  type="text" 
                                  value={unit.name} 
                                  onChange={(e) => handleUpdateUnit(lIndex, uIndex, 'name', e.target.value)}
                                  placeholder="Nom (ex: Appt 1A, Bureau 1)"
                                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
                                />
                                <select 
                                  value={unit.type} 
                                  onChange={(e) => handleUpdateUnit(lIndex, uIndex, 'type', e.target.value)}
                                  className="w-full sm:w-32 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none [&>option]:bg-[#140b2e]"
                                >
                                  <option value="appartement">Appart. / Local</option>
                                  <option value="bureau">Bureau</option>
                                  <option value="chaise">Poste/Chaise</option>
                                </select>
                                {unit.type !== 'appartement' && (
                                  <input 
                                    type="number" 
                                    value={unit.capacity} 
                                    onChange={(e) => handleUpdateUnit(lIndex, uIndex, 'capacity', parseInt(e.target.value) || 1)}
                                    title="Nombre de places/chaises"
                                    className="w-full sm:w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none"
                                  />
                                )}
                                <button type="button" onClick={() => handleRemoveUnit(lIndex, uIndex)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg flex items-center justify-center shrink-0">
                                  <X size={16}/>
                                </button>
                             </div>
                         ))}
                         <button 
                           type="button" 
                           onClick={() => handleAddUnit(lIndex)} 
                           className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
                         >
                           <Plus size={12} /> <span>Ajouter une sous-unité</span>
                         </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-end space-x-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-6 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isProcessing ? "Traitement..." : (isAdmin ? "Sauvegarder l'annonce" : "Publier l'annonce")}
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
