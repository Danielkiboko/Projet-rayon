"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Package, 
  LogOut,
  ShieldAlert,
  Plus,
  Edit,
  Trash2,
  X
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
  const { user, userData, loading, signOut } = useAuth();
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
        const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN" && userData?.permissions?.canManageProducts;
        
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
    const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN" && userData?.permissions?.canManageProducts;
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

  const getTitle = (titleObj: any) => {
    if (typeof titleObj === 'object' && titleObj !== null) {
      return titleObj.fr || titleObj.en || "Sans titre";
    }
    return titleObj || "Sans titre";
  };

  const isSuperAdmin = user?.email === "danielkiboko218@gmail.com";
  const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN" && userData?.permissions?.canManageProducts;

  if (loading || !user || (!isSuperAdmin && !isAuthorizedSubAdmin)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white flex flex-col items-center">
          <ShieldAlert size={48} className="text-gray-500 mb-4 animate-pulse" />
          <p>Vérification des accès sécurisés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row font-sans text-gray-900">
      
      {/* Sidebar - Sleek Dark Mode */}
      <div className="w-full md:w-72 bg-[#0A0A0A] text-white flex flex-col shadow-2xl z-10 relative">
        <div className="p-8 border-b border-white/10">
          <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            RAYON<span className="text-blue-500">.</span>
          </h1>
          <p className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-widest">Admin Control</p>
        </div>
        
        <nav className="p-6 flex-1 space-y-3">
          {(isSuperAdmin || userData?.permissions?.canViewDashboard) && (
            <Link href="/admin/dashboard" className="flex items-center px-4 py-3.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium group">
              <LayoutDashboard size={20} className="mr-4 group-hover:scale-110 transition-transform" /> Dashboard
            </Link>
          )}
          <Link href="/admin/products" className="flex items-center px-4 py-3.5 bg-blue-600/10 text-blue-500 rounded-xl font-bold border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all">
            <Package size={20} className="mr-4" /> Produits
          </Link>
          {(isSuperAdmin || userData?.permissions?.canManageDelivery) && (
            <Link href="/admin/delivery/create" className="flex items-center px-4 py-3.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium group">
              <Truck size={20} className="mr-4 group-hover:scale-110 transition-transform" /> Créer un Livreur
            </Link>
          )}
          {isSuperAdmin && (
            <Link href="/admin/team" className="flex items-center px-4 py-3.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium group">
              <ShieldAlert size={20} className="mr-4 group-hover:scale-110 transition-transform" /> Équipe (Sous-Admins)
            </Link>
          )}
          <div className="flex items-center px-4 py-3.5 text-gray-600 rounded-xl font-medium cursor-not-allowed">
            <Users size={20} className="mr-4" /> Fournisseurs (Bientôt)
          </div>
        </nav>

        <div className="p-6 border-t border-white/10 bg-white/5">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold shadow-lg text-white mr-4">
              D
            </div>
            <div>
              <p className="text-sm font-bold text-white">{userData?.name || "Admin"}</p>
              <p className="text-xs text-blue-400 font-medium">{isSuperAdmin ? "Super Admin" : "Sous-Admin"}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-bold text-gray-300 bg-white/5 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-white/5 hover:border-red-500"
          >
            <LogOut size={16} className="mr-2" /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#F8F9FA]">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Gestion des Produits</h2>
              <p className="text-gray-500 mt-1">Gérez le catalogue complet de Rayons.</p>
            </div>
            <button 
              onClick={openAddModal}
              className="bg-gray-900 text-white px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus size={18} className="mr-2" /> Ajouter un produit
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-bold">
                    <th className="p-5 w-16">Image</th>
                    <th className="p-5">Titre (FR / EN)</th>
                    <th className="p-5">Catégorie</th>
                    <th className="p-5">Prix</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-400 font-medium">
                        Aucun produit trouvé dans le catalogue.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors group">
                        <td className="p-5">
                          <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={product.image} alt="produit" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                        </td>
                        <td className="p-5 font-bold text-gray-900 text-base">
                          {getTitle(product.title)}
                        </td>
                        <td className="p-5">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 uppercase tracking-wider border border-blue-100">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-5 font-black text-gray-900 text-base">
                          {formatPrice(product.price)}
                        </td>
                        <td className="p-5 text-right space-x-3">
                          <button 
                            onClick={() => openEditModal(product)}
                            className="inline-flex p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="inline-flex p-2.5 bg-gray-50 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
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
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? "Modifier le produit" : "Ajouter un produit"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Titre (Français)</label>
                  <input 
                    type="text" 
                    required 
                    value={titleFr} 
                    onChange={(e) => setTitleFr(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" 
                    placeholder="Ex: Veste en cuir" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Titre (Anglais)</label>
                  <input 
                    type="text" 
                    required 
                    value={titleEn} 
                    onChange={(e) => setTitleEn(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" 
                    placeholder="Ex: Leather Jacket" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Prix (Valeur de Base: {currency})</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" 
                    placeholder="Ex: 199.99" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Rayon / Catégorie</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none bg-white"
                  >
                    <option value="mode">Mode</option>
                    <option value="connect">Connect</option>
                    <option value="immo">Immo</option>
                    <option value="General">Général</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">URL de l'image</label>
                  <input 
                    type="url" 
                    required
                    value={image} 
                    onChange={(e) => setImage(e.target.value)} 
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" 
                    placeholder="https://..." 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="px-8 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isProcessing ? "Enregistrement..." : "Sauvegarder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
