"use client";

import Link from "next/link";
import { Home as HomeIcon, Wifi, Building2, Globe, Shirt, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface RayonNavbarProps {
  category: "immo" | "mode" | "connect";
  lang: "fr" | "en";
  setLang: (lang: "fr" | "en") => void;
  t: any;
}

export function RayonNavbar({ category, lang, setLang, t }: RayonNavbarProps) {
  const { user, signOut } = useAuth();

  const themeConfig = {
    immo: {
      color: "green",
      icon: <Building2 size={18} className="text-white" />,
      titleSuffix: ".IMMO",
      bgClass: "bg-green-600",
      textClass: "text-green-600"
    },
    mode: {
      color: "purple",
      icon: <Shirt size={18} className="text-white" />,
      titleSuffix: ".MODE",
      bgClass: "bg-purple-600",
      textClass: "text-purple-600"
    },
    connect: {
      color: "blue",
      icon: <Wifi size={18} className="text-white" />,
      titleSuffix: ".CONNECT",
      bgClass: "bg-blue-600",
      textClass: "text-blue-600"
    }
  };

  const theme = themeConfig[category];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <nav className="flex items-center justify-between p-4 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-lg ${theme.bgClass} flex items-center justify-center shadow-sm`}>
            {theme.icon}
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-wider">
            Rayons<span className={`${theme.textClass} text-sm`}>{theme.titleSuffix}</span>
          </span>
        </div>
        
        <div className="hidden lg:flex items-center space-x-2">
          <Link href="/" className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <HomeIcon size={16} className="mr-2" /> {t.home}
          </Link>
          
          <Link href="/rayon/mode" className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${category === 'mode' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}>
            <Shirt size={16} className="mr-2 text-purple-600" /> {t.mode || 'Mode'}
          </Link>
          
          <Link href="/rayon/connect" className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${category === 'connect' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}>
            <Wifi size={16} className="mr-2 text-blue-600" /> {t.connect || 'Connect'}
          </Link>
          
          <Link href="/rayon/immo" className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${category === 'immo' ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}>
            <Building2 size={16} className="mr-2 text-green-600" /> {t.immo || 'Immo'}
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2">
            <button 
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="flex items-center px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Globe size={14} className="mr-1" /> {lang.toUpperCase()}
            </button>
          </div>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/dashboard" className="flex items-center gap-1 text-sm font-bold text-gray-700 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-full">
                <User size={18} />
                {user.displayName || "Mon compte"}
              </Link>
              <button onClick={() => signOut()} className="text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-full">
                Déconnexion
              </button>
            </div>
          ) : (
            <Link href="/login" className="hidden sm:flex items-center gap-1 text-sm font-bold text-gray-700 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-full">
              <User size={18} />
              {t.login}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
