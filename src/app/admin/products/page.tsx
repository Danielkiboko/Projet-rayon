"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  ShieldAlert,
  Plus,
  Edit,
  Trash2,
  X,
  Check
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useCurrency } from "@/context/CurrencyContext";

type Product = {
  id: string;
  title: { fr: string; en: string } | string;
  price: number;
  image: string;
  category: string;
  supplierId?: string;
  [key: string]: any;
};

export default function AdminProductsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { formatPrice, currency } = useCurrency();

  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [titleFr, setTitleFr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("mode");
  const [image, setImage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
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

  // Fetch products
  useEffect(() => {
    if (!user) return;
    const isSuperAdmin = user.email === "danielkiboko218@gmail.com";
    const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN";
    if (!isSuperAdmin && !isAuthorizedSubAdmin) return;

    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts: Product[] = [];
      snapshot.forEach((doc) => {
        fetchedProducts.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(fetchedProducts);
    });

    return () => unsubscribe();
  }, [user]);

  const openAddModal = () => {
    setEditingId(null);
    setTitleFr("");
    setTitleEn("");
    setPrice("");
    setCategory("mode");
    setImage("");
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    
    // Handle bilingual or string titles
    if (typeof product.title === 'object' && product.title !== null) {
      setTitleFr(product.title.fr || "");
      setTitleEn(product.title.en || "");
    } else {
      setTitleFr(product.title as string || "");
      setTitleEn(product.title as string || "");
    }
    
    setPrice(product.price?.toString() || "");
    setCategory(product.category || "mode");
    setImage(product.image || "");
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);

    const productData = {
      title: { fr: titleFr, en: titleEn },
      price: parseFloat(price),
      category: category,
      image: image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400",
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          supplierId: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving product", error);
      alert("Erreur lors de la sauvegarde du produit.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible.")) {
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (error) {
        console.error("Error deleting product", error);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const handleApproveProduct = async (id: string) => {
    if (confirm("Approuver et publier ce produit ?")) {
      try {
        await updateDoc(doc(db, "products", id), {
          status: "published"
        });
      } catch (error) {
        console.error("Error approving product", error);
        alert("Erreur lors de l'approbation.");
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Gestion des Produits</h2>
          <p className="text-gray-400 mt-1 text-sm">Gérez le catalogue complet de Rayons.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" /> Ajouter un produit
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-[#1a1a1a] rounded-2xl shadow-sm border border-white/5 overflow-hidden">
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
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">
                    Aucun produit n&apos;a été trouvé dans le catalogue.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.image} alt="produit" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {getTitle(product.title)}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500 uppercase tracking-wider">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-white">
                      {formatPrice(product.price)}
                    </td>
                    <td className="p-4">
                      {product.status === "pending_approval" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-500/10 text-orange-500 uppercase tracking-wider">
                          En attente
                        </span>
                      ) : product.status === "published" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-500/10 text-green-500 uppercase tracking-wider">
                          Publié
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-gray-300 uppercase tracking-wider">
                          Brouillon
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {product.status === "pending_approval" && (
                        <button 
                          onClick={() => handleApproveProduct(product.id)}
                          title="Approuver et Publier"
                          className="inline-flex p-2 bg-white/5 text-orange-500 hover:text-white rounded-lg hover:bg-orange-500 transition-colors border border-transparent hover:border-orange-500"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => openEditModal(product)}
                        className="inline-flex p-2 bg-white/5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-500/10 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="inline-flex p-2 bg-white/5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden border border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">
                {editingId ? "Modifier le produit" : "Ajouter un produit"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Titre (Français)</label>
                  <input 
                    type="text" 
                    required 
                    value={titleFr} 
                    onChange={(e) => setTitleFr(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-gray-500" 
                    placeholder="Ex: Veste en cuir" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Titre (Anglais)</label>
                  <input 
                    type="text" 
                    required 
                    value={titleEn} 
                    onChange={(e) => setTitleEn(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-gray-500" 
                    placeholder="Ex: Leather Jacket" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Prix (Valeur de Base: {currency})</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-gray-500" 
                    placeholder="Ex: 199.99" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Rayon / Catégorie</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white appearance-none"
                  >
                    <option className="bg-[#1a1a1a]" value="mode">Mode</option>
                    <option className="bg-[#1a1a1a]" value="connect">Connect</option>
                    <option className="bg-[#1a1a1a]" value="immo">Immo</option>
                    <option className="bg-[#1a1a1a]" value="General">Général</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">URL de l'image</label>
                  <input 
                    type="url" 
                    required
                    value={image} 
                    onChange={(e) => setImage(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-gray-500" 
                    placeholder="https://..." 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 text-gray-300 font-semibold hover:bg-white/5 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isProcessing ? "Enregistrement..." : "Sauvegarder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
