"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Store, Package, ShoppingBag, Plus, LogOut, Edit, Trash2, Truck, UserX, Clock, MessageSquare, Send } from "lucide-react";
import { db, storage, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
};

type Driver = {
  id: string;
  displayName: string;
  email: string;
  status: string;
};

export default function SupplierDashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"catalogue" | "commandes" | "livreurs" | "messages">("catalogue");
  const [products, setProducts] = useState<Product[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // Chat States
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  
  // Add Product State
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newCategory, setNewCategory] = useState("Général");
  const [isProcessing, setIsProcessing] = useState(false);

  // Add Driver State
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverEmail, setNewDriverEmail] = useState("");
  const [newDriverPassword, setNewDriverPassword] = useState("");
  const [isProcessingDriver, setIsProcessingDriver] = useState(false);

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

  // Fetch Chats
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("supplierId", "==", user.uid), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const c: any[] = [];
      snapshot.forEach((d) => {
        c.push({ id: d.id, ...d.data() });
      });
      setChats(c);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Messages for active chat
  useEffect(() => {
    if (!activeChatId) {
      setChatMessages([]);
      return;
    }
    const q = query(collection(db, `chats/${activeChatId}/messages`), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setChatMessages(msgs);
    });
    return () => unsubscribe();
  }, [activeChatId]);

  // Fetch Supplier Drivers
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "drivers"), where("supplierId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const drvs: Driver[] = [];
      snapshot.forEach((doc) => {
        drvs.push({ id: doc.id, ...doc.data() } as Driver);
      });
      setDrivers(drvs);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;
  }

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessingDriver(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Non authentifié");

      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newDriverEmail,
          password: newDriverPassword,
          displayName: newDriverName,
          roleToCreate: 'driver'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      setIsAddingDriver(false);
      setNewDriverName("");
      setNewDriverEmail("");
      setNewDriverPassword("");
      alert("Livreur ajouté avec succès !");
    } catch (error: any) {
      console.error("Error adding driver", error);
      alert(error.message || "Erreur lors de l'ajout du livreur.");
    } finally {
      setIsProcessingDriver(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);

    try {
      let imageUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400";
      
      if (newImage) {
        const fileRef = ref(storage, `products/${user.uid}_${Date.now()}_${newImage.name}`);
        await uploadBytes(fileRef, newImage);
        imageUrl = await getDownloadURL(fileRef);
      }

      await addDoc(collection(db, "products"), {
        supplierId: user.uid,
        name: newName,
        price: parseFloat(newPrice),
        image: imageUrl,
        category: newCategory,
        createdAt: serverTimestamp(),
      });
      setIsAdding(false);
      setNewName("");
      setNewPrice("");
      setNewImage(null);
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

  const handleRequestDeleteDriver = async (id: string) => {
    if (confirm("Voulez-vous vraiment demander la suppression de ce livreur ? L'administration devra approuver.")) {
      try {
        // We only change the status to pending_deletion
        const { updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, "drivers", id), {
          status: "pending_deletion"
        });
        await updateDoc(doc(db, "users", id), {
          status: "pending_deletion"
        });
        alert("Demande de suppression envoyée à l'administrateur.");
      } catch (error) {
        console.error("Error requesting driver deletion", error);
        alert("Erreur lors de la demande de suppression.");
      }
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !user || !activeChatId) return;

    try {
      const msg = newChatMessage;
      setNewChatMessage("");

      await addDoc(collection(db, `chats/${activeChatId}/messages`), {
        text: msg,
        senderId: user.uid,
        createdAt: serverTimestamp()
      });

      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "chats", activeChatId), {
        lastMessage: msg,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadClient: true
      });
    } catch (error) {
      console.error("Error sending message:", error);
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
            <button
              onClick={() => setActiveTab("livreurs")}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                activeTab === "livreurs" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Truck size={18} className="mr-3" /> Mes Livreurs
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                activeTab === "messages" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <MessageSquare size={18} className="mr-3" /> Messages
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
                    <label className="block text-sm font-bold text-gray-700 mb-1">Image du produit</label>
                    <input type="file" accept="image/*" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewImage(e.target.files[0]);
                      }
                    }} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100" />
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

        {/* Tab Content: Livreurs */}
        {activeTab === "livreurs" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Mes Livreurs</h2>
              <button 
                onClick={() => setIsAddingDriver(true)}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Plus size={16} className="mr-1" /> Ajouter un livreur
              </button>
            </div>

            {isAddingDriver && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Créer un profil Livreur</h3>
                  <form onSubmit={handleAddDriver} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Nom du livreur</label>
                      <input type="text" required value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" placeholder="Jean Dupont" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                      <input type="email" required value={newDriverEmail} onChange={(e) => setNewDriverEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" placeholder="jean.dupont@email.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Mot de passe temporaire</label>
                      <input type="text" required value={newDriverPassword} onChange={(e) => setNewDriverPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none" placeholder="Mot de passe" />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <button type="button" onClick={() => setIsAddingDriver(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Annuler</button>
                      <button type="submit" disabled={isProcessingDriver} className="px-4 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50">
                        {isProcessingDriver ? "Création..." : "Ajouter"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {drivers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <Truck size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Vous n'avez pas encore de livreurs affiliés.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                      <th className="p-4 font-bold">Nom</th>
                      <th className="p-4 font-bold">Email</th>
                      <th className="p-4 font-bold">Statut</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map(driver => (
                      <tr key={driver.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="p-4 font-medium text-gray-900">{driver.displayName || "Sans nom"}</td>
                        <td className="p-4 text-gray-600">{driver.email}</td>
                        <td className="p-4">
                          {driver.status === "pending_deletion" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Clock size={12} className="mr-1" /> En attente de suppression
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Actif
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleRequestDeleteDriver(driver.id)}
                            disabled={driver.status === "pending_deletion"}
                            className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Demander la suppression"
                          >
                            <UserX size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Messages */}
        {activeTab === "messages" && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row h-[600px] gap-6">
            
            {/* Chats List */}
            <div className="w-full md:w-1/3 flex flex-col border-r border-gray-100 pr-4">
              <div className="flex items-center mb-4 pb-4 border-b border-gray-100">
                <MessageSquare className="text-blue-500 mr-2" size={20} />
                <h3 className="text-md font-bold text-gray-900">Conversations</h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {chats.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center mt-4">Aucune conversation</p>
                ) : (
                  chats.map(chat => (
                    <div 
                      key={chat.id} 
                      onClick={() => setActiveChatId(chat.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-colors ${activeChatId === chat.id ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'}`}
                    >
                      <p className="text-sm font-bold text-gray-900 truncate">Client: {chat.clientId.substring(0,6)}...</p>
                      <p className="text-xs text-gray-500 truncate">{chat.lastMessage || "Nouveau chat"}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Box */}
            <div className="flex-1 flex flex-col">
              {!activeChatId ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-100">
                  <MessageSquare className="text-gray-300 mb-3" size={40} />
                  <p className="text-gray-500 font-medium">Sélectionnez une conversation pour commencer</p>
                </div>
              ) : (
                <>
                  {/* Message History */}
                  <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-4 flex flex-col space-y-3 mb-4 border border-gray-100">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm my-auto">
                        Aucun message.
                      </div>
                    ) : (
                      chatMessages.map(msg => {
                        const isMe = msg.senderId === user?.uid;
                        return (
                          <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                            <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'}`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendChatMessage} className="flex gap-2">
                    <input 
                      type="text" 
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      placeholder="Écrivez un message..." 
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                      type="submit"
                      disabled={!newChatMessage.trim()}
                      className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </>
              )}
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}
