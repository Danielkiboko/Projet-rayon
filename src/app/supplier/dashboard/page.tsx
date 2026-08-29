"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Store, Package, ShoppingBag, Plus, LogOut, Edit, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
};

export default function SupplierDashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"catalogue" | "commandes">("catalogue");
  const [products, setProducts] = useState<Product[]>([]);
  
  // Add Product State
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newCategory, setNewCategory] = useState("Général");
  const [isProcessing, setIsProcessing] = useState(false);

  // Protect route
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch Supplier Products
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "products"), where("supplierId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach((doc) => {
        prods.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(prods);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);

    try {
      await addDoc(collection(db, "products"), {
        supplierId: user.uid,
        name: newName,
        price: parseFloat(newPrice),
        image: newImage || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400",
        category: newCategory,
        createdAt: serverTimestamp(),
      });
      setIsAdding(false);
      setNewName("");
      setNewPrice("");
      setNewImage("");
    } catch (error) {
      console.error("Error adding product", error);
      alert("Erreur lors de l'ajout du produit.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer ce produit ?")) {
      try {
        await deleteDoc(doc(db, "products", id));
      } catch (error) {
        console.error("Error deleting product", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Sidebar (Desktop) / Top Nav (Mobile) */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between md:justify-start">
          <div className="flex items-center">
            <Store className="text-gray-900 mr-2" size={24} />
            <h1 className="text-xl font-bold text-gray-900">Espace Vendeur</h1>
          </div>
          <button onClick={() => signOut()} className="md:hidden text-gray-400 hover:text-red-500">
            <LogOut size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 px-2">Menu</p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("catalogue")}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                activeTab === "catalogue" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Package size={18} className="mr-3" /> Mon Catalogue
            </button>
            <button
              onClick={() => setActiveTab("commandes")}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                activeTab === "commandes" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <ShoppingBag size={18} className="mr-3" /> Commandes
            </button>
          </nav>
        </div>

        <div className="mt-auto p-4 hidden md:block">
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} className="mr-2" /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Produits en ligne</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium">Ventes aujourd'hui</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">0 AED</p>
          </div>
        </div>

        {/* Tab Content: Catalogue */}
        {activeTab === "catalogue" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Gérer mon catalogue</h2>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Plus size={16} className="mr-1" /> Ajouter un produit
              </button>
            </div>

            {/* Add Product Form */}
            {isAdding && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8 animate-in fade-in slide-in-from-top-4">
                <h3 className="font-bold text-gray-900 mb-4">Nouveau produit</h3>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nom du produit</label>
                    <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" placeholder="Ex: Avocat Bio" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Prix (AED)</label>
                    <input type="number" step="0.01" required value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" placeholder="Ex: 15.50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Catégorie</label>
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none">
                      <option value="Fruits & Légumes">Fruits & Légumes</option>
                      <option value="Épicerie">Épicerie</option>
                      <option value="Boissons">Boissons</option>
                      <option value="Boulangerie">Boulangerie</option>
                      <option value="Mode">Mode</option>
                      <option value="Général">Général</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">URL de l'image (Optionnel)</label>
                    <input type="url" value={newImage} onChange={(e) => setNewImage(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" placeholder="https://..." />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Annuler</button>
                    <button type="submit" disabled={isProcessing} className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50">
                      {isProcessing ? "Création..." : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Products List */}
            {products.length === 0 && !isAdding ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <Package size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Votre catalogue est vide.</p>
                <button onClick={() => setIsAdding(true)} className="mt-4 text-blue-600 font-bold hover:underline">Commencer à ajouter des produits</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    <div className="h-40 bg-gray-100 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-bold rounded-lg text-gray-900">
                        {product.category}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-gray-900">{product.name}</h3>
                      <p className="text-blue-600 font-bold mt-1">{product.price.toFixed(2)} AED</p>
                      
                      <div className="mt-auto pt-4 flex gap-2">
                        <button className="flex-1 flex justify-center items-center py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 font-medium text-sm transition-colors">
                          <Edit size={14} className="mr-1" /> Modifier
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Commandes */}
        {activeTab === "commandes" && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Historique des commandes</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              C'est ici que vous verrez les commandes clients contenant vos produits. (En cours de développement).
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
