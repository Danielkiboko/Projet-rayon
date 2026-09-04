"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { LogOut, Menu, X, Bell, UserCircle, Search, ShieldAlert } from "lucide-react";

export type MenuItem = {
  title: string;
  href: string;
  icon: any;
};

export type ThemeColors = {
  sidebarBg: string;
  activeMenuBg: string;
  activeMenuText: string;
  accentText: string;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  time: number;
  link: string;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  themeColors?: ThemeColors;
  roleBadgeTitle?: string;
  roleBadgeValue?: string;
  topbarTitle?: string;
  userName?: string;
  userRole?: string;
  notifications?: Notification[];
  unreadCount?: number;
  customProfileModal?: React.ReactNode;
}

export default function DashboardLayout({
  children,
  menuItems,
  themeColors = {
    sidebarBg: "bg-[#0A0A0A]",
    activeMenuBg: "bg-blue-600/10",
    activeMenuText: "text-blue-500",
    accentText: "text-blue-500",
  },
  roleBadgeTitle = "Privilèges",
  roleBadgeValue = "ADMIN",
  topbarTitle = "Tableau de bord",
  userName = "Utilisateur",
  userRole = "Admin",
  notifications = [],
  unreadCount = 0,
  customProfileModal,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#121212] overflow-hidden font-sans">
      {customProfileModal}
      
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 w-64 ${themeColors.sidebarBg} border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white tracking-tight">
              Rayons<span className={themeColors.accentText}>.</span>
            </span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link key={item.title} href={item.href}>
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? `${themeColors.activeMenuBg} ${themeColors.activeMenuText}` 
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
          <div className={`px-4 py-3 mb-4 rounded-xl border text-center ${themeColors.activeMenuBg} border-white/5`}>
            {roleBadgeTitle === "Privilèges" && <ShieldAlert size={20} className={`mx-auto mb-1 ${themeColors.accentText}`} />}
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{roleBadgeTitle}</p>
            <p className={`text-sm font-semibold truncate ${themeColors.accentText}`}>
              {roleBadgeValue}
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
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#121212]/80 backdrop-blur-md z-30 relative">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="mr-4 text-gray-400 hover:text-white lg:hidden">
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold text-white hidden sm:block">{topbarTitle}</h1>
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
                          Aucune notification.
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
                              <div className={`w-8 h-8 rounded bg-blue-500/20 ${themeColors.accentText} flex items-center justify-center mr-3 shrink-0`}>
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
              <div className="hidden md:block text-right">
                <span className="text-sm font-medium text-gray-300 block leading-tight">{userName}</span>
                <span className="text-[10px] text-gray-500 block leading-tight">{userRole}</span>
              </div>
              <button className="p-1 rounded-full bg-white/5 text-gray-400 hover:text-white border border-white/5">
                <UserCircle size={28} />
              </button>
            </div>
          </div>
        </header>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
