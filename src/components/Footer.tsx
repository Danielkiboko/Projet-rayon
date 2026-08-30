"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { TrendingUp, ShoppingCart, User } from "lucide-react";

export function Footer() {
  const { user } = useAuth();
  const { cartTotalCount } = useCart();

  return (
    <>
      {/* Footer / Accès Admin & Partenaires */}
      <footer className="w-full bg-gray-900 text-white py-12 mt-12 mb-16 sm:mb-0 text-center border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="text-2xl font-black italic tracking-tighter mb-4">RAYON<span className="text-blue-500">.</span></div>
          <p className="mb-6 text-gray-400 text-sm max-w-md">La plateforme de vente en ligne rapide et fiable.</p>
          
          <Link 
            href="/login"
            className="inline-block px-8 py-3 bg-white text-gray-900 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-sm"
          >
            {user ? "Accéder à mon Dashboard" : "Connexion Admin / Partenaires"}
          </Link>
          
          <p className="mt-8 text-gray-500 text-xs">© 2026 Rayon. Tous droits réservés.</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe sm:hidden z-50">
        <div className="flex justify-around p-3">
          <Link href="/" className="flex flex-col items-center gap-1 text-gray-900">
            <div className="p-1"><TrendingUp size={24} /></div>
            <span className="text-[10px] font-bold">Explorer</span>
          </Link>
          <Link href="/checkout" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors relative">
            <div className="p-1"><ShoppingCart size={24} /></div>
            <span className="text-[10px] font-bold">Panier</span>
            {cartTotalCount > 0 && (
              <span className="absolute top-0 right-3 w-4 h-4 bg-gray-900 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                {cartTotalCount}
              </span>
            )}
          </Link>
          <Link href="/login" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
            <div className="p-1"><User size={24} /></div>
            <span className="text-[10px] font-bold">Menu</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
