"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Search, Home, Image as ImageIcon, AlertCircle, Send, Bot, MapPin } from "lucide-react";
import imageCompression from 'browser-image-compression';

const MOCK_PROPERTIES = [
  { id: "1", title: "Appartement 3 pièces", price: "500 $ / mois", type: "Appartement", status: "Vide", location: "Gombe" },
  { id: "2", title: "Villa avec piscine", price: "2500 $ / mois", type: "Maison", status: "Occupé", location: "Ngaliema" },
  { id: "3", title: "Studio meublé", price: "300 $ / mois", type: "Studio", status: "Vide", location: "Limete" },
];

export default function SupplierPropertiesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatMessages, setChatMessages] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    const fetchProps = async () => {
      try {
        const { collection, query, where, onSnapshot } = await import("firebase/firestore");
        const { db, auth } = await import("@/lib/firebase");
        
        // Attendre que l'auth soit prête (hack basique, onSnapshot gèrera les updates)
        const user = auth.currentUser;
        if (!user) {
          // Si pas co, on met des mocks pour pas casser le design
          setProperties(MOCK_PROPERTIES);
          setIsLoading(false);
          return;
        }

        const q = query(
          collection(db, "products"),
          where("supplierId", "==", user.uid),
          where("category", "==", "immo")
        );

        unsub = onSnapshot(q, (snapshot) => {
          const props: any[] = [];
          snapshot.forEach(doc => {
            props.push({ id: doc.id, ...doc.data() });
          });
          setProperties(props);
          setIsLoading(false);
        });
      } catch (err) {
        console.error(err);
        setIsLoading(false);
      }
    };
    fetchProps();
    return () => unsub();
  }, []);

  const [propertyTitle, setPropertyTitle] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [propertyPrice, setPropertyPrice] = useState("");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [propertyGpsLink, setPropertyGpsLink] = useState("");
  const [propertyDesc, setPropertyDesc] = useState("");

  // Structure Dynamique (Niveaux, Appartements, Bureaux, Chaises)
  const [levels, setLevels] = useState<{
    id: string;
    name: string;
    units: {
      id: string;
      name: string;
      type: string; // "appartement", "bureau", "chaise"
      capacity: number; // For office chairs
    }[]
  }[]>([]);

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


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp"
      };
      
      const compressedFile = await imageCompression(file, options);
      setImageFile(compressedFile);
      
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        setImagePreview(base64data);
        
        setIsAiLoading(true);
        try {
           const res = await fetch('/api/ai/product-assistant', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               message: "Voici la photo de ma propriété immobilière. Peux-tu l'analyser pour vérifier si elle est pertinente, et m'aider à créer une bonne description ? Si la photo ne ressemble pas à un bien immobilier, dis-le moi.",
               imageBase64: base64data,
               imageMimeType: compressedFile.type,
               history: []
             })
           });
           const data = await res.json();
           if (data.text) {
             let aiText = data.text;
             const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/);
             if (jsonMatch) {
               try {
                 const parsed = JSON.parse(jsonMatch[1]);
                 if (parsed.autoFill) {
                   if (parsed.autoFill.title) setPropertyTitle(parsed.autoFill.title);
                   if (parsed.autoFill.category) setPropertyType(parsed.autoFill.category);
                   if (parsed.autoFill.price) setPropertyPrice(parsed.autoFill.price);
                   if (parsed.autoFill.description) setPropertyDesc(parsed.autoFill.description);
                 }
               } catch (e) {
                 console.error("Erreur parsing JSON de l'IA", e);
               }
               aiText = aiText.replace(/```json\n[\s\S]*?\n```/, '').trim();
             }
             
             if (aiText) {
               setChatMessages([
                 { role: 'user', text: 'Image ajoutée.' },
                 { role: 'model', text: aiText }
               ]);
              }
            }
          } catch(err) {
            console.error(err);
            } finally {
               setIsAiLoading(false);
            }
        };
    } catch (error) {
      console.error("Erreur de compression d'image:", error);
    }
  };

  const handleSendMessage = async () => {
     if (!chatInput.trim()) return;
     const newMessages = [...chatMessages, { role: 'user', text: chatInput }];
     setChatMessages(newMessages);
     setChatInput("");
     setIsAiLoading(true);
     
     try {
       const res = await fetch('/api/ai/product-assistant', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           message: chatInput,
           history: newMessages.slice(0, -1)
         })
       });
       const data = await res.json();
       if (data.text) {
         let aiText = data.text;
         const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/);
         if (jsonMatch) {
           try {
             const parsed = JSON.parse(jsonMatch[1]);
             if (parsed.autoFill) {
               if (parsed.autoFill.title) setPropertyTitle(parsed.autoFill.title);
               if (parsed.autoFill.category) setPropertyType(parsed.autoFill.category);
               if (parsed.autoFill.price) setPropertyPrice(parsed.autoFill.price);
               if (parsed.autoFill.description) setPropertyDesc(parsed.autoFill.description);
             }
           } catch (e) {
             console.error("Erreur parsing JSON de l'IA", e);
           }
           aiText = aiText.replace(/```json\n[\s\S]*?\n```/, '').trim();
         }
         if (aiText) {
           setChatMessages([...newMessages, { role: 'model', text: aiText }]);
         }
       }
     } catch (err) {
       console.error(err);
     } finally {
       setIsAiLoading(false);
     }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAiLoading(true); // Reusing loading state for saving
    try {
      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const { auth } = await import("@/lib/firebase");

      const user = auth.currentUser;
      if (!user) throw new Error("Vous devez être connecté.");

      const newProperty = {
        title: { fr: propertyTitle, en: propertyTitle }, // Simulating i18n
        category: "immo",
        type: propertyType,
        price: parseFloat(propertyPrice.replace(/[^0-9.]/g, '') || "0"),
        location: propertyLocation,
        description: propertyDesc,
        image: imagePreview || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800",
        gpsLink: propertyGpsLink,
        supplierId: user.uid,
        createdAt: serverTimestamp(),
        status: "PENDING_APPROVAL",
        // Default immo details for now
        immoDetails: {
          area: 0,
          beds: 0,
          baths: 0,
          levels: levels
        }
      };

      await addDoc(collection(db, "products"), newProperty);
      alert("Propriété publiée avec succès ! Elle est en attente d'approbation par l'administration.");
      
      setIsModalOpen(false);
      setImageFile(null);
      setImagePreview(null);
      setChatMessages([]);
      // Reset form
      setPropertyTitle("");
      setPropertyType("");
      setPropertyPrice("");
      setPropertyLocation("");
      setPropertyGpsLink("");
      setPropertyDesc("");
      setLevels([]);
    } catch (error: any) {
      console.error("Erreur lors de l'ajout de la propriété:", error);
      alert("Une erreur est survenue: " + error.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette propriété ? Cette action est irréversible.")) {
      try {
        const { doc, deleteDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await deleteDoc(doc(db, "products", id));
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Une erreur est survenue lors de la suppression.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mes Propriétés</h1>
          <p className="text-sm text-gray-400">Gérez vos biens immobiliers et publiez-les dans le rayon Immo.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Ajouter une propriété</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Propriétés</p>
            <p className="text-2xl font-bold text-white mt-1">3</p>
          </div>
          <div className="p-3 bg-blue-400/10 text-blue-400 rounded-lg">
            <Home size={20} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Propriétés Vides</p>
            <p className="text-2xl font-bold text-white mt-1">2</p>
          </div>
          <div className="p-3 bg-green-400/10 text-green-400 rounded-lg">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
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
          <select className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="all">Tous les types</option>
            <option value="appartement">Appartement</option>
            <option value="maison">Maison</option>
            <option value="studio">Studio</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/20 text-gray-400">
              <tr>
                <th className="px-6 py-4">Propriété</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Emplacement</th>
                <th className="px-6 py-4">Loyer/Prix</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-4">Chargement...</td></tr>
              ) : properties.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-gray-500">Aucune propriété trouvée.</td></tr>
              ) : (
                properties.map((property) => (
                  <tr key={property.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary-light">
                        <Home size={16} />
                      </div>
                      <span>{property.title?.fr || property.title}</span>
                    </td>
                    <td className="px-6 py-4">{property.type}</td>
                    <td className="px-6 py-4">{property.location}</td>
                    <td className="px-6 py-4">{property.price}</td>
                    <td className="px-6 py-4">
                      <span className={
                        property.status === "Disponible" ? "text-green-400" :
                        property.status === "PENDING_APPROVAL" ? "text-yellow-400" :
                        property.status === "REJECTED" ? "text-red-400" :
                        "text-gray-400"
                      }>
                        {property.status === "PENDING_APPROVAL" ? "En attente" : 
                         property.status === "REJECTED" ? "Rejeté" : 
                         property.status}
                      </span>
                      {property.status === "REJECTED" && property.rejectionReason && (
                         <div className="text-xs text-red-300 mt-1">Motif: {property.rejectionReason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button className="text-primary-light hover:text-white transition-colors">Modifier</button>
                      <button onClick={() => handleDeleteProperty(property.id)} className="text-red-400 hover:text-red-300 transition-colors">Supprimer</button>
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

              <form onSubmit={handleCreateProperty} className="p-4 space-y-5 overflow-y-auto scrollbar-hide">
                
                {/* Image Upload Area */}
                {!imagePreview ? (
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-black/20 relative"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-white/5 rounded-full text-primary-light">
                        <ImageIcon size={32} />
                      </div>
                    </div>
                    <p className="text-white font-medium mb-1">Cliquez pour ajouter une image</p>
                    <p className="text-sm text-gray-400">PNG, JPG ou WEBP (Max 5MB)</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden h-40 bg-black/40 flex items-center justify-center border border-white/10">
                       <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex justify-center">
                       <button 
                         type="button"
                         onClick={() => {
                           setImagePreview(null);
                           setImageFile(null);
                           setChatMessages([]);
                           if (fileInputRef.current) {
                             fileInputRef.current.value = "";
                           }
                         }}
                         className="flex items-center space-x-2 text-sm text-red-400 hover:text-red-300 bg-red-400/10 px-4 py-2 rounded-lg transition"
                       >
                         <X size={16} />
                         <span>Supprimer et changer d'image</span>
                       </button>
                    </div>

                    {/* AI Chat Assistant */}
                    <div className="bg-black/20 border border-primary/30 rounded-xl p-4 space-y-4">
                      <div className="flex items-center space-x-2 text-primary-light mb-2">
                        <Bot size={20} />
                        <h3 className="font-semibold text-sm">Assistant IA Immo</h3>
                      </div>
                      
                      <div className="h-40 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                        {chatMessages.length === 0 && isAiLoading ? (
                          <div className="flex items-center space-x-2 text-gray-400 text-sm">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Bot size={16} /></motion.div>
                            <p>Analyse de la photo en cours...</p>
                          </div>
                        ) : (
                          chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                               <div className={`px-4 py-2 rounded-xl text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                                 {msg.text}
                               </div>
                            </div>
                          ))
                        )}
                        {isAiLoading && chatMessages.length > 0 && (
                          <div className="flex items-center space-x-2 text-gray-400 text-sm">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Bot size={16} /></motion.div>
                            <p>Écriture...</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
                        <input 
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if(e.key === 'Enter') {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Répondez à l'assistant..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                          disabled={isAiLoading}
                        />
                        <button 
                          type="button"
                          onClick={handleSendMessage}
                          disabled={isAiLoading || !chatInput.trim()}
                          className="p-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 transition"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Loyer / Prix (en FC ou USD)</label>
                    <input
                      type="text"
                      required
                      value={propertyPrice}
                      onChange={(e) => setPropertyPrice(e.target.value)}
                      placeholder="Ex: 500 $ / mois"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Localisation (Quartier, Ville)</label>
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
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Lien Google Maps / GPS (Optionnel)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="url"
                      value={propertyGpsLink}
                      onChange={(e) => setPropertyGpsLink(e.target.value)}
                      placeholder="Ex: https://maps.app.goo.gl/..."
                      className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Sera envoyé au visiteur lors de la validation de la visite.</p>
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
                    disabled={isAiLoading}
                    className="px-6 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isAiLoading ? "Traitement..." : "Publier l'annonce"}
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
