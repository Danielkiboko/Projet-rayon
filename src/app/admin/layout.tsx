"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { LogOut, Menu, X, ShieldAlert, Bell, UserCircle, Search, LayoutDashboard, Package, Users, Settings, UserCheck, Store, Truck, Building, ShoppingCart } from "lucide-react";

const ADMIN_MENU = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Commandes", href: "/admin/orders", icon: ShoppingCart },
  { title: "Produits", href: "/admin/products", icon: Package },
  { title: "Immobilier", href: "/admin/properties", icon: Building },
  { title: "Clients", href: "/admin/clients", icon: UserCheck },
  { title: "Fournisseurs", href: "/admin/suppliers", icon: Store },
  { title: "Livreurs", href: "/admin/drivers", icon: Truck },
  { title: "Équipe", href: "/admin/team", icon: Users },
  { title: "Paramètres", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut, user, userData, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Autoriser Super Admin et Sub Admin
  const isSuperAdmin = user?.email === "danielkiboko218@gmail.com" || userData?.role === "SUPER_ADMIN";
  const isSubAdmin = userData?.role === "SUB_ADMIN";
  const hasAccess = isSuperAdmin || isSubAdmin;

  // Notifications logic
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!hasAccess) return;

    let unsubUsers: any;
    let unsubProps: any;
    let unsubProds: any;

    const setupListeners = async () => {
      try {
        const { collection, query, where, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");

        // Helper to update state safely
        const updateNotifications = (type: string, newItems: any[]) => {
          setNotifications(prev => {
            const filtered = prev.filter(n => n.type !== type);
            const combined = [...filtered, ...newItems].sort((a, b) => b.time - a.time);
            setUnreadCount(combined.length);
            return combined;
          });
        };

        // 1. Pending suppliers
        const qUsers = query(
          collection(db, "users"), 
          where("role", "in", ["SUPPLIER", "supplier", "SUPPLIER_IMMO", "supplier_immo"])
        );
        unsubUsers = onSnapshot(qUsers, (snapshot) => {
          const items: any[] = [];
          snapshot.forEach(doc => {
            const d = doc.data();
            if (d.profileUpdateStatus === "PENDING_APPROVAL" || d.status === "PENDING_APPROVAL") {
              items.push({
                id: `supplier-${doc.id}`,
                type: "supplier",
                title: "Profil Fournisseur modifié",
                message: `${d.displayName || d.email} a mis à jour ses informations.`,
                time: Date.now(),
                link: "/admin/suppliers"
              });
            }
          });
          updateNotifications("supplier", items);
        });

        // 2. Pending properties
        const qProps = query(collection(db, "properties"), where("status", "==", "PENDING_APPROVAL"));
        unsubProps = onSnapshot(qProps, (snapshot) => {
          const items: any[] = [];
          snapshot.forEach(doc => {
            const d = doc.data();
            items.push({
              id: `property-${doc.id}`,
              type: "property",
              title: "Nouveau Bien Immobilier",
              message: `${d.title || 'Bien'} est en attente de validation.`,
              time: Date.now(),
              link: "/admin/properties"
            });
          });
          updateNotifications("property", items);
        });

        // 3. Pending products
        const qProds = query(collection(db, "products"), where("status", "in", ["PENDING_APPROVAL", "pending_approval"]));
        unsubProds = onSnapshot(qProds, (snapshot) => {
          const items: any[] = [];
          snapshot.forEach(doc => {
            const d = doc.data();
            items.push({
              id: `product-${doc.id}`,
              type: "product",
              title: "Nouveau Produit",
              message: `${d.name || 'Produit'} est en attente de validation.`,
              time: Date.now(),
              link: "/admin/products"
            });
          });
          updateNotifications("product", items);
        });

      } catch (err) {
        console.error("Error setting up notifications:", err);
      }
    };

    setupListeners();

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubProps) unsubProps();
      if (unsubProds) unsubProds();
    };
  }, [hasAccess]);

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-[#0b061c] text-white">Chargement...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0b061c] text-white flex-col">
        <ShieldAlert size={48} className="mb-4 text-red-500" />
        <h1 className="text-2xl font-bold mb-2">Accès Refusé</h1>
        <p className="text-gray-400">Cette zone est strictement réservée à la direction.</p>
        <Link href="/" className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden font-sans">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Slim or Normal depending on design, here we keep it structured */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white tracking-tight">
              Rayons<span className="text-blue-500">.</span>
            </span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {ADMIN_MENU.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link key={item.title} href={item.href}>
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? `bg-blue-600/10 text-blue-500` 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>{item.title}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="px-4 py-3 mb-4 bg-blue-600/10 rounded-xl border border-blue-500/20 text-center">
            <ShieldAlert size={20} className="mx-auto mb-1 text-blue-500" />
            <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Privilèges</p>
            <p className={`text-sm text-blue-500 font-semibold truncate`}>
              {isSuperAdmin ? "SUPER ADMIN" : "SOUS ADMIN"}
            </p>
          </div>
          <button 
            onClick={() => signOut()}
            className="flex items-center justify-center space-x-2 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </motion.aside>

      {/* Main content wrapper */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar (Permanent) */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#121212]/80 backdrop-blur-md z-30 relative">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="mr-4 text-gray-400 hover:text-white lg:hidden">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold text-white hidden sm:block">Administration Centrale</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center bg-white/5 rounded-full px-4 py-2 border border-white/5">
              <Search size={16} className="text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none w-48"
              />
            </div>
            
            {/* Notification Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </button>
              
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-[#222]">
                      <h3 className="text-sm font-semibold text-white">Notifications ({unreadCount})</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          Aucune action requise.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <Link 
                            key={notif.id} 
                            href={notif.link}
                            onClick={() => setIsNotifOpen(false)}
                            className="block p-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-start">
                              <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center mr-3 shrink-0">
                                <ShieldAlert size={16} />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-white">{notif.title}</h4>
                                <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2 pl-4 border-l border-white/10">
              <span className="text-sm font-medium text-gray-300 hidden md:block">{userData?.displayName || userData?.name || "Admin"}</span>
              <button className="p-1 rounded-full bg-white/5 text-gray-400 hover:text-white border border-white/5">
                <UserCircle size={28} />
              </button>
            </div>
          </div>
        </header>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
