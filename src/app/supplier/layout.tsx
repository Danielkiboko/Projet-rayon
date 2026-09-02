"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { LogOut, Menu, X, ShieldAlert, Bell, UserCircle, Search } from "lucide-react";
import { themeConfig, ServiceType } from "@/lib/themeConfig";
import ProfileUpdateModal from "@/components/ProfileUpdateModal";

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut, userData, user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-[#0b061c] text-white">Chargement...</div>;
  }

  if (!user || (userData?.role !== "SUPPLIER" && userData?.role !== "supplier")) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0b061c] text-white flex-col">
        <ShieldAlert size={48} className="mb-4 text-red-500" />
        <p>Accès refusé. Réservé aux fournisseurs.</p>
      </div>
    );
  }

  const service: ServiceType = (userData?.serviceAttached as ServiceType) || "default";
  const theme = themeConfig[service] || themeConfig["default"];
  const navItems = theme.menu;

  return (
    <div className={`flex h-screen bg-[#121212] overflow-hidden font-sans`}>
      <ProfileUpdateModal 
        user={user} 
        userData={userData} 
        onSuccess={() => window.location.reload()} 
      />
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
        className={`fixed inset-y-0 left-0 z-50 w-64 ${theme.colors.sidebarBg} border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white tracking-tight">
              Rayons<span className={theme.colors.accentText}>.</span>
            </span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.title} href={item.href}>
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? `${theme.colors.activeMenuBg} ${theme.colors.activeMenuText}` 
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
          <div className="px-4 py-3 mb-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Service rattaché</p>
            <p className={`text-sm ${theme.colors.accentText} font-semibold truncate`}>{theme.name}</p>
          </div>
          <button 
            onClick={() => signOut()}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={20} />
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
            <h1 className="text-lg font-semibold text-white hidden sm:block">Tableau de bord</h1>
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
              <span className="text-sm font-medium text-gray-300 hidden md:block">Fournisseur</span>
              <button className="p-1 rounded-full bg-white/5 text-gray-400 hover:text-white border border-white/5">
                <UserCircle size={28} />
              </button>
            </div>
          </div>
        </header>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {(userData?.role === "SUPPLIER_IMMO" || userData?.businessType === "IMMOBILIER" || userData?.rayon === "immo") && 
             (!userData?.rccm || !userData?.nif || !userData?.logoUrl || !userData?.idNat) && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start space-x-3">
                <ShieldAlert className="text-red-400 mt-0.5 shrink-0" size={20} />
                <div>
                  <h3 className="text-red-400 font-semibold text-sm">Profil Légal Incomplet</h3>
                  <p className="text-red-400/80 text-sm mt-1">Vous devez renseigner votre RCCM, ID Nat, NIF et Logo dans les Paramètres pour pouvoir générer des factures.</p>
                  <Link href="/supplier/settings" className="inline-block mt-2 text-xs font-semibold text-white bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-colors">
                    Aller aux paramètres
                  </Link>
                </div>
              </div>
            )}
            
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
