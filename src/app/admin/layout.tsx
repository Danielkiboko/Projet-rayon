"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { LogOut, Menu, X, ShieldAlert, Bell, UserCircle, Search, LayoutDashboard, Package, Users, Settings, UserCheck, Store, Truck } from "lucide-react";

const ADMIN_MENU = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Produits", href: "/admin/products", icon: Package },
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
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : 0 }}
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar (Permanent) */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#121212]/80 backdrop-blur-md z-30">
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
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#121212]"></span>
            </button>
            <div className="flex items-center space-x-2 pl-4 border-l border-white/10">
              <span className="text-sm font-medium text-gray-300 hidden md:block">Daniel Kiboko</span>
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
