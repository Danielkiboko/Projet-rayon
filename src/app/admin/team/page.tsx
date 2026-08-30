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
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Check,
  X
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

export default function AdminTeamPage() {
  const { user, userData, loading, signOut } = useAuth();
  const router = useRouter();

  const [searchEmail, setSearchEmail] = useState("");
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Protect route strictly for Super Admin
  const isSuperAdmin = user?.email === "danielkiboko218@gmail.com";

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!isSuperAdmin) {
        router.push("/");
      }
    }
  }, [user, isSuperAdmin, loading, router]);

  const fetchSubAdmins = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "SUB_ADMIN"));
      const querySnapshot = await getDocs(q);
      const admins: any[] = [];
      querySnapshot.forEach((doc) => {
        admins.push({ id: doc.id, ...doc.data() });
      });
      setSubAdmins(admins);
    } catch (error) {
      console.error("Error fetching sub admins:", error);
    }
  };

  const fetchPendingDrivers = async () => {
    try {
      const q = query(collection(db, "drivers"), where("status", "==", "pending_deletion"));
      const querySnapshot = await getDocs(q);
      const drivers: any[] = [];
      querySnapshot.forEach((doc) => {
        drivers.push({ id: doc.id, ...doc.data() });
      });
      setPendingDrivers(drivers);
    } catch (error) {
      console.error("Error fetching pending drivers:", error);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSubAdmins();
      fetchPendingDrivers();
    }
  }, [isSuperAdmin]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;
    
    setIsSearching(true);
    setSearchError("");
    setSearchedUser(null);
    
    try {
      const q = query(collection(db, "users"), where("email", "==", searchEmail.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setSearchError("Aucun utilisateur trouvé avec cette adresse email.");
      } else {
        const userDoc = querySnapshot.docs[0];
        setSearchedUser({ id: userDoc.id, ...userDoc.data() });
      }
    } catch (error) {
      console.error("Error searching user:", error);
      setSearchError("Une erreur s'est produite lors de la recherche.");
    } finally {
      setIsSearching(false);
    }
  };

  const togglePermission = async (userId: string, currentRole: string, currentPermissions: any, permissionKey: string) => {
    setIsUpdating(true);
    try {
      const newPermissions = {
        ...(currentPermissions || {}),
        [permissionKey]: !currentPermissions?.[permissionKey]
      };
      
      // If a standard user gets a permission, they automatically become SUB_ADMIN
      const newRole = "SUB_ADMIN"; 
      
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
        permissions: newPermissions
      });
      
      // Update local state for immediate feedback
      if (searchedUser && searchedUser.id === userId) {
        setSearchedUser({
          ...searchedUser,
          role: newRole,
          permissions: newPermissions
        });
      }
      
      fetchSubAdmins();
      
    } catch (error) {
      console.error("Error updating permissions:", error);
      alert("Erreur lors de la mise à jour des permissions.");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const revokeSubAdmin = async (userId: string) => {
    if (!confirm("Voulez-vous vraiment révoquer tous les droits de cet utilisateur ?")) return;
    
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "users", userId), {
        role: "CLIENT",
        permissions: {}
      });
      
      if (searchedUser && searchedUser.id === userId) {
        setSearchedUser({
          ...searchedUser,
          role: "CLIENT",
          permissions: {}
        });
      }
      
      fetchSubAdmins();
    } catch (error) {
      console.error("Error revoking user:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproveDeletion = async (driverId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer définitivement ce livreur ?")) return;
    setIsUpdating(true);
    try {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ uid: driverId, collectionName: 'drivers' })
      });
      
      if (!res.ok) throw new Error("Erreur lors de la suppression backend");
      
      alert("Livreur supprimé avec succès.");
      fetchPendingDrivers();
    } catch (error) {
      console.error("Error deleting driver:", error);
      alert("Erreur lors de la suppression.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectDeletion = async (driverId: string) => {
    if (!confirm("Voulez-vous annuler la demande et réactiver ce livreur ?")) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "drivers", driverId), { status: "active" });
      await updateDoc(doc(db, "users", driverId), { status: "active" });
      alert("Livreur réactivé avec succès.");
      fetchPendingDrivers();
    } catch (error) {
      console.error("Error rejecting deletion:", error);
      alert("Erreur lors de l'annulation de la suppression.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || !user || !isSuperAdmin) {
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
          {(isSuperAdmin || userData?.permissions?.canManageProducts) && (
            <Link href="/admin/products" className="flex items-center px-4 py-3.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium group">
              <Package size={20} className="mr-4 group-hover:scale-110 transition-transform" /> Produits
            </Link>
          )}
          {(isSuperAdmin || userData?.permissions?.canManageDelivery) && (
            <Link href="/admin/delivery/create" className="flex items-center px-4 py-3.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium group">
              <Truck size={20} className="mr-4 group-hover:scale-110 transition-transform" /> Créer un Livreur
            </Link>
          )}
          {isSuperAdmin && (
            <Link href="/admin/team" className="flex items-center px-4 py-3.5 bg-blue-600/10 text-blue-500 rounded-xl font-bold border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all">
              <ShieldAlert size={20} className="mr-4" /> Équipe (Sous-Admins)
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
        <div className="p-6 md:p-10 max-w-4xl mx-auto">
          
          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Équipe d'Administration</h2>
            <p className="text-gray-500 mt-1">Gérez les sous-administrateurs et leurs accès spécifiques au C-Panel.</p>
          </div>

          {/* Search Box */}
          <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-10">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Promouvoir un utilisateur</h3>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Email de l'utilisateur (ex: employé@rayons.net)"
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSearching}
                className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50"
              >
                {isSearching ? "Recherche..." : "Rechercher"}
              </button>
            </form>
            
            {searchError && (
              <p className="mt-4 text-sm font-medium text-red-500 flex items-center">
                <XCircle size={16} className="mr-2" /> {searchError}
              </p>
            )}

            {searchedUser && (
              <div className="mt-6 p-5 border border-blue-100 bg-blue-50/50 rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{searchedUser.name}</p>
                    <p className="text-sm text-gray-500">{searchedUser.email}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg ${searchedUser.role === 'SUB_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-700'}`}>
                    Rôle actuel : {searchedUser.role || "CLIENT"}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Permissions du C-Panel</h4>
                  
                  {/* Permission: Dashboard */}
                  <label className="flex items-center p-4 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-blue-300 transition-all shadow-sm">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={!!searchedUser.permissions?.canViewDashboard}
                      onChange={() => togglePermission(searchedUser.id, searchedUser.role, searchedUser.permissions, "canViewDashboard")}
                      disabled={isUpdating}
                    />
                    <div className="ml-4">
                      <p className="text-sm font-bold text-gray-900">Accès au Dashboard & Chiffre d'Affaires</p>
                      <p className="text-xs text-gray-500">Peut voir les statistiques globales et les commandes.</p>
                    </div>
                  </label>

                  {/* Permission: Products */}
                  <label className="flex items-center p-4 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-blue-300 transition-all shadow-sm">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={!!searchedUser.permissions?.canManageProducts}
                      onChange={() => togglePermission(searchedUser.id, searchedUser.role, searchedUser.permissions, "canManageProducts")}
                      disabled={isUpdating}
                    />
                    <div className="ml-4">
                      <p className="text-sm font-bold text-gray-900">Gestion des Produits</p>
                      <p className="text-xs text-gray-500">Peut ajouter, modifier et supprimer des produits.</p>
                    </div>
                  </label>

                  {/* Permission: Delivery */}
                  <label className="flex items-center p-4 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-blue-300 transition-all shadow-sm">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={!!searchedUser.permissions?.canManageDelivery}
                      onChange={() => togglePermission(searchedUser.id, searchedUser.role, searchedUser.permissions, "canManageDelivery")}
                      disabled={isUpdating}
                    />
                    <div className="ml-4">
                      <p className="text-sm font-bold text-gray-900">Création de Livreurs</p>
                      <p className="text-xs text-gray-500">Peut créer et gérer des comptes livreurs.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Pending Drivers Approvals */}
          {pendingDrivers.length > 0 && (
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-orange-200 overflow-hidden mb-10">
              <div className="p-6 border-b border-orange-100 bg-orange-50 flex items-center">
                <AlertTriangle className="text-orange-500 mr-3" />
                <h3 className="text-lg font-black text-gray-900">Approbations de suppression en attente</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-bold">
                      <th className="p-5">Nom / Email du Livreur</th>
                      <th className="p-5">Fournisseur (Demandeur)</th>
                      <th className="p-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {pendingDrivers.map((driver) => (
                      <tr key={driver.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                        <td className="p-5">
                          <p className="font-bold text-gray-900">{driver.displayName || "Sans nom"}</p>
                          <p className="text-xs text-gray-500">{driver.email}</p>
                        </td>
                        <td className="p-5 text-gray-600 font-medium">
                          {driver.supplierId === "admin" ? "Admin" : driver.supplierId}
                        </td>
                        <td className="p-5 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => handleRejectDeletion(driver.id)}
                            disabled={isUpdating}
                            className="flex items-center text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-all"
                          >
                            <X size={14} className="mr-1" /> Refuser
                          </button>
                          <button 
                            onClick={() => handleApproveDeletion(driver.id)}
                            disabled={isUpdating}
                            className="flex items-center text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg transition-all"
                          >
                            <Check size={14} className="mr-1" /> Approuver et Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* List of Sub-Admins */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-white">
              <h3 className="text-lg font-black text-gray-900">Sous-Administrateurs Actifs</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-bold">
                    <th className="p-5">Nom / Email</th>
                    <th className="p-5">Accès Dashboard</th>
                    <th className="p-5">Accès Produits</th>
                    <th className="p-5">Accès Livreurs</th>
                    <th className="p-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {subAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-400 font-medium">
                        Aucun sous-administrateur trouvé. Promouvez un utilisateur ci-dessus.
                      </td>
                    </tr>
                  ) : (
                    subAdmins.map((admin) => (
                      <tr key={admin.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                        <td className="p-5">
                          <p className="font-bold text-gray-900">{admin.name}</p>
                          <p className="text-xs text-gray-500">{admin.email}</p>
                        </td>
                        <td className="p-5">
                          {admin.permissions?.canViewDashboard ? (
                            <CheckCircle2 size={20} className="text-green-500" />
                          ) : (
                            <XCircle size={20} className="text-gray-300" />
                          )}
                        </td>
                        <td className="p-5">
                          {admin.permissions?.canManageProducts ? (
                            <CheckCircle2 size={20} className="text-green-500" />
                          ) : (
                            <XCircle size={20} className="text-gray-300" />
                          )}
                        </td>
                        <td className="p-5">
                          {admin.permissions?.canManageDelivery ? (
                            <CheckCircle2 size={20} className="text-green-500" />
                          ) : (
                            <XCircle size={20} className="text-gray-300" />
                          )}
                        </td>
                        <td className="p-5 text-right">
                          <button 
                            onClick={() => revokeSubAdmin(admin.id)}
                            disabled={isUpdating}
                            className="text-xs font-bold text-red-500 hover:text-white border border-red-200 hover:bg-red-500 px-3 py-1.5 rounded-lg transition-all"
                          >
                            Révoquer
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
    </div>
  );
}
