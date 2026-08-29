"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Map, ListTodo, User } from "lucide-react";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/driver/login";

  if (isLoginPage) {
    return <div className="bg-[#0b061c] min-h-screen text-white">{children}</div>;
  }

  return (
    <div className="bg-[#0b061c] min-h-screen text-white flex flex-col max-w-md mx-auto border-x border-white/5 shadow-2xl relative">
      {/* Contenu principal défilable */}
      <div className="flex-1 overflow-y-auto pb-20">
        {children}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="absolute bottom-0 w-full h-16 bg-[#140b2e] border-t border-white/10 flex justify-around items-center px-2 z-50">
        <Link 
          href="/driver" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/driver" ? "text-primary-light" : "text-gray-500 hover:text-gray-300"}`}
        >
          <ListTodo size={24} />
          <span className="text-[10px] font-medium">Missions</span>
        </Link>
        <Link 
          href="/driver/map" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname.includes("/driver/mission") || pathname === "/driver/map" ? "text-primary-light" : "text-gray-500 hover:text-gray-300"}`}
        >
          <Map size={24} />
          <span className="text-[10px] font-medium">Carte</span>
        </Link>
        <Link 
          href="/driver/profile" 
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${pathname === "/driver/profile" ? "text-primary-light" : "text-gray-500 hover:text-gray-300"}`}
        >
          <User size={24} />
          <span className="text-[10px] font-medium">Profil</span>
        </Link>
      </nav>
    </div>
  );
}
