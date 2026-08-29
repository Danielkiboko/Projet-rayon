"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  X
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Tableau de bord", href: "/c-panel", icon: LayoutDashboard },
  { name: "Fournisseurs", href: "/c-panel/suppliers", icon: Store },
  { name: "Clients", href: "/c-panel/clients", icon: Users },
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0b061c] overflow-hidden">
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#140b2e] border-r border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
          <span className="text-xl font-bold text-white tracking-wider">Rayon<span className="text-primary-light">.</span> Admin</span>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
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
                    ? "bg-primary text-white" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}>
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-400/10 transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#140b2e]/50 backdrop-blur-md lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={24} />
          </button>
          <span className="text-xl font-bold text-white">C-Panel</span>
          <div className="w-6" /> {/* Spacer */}
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
