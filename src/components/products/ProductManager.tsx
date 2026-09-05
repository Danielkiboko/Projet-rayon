"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, Plus, X, Search, Edit2, Trash2, Filter, Settings, 
  MapPin, Clock, Tag, ShoppingBag, Truck, Image as ImageIcon, Bot, Send, AlertCircle, CheckCircle, XCircle
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

interface ProductManagerProps {
  isAdmin: boolean;
}

export default function ProductManager({ isAdmin }: ProductManagerProps) {
  const { user, userData } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productTitleFr, setProductTitleFr] = useState("");
  const [productTitleEn, setProductTitleEn] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productDesc, setProductDesc] = useState("");

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
      if (autoFill.title) {
        if (typeof autoFill.title === 'string') {
          setProductTitleFr(autoFill.title);
          setProductTitleEn(autoFill.title);
        } else {
          setProductTitleFr(autoFill.title.fr || autoFill.title.français || "");
          setProductTitleEn(autoFill.title.en || autoFill.title.english || "");
        }
      }
      if (autoFill.category) setProductCategory(autoFill.category);
      if (autoFill.price) setProductPrice(autoFill.price);
      if (autoFill.stock) setProductStock(autoFill.stock);
      if (autoFill.description) setProductDesc(autoFill.description);
    },
    apiEndpoint: '/api/ai/product-assistant'
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch products
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    let unsubscribe = () => {};

    if (isAdmin) {
      // Admin: Fetch all products, real-time
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedProducts: any[] = [];
        snapshot.forEach((docSnap) => {
          fetchedProducts.push({ id: docSnap.id, ...docSnap.data() });
        });
        setProducts(fetchedProducts);
        setIsLoading(false);
      });
    } else {
      // Supplier: Fetch only their products
      const fetchSupplierProducts = async () => {
        try {
          const q = query(collection(db, "products"), where("supplierId", "==", user.uid));
          const snapshot = await getDocs(q);
          const prods: any[] = [];
          snapshot.forEach(docSnap => prods.push({ id: docSnap.id, ...docSnap.data() }));
          setProducts(prods);
        } catch (error) {
          console.error("Error fetching products", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSupplierProducts();
    }

    return () => {
      if (isAdmin) unsubscribe();
    };
  }, [user, isAdmin]);

  const resetForm = () => {
    setEditingId(null);
    setProductTitleFr("");
    setProductTitleEn("");
    setProductCategory("");
    setProductPrice("");
    setProductStock("");
    setProductDesc("");
    setImagePreview(null);
    setImageFile(null);
    resetChat();
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingId(product.id);
    
    // Handle bilingual or string titles
    if (typeof product.title === 'object' && product.title !== null) {
      setProductTitleFr(product.title.fr || "");
      setProductTitleEn(product.title.en || "");
    } else {
      setProductTitleFr(product.title as string || "");
      setProductTitleEn(product.title as string || "");
    }
    
    setProductPrice(product.price?.toString() || "");
    setProductStock(product.stock?.toString() || "");
    setProductCategory(product.category || "");
    setProductDesc(product.description || "");
    setImagePreview(product.image || "");
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUploadShared(
      e,
      setImageFile,
      setImagePreview,
      analyzeImage,
      "Voici la photo de mon produit. Peux-tu l'analyser et m'aider à créer une bonne description ? Donne-moi aussi un titre bilingue (fr, en)."
    );
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);

    const productData = {
      title: { fr: productTitleFr, en: productTitleEn }, // Unified Data Model
      category: productCategory,
      price: parseFloat(productPrice),
      stock: parseInt(productStock || "0", 10),
      description: productDesc,
      image: imagePreview || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400",
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          supplierId: user.uid,
          status: isAdmin ? "Disponible" : "pending_approval",
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      resetForm();
      if (!isAdmin) {
        // Fetch products manually for supplier to refresh list
        const q = query(collection(db, "products"), where("supplierId", "==", user.uid));
        const snapshot = await getDocs(q);
        const prods: any[] = [];
        snapshot.forEach(docSnap => prods.push({ id: docSnap.id, ...docSnap.data() }));
        setProducts(prods);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du produit", error);
      alert("Erreur lors de la sauvegarde du produit.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible.")) {
      try {
        await deleteDoc(doc(db, "products", id));
        if (!isAdmin) {
          setProducts(products.filter(p => p.id !== id));
        }
      } catch (error) {
        console.error("Error deleting product", error);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const handleApproveProduct = async (id: string) => {
    if (!isAdmin) return;
    if (confirm("Approuver et publier ce produit ?")) {
      try {
        const prod = products.find(p => p.id === id);
        await updateDoc(doc(db, "products", id), {
          status: "Disponible"
        });
        if (prod && prod.supplierId) {
          await addDoc(collection(db, "inapp_notifications"), {
            supplierId: prod.supplierId,
            type: "product",
            title: "Produit Publié",
            message: `Votre produit "${prod.name?.fr || prod.name || 'Produit'}" a été validé et est en ligne !`,
            time: Date.now(),
            link: "/supplier/products",
            read: false,
            createdAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error("Error approving product", error);
        alert("Erreur lors de l'approbation.");
      }
    }
  };

  const handleRejectProduct = async (id: string) => {
    if (!isAdmin) return;
    const reason = prompt("Motif de rejet (sera visible par le fournisseur) :");
    if (reason !== null) {
      try {
        const prod = products.find(p => p.id === id);
        await updateDoc(doc(db, "products", id), {
          status: "REJECTED",
          rejectionReason: reason
        });
        if (prod && prod.supplierId) {
          await addDoc(collection(db, "inapp_notifications"), {
            supplierId: prod.supplierId,
            type: "product",
            title: "Produit Rejeté",
            message: `Votre produit "${prod.name?.fr || prod.name || 'Produit'}" a été rejeté. Motif : ${reason}`,
            time: Date.now(),
            link: "/supplier/products",
            read: false,
            createdAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error("Error rejecting product", error);
        alert("Erreur lors du rejet.");
      }
    }
  };

  const handleCleanupOldProducts = async () => {
    if (!isAdmin) return;
    if (confirm("ATTENTION : Cela va supprimer TOUS les produits dont le titre est dans l'ancien format (texte simple au lieu de bilingue). Continuer ?")) {
      setIsProcessing(true);
      try {
        let deletedCount = 0;
        for (const product of products) {
          if (typeof product.title === "string") {
            await deleteDoc(doc(db, "products", product.id));
            deletedCount++;
          }
        }
        alert(`${deletedCount} ancien(s) produit(s) supprimé(s) avec succès !`);
      } catch (error) {
        console.error("Erreur lors du nettoyage", error);
        alert("Erreur lors du nettoyage.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const getTitle = (titleObj: Record<string, string> | string | null | undefined) => {
    if (typeof titleObj === 'object' && titleObj !== null) {
      return titleObj.fr || titleObj.en || "Sans titre";
    }
    return titleObj || "Sans titre";
  };

  const filteredProducts = products.filter(p => {
    const title = getTitle(p.title).toLowerCase();
    return title.includes(search.toLowerCase());
  });

  const lowStockCount = products.filter(p => (p.stock || 0) < 5).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isAdmin ? "Gestion des Produits" : "Mes Produits"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {isAdmin ? "Gérez le catalogue complet de Rayons." : "Gérez votre catalogue d'articles et vos stocks."}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={handleCleanupOldProducts}
              disabled={isProcessing}
              className="bg-red-600/20 text-red-500 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center hover:bg-red-600 hover:text-white transition-colors shadow-sm disabled:opacity-50 border border-red-600/30"
            >
              <Trash2 size={18} className="mr-2" /> Nettoyer les anciens produits
            </button>
          )}
          <button
            onClick={openAddModal}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center hover:bg-primary-light transition-colors shadow-sm"
          >
            <Plus size={18} className="mr-2" /> Ajouter un produit
          </button>
        </div>
      </div>

      {/* Quick Stats (Supplier Only or Admin) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Produits</p>
            <p className="text-2xl font-bold text-white mt-1">{products.length}</p>
          </div>
          <div className="p-3 bg-purple-400/10 text-purple-400 rounded-lg">
            <Package size={20} />
          </div>
        </div>
        {!isAdmin && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Rupture / Stock faible</p>
              <p className="text-2xl font-bold text-white mt-1">{lowStockCount}</p>
            </div>
            <div className="p-3 bg-orange-400/10 text-orange-400 rounded-lg">
              <AlertCircle size={20} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un produit..."
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
                <th className="p-4">Titre (FR / EN)</th>
                <th className="p-4">Catégorie</th>
                <th className="p-4">Prix</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">Chargement...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">
                    Aucun produit trouvé.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center shrink-0">
                        {product.image ? (
                          <img src={product.image} alt="produit" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <Package size={16} className="text-primary-light" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-white">
                      <span className="line-clamp-1">{getTitle(product.title)}</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500 uppercase tracking-wider">
                        {product.category || "-"}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">
                      {formatPrice(product.price)}
                    </td>
                    <td className="p-4">
                      {product.status === "pending_approval" || product.status === "PENDING_APPROVAL" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-500/10 text-orange-500 uppercase tracking-wider">
                          En attente
                        </span>
                      ) : product.status === "published" || product.status === "Disponible" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-500/10 text-green-500 uppercase tracking-wider">
                          Publié
                        </span>
                      ) : product.status === "REJECTED" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-500 uppercase tracking-wider">
                          Rejeté
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-gray-300 uppercase tracking-wider">
                          {product.status || "Brouillon"}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {isAdmin && (product.status !== "published" && product.status !== "Disponible") && (
                        <>
                          <button 
                            onClick={() => handleApproveProduct(product.id)}
                            title="Approuver et Publier"
                            className="inline-flex p-2 bg-white/5 text-orange-500 hover:text-white rounded-lg hover:bg-green-500 transition-colors border border-transparent hover:border-green-500 mr-2"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleRejectProduct(product.id)}
                            title="Rejeter"
                            className="inline-flex p-2 bg-white/5 text-red-500 hover:text-white rounded-lg hover:bg-red-500 transition-colors border border-transparent hover:border-red-500 mr-2"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => openEditModal(product)}
                        className="inline-flex p-2 bg-white/5 text-gray-400 hover:text-white rounded-lg hover:bg-blue-600 transition-colors border border-transparent hover:border-blue-600 mr-2"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
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

      {/* Create / Edit Product Modal */}
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
                <h2 className="text-xl font-semibold text-white">
                  {editingId ? "Modifier le produit" : "Ajouter un produit"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-4 space-y-5 overflow-y-auto scrollbar-hide">
                
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

                {/* AI Chat Assistant */}
                {imageFile && (
                  <AiAssistantChat 
                    title="Assistant IA Rayon"
                    chatMessages={chatMessages}
                    chatInput={chatInput}
                    setChatInput={setChatInput}
                    isAiLoading={isAiLoading}
                    handleSendMessage={handleSendMessage}
                  />
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Titre (Français)</label>
                    <input
                      type="text"
                      required
                      value={productTitleFr}
                      onChange={(e) => setProductTitleFr(e.target.value)}
                      placeholder="Ex: Veste en cuir"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Titre (Anglais)</label>
                    <input
                      type="text"
                      required
                      value={productTitleEn}
                      onChange={(e) => setProductTitleEn(e.target.value)}
                      placeholder="Ex: Leather Jacket"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Prix (Base: {currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="Ex: 199.99"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Quantité en stock</label>
                    <input
                      type="number"
                      required
                      value={productStock}
                      onChange={(e) => setProductStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Catégorie</label>
                  <select required value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white appearance-none">
                    <option className="bg-[#1a1a1a]" value="">Sélectionner un rayon</option>
                    <option className="bg-[#1a1a1a]" value="mode">Mode (Vêtements & Accessoires)</option>
                    <option className="bg-[#1a1a1a]" value="connect">Connect (Électronique & Télécom)</option>
                    <option className="bg-[#1a1a1a]" value="immo">Immo (Immobilier)</option>
                    <option className="bg-[#1a1a1a]" value="general">Général (Divers)</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Description</label>
                  <textarea
                    rows={4}
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    placeholder="Décrivez votre produit en détail..."
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  ></textarea>
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
                    className="px-6 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? "Enregistrement..." : (isAdmin ? "Sauvegarder le produit" : "Publier le produit")}
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
