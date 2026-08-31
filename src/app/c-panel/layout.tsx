"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShoppingCart, 
  Truck, 
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { name: "Tableau de bord", href: "/c-panel", icon: LayoutDashboard },
  { name: "Clients", href: "/c-panel/clients", icon: Users },
  { name: "Fournisseurs", href: "/c-panel/suppliers", icon: Store },
  { name: "Support", href: "/c-panel/support", icon: MessageSquare },
  { name: "Commandes", href: "/c-panel/orders", icon: ShoppingCart },
  { name: "Livreurs", href: "/c-panel/drivers", icon: Truck },
  { name: "Paramètres", href: "/c-panel/settings", icon: Settings },
];

export default function CPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0b061c] overflow-hidden transition-colors duration-300">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : 0 }}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-[#140b2e]/80 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-white/10">
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-wider">Rayon<span className="text-primary">.</span> Admin</span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                }`}>
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between px-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Thème</span>
            <ThemeToggle />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => signOut()}
            className="flex items-center justify-center space-x-3 px-4 py-3 w-full rounded-lg text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-400/5 dark:hover:bg-red-400/15 border border-transparent transition-all shadow-sm"
          >
            <LogOut size={20} />
            <span className="font-medium">Déconnexion</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#140b2e]/50 backdrop-blur-md lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <Menu size={24} />
          </button>
          <span className="text-xl font-bold text-gray-900 dark:text-white">C-Panel</span>
          <div className="w-6" /> {/* Spacer */}
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
