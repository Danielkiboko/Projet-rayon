"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingCart, User, Menu, MapPin, ChevronRight, Star, Heart, TrendingUp, Home as HomeIcon, Wifi, Building, Globe, ArrowRight, Infinity, Shirt } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

// Mock products for testing
const TEST_PRODUCTS = [
  {
    id: "test-1",
    name: "Avocats Bio (Test)",
    price: 15.50,
    image: "https://images.unsplash.com/photo-1519996409144-56c88c9aa612?auto=format&fit=crop&q=80&w=400",
    category: "Fruits & Légumes",
    rating: 4.8
  },
  {
    id: "test-2",
    name: "Croissants Pur Beurre (Test)",
    price: 8.00,
    image: "https://images.unsplash.com/photo-1555507036-ab1e403214a6?auto=format&fit=crop&q=80&w=400",
    category: "Boulangerie",
    rating: 4.9
  },
  {
    id: "test-3",
    name: "Jus d'Orange Pressé (Test)",
    price: 12.00,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400",
    category: "Boissons",
    rating: 4.5
  }
];

export default function Home() {
  const { user } = useAuth();
  const { cartTotalCount, addToCart } = useCart();

  const [activeCategory, setActiveCategory] = useState("Tout");
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real products from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const prods: any[] = [];
      snapshot.forEach(doc => {
        prods.push({ id: doc.id, ...doc.data() });
      });
      setDbProducts(prods);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Combine real products and test products
  const allProducts = [...dbProducts, ...TEST_PRODUCTS];

  // Filter products by category
  const filteredProducts = activeCategory === "Tout" 
    ? allProducts 
    : allProducts.filter(p => p.category === activeCategory);

  const categories = ["Tout", "Fruits & Légumes", "Boulangerie", "Boissons", "Épicerie", "Mode"];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans selection:bg-gray-200">
      
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm transition-all border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 -ml-2 text-gray-600 hover:text-gray-900 lg:hidden">
              <Menu size={24} />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#4F46E5] text-white rounded-lg flex items-center justify-center shadow-sm">
                <Infinity size={20} />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">Rayons<span className="text-gray-400 font-normal">.NET</span></span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-900 bg-gray-100 px-4 py-2 rounded-full">
              <HomeIcon size={18} />
              Accueil
            </Link>
            <Link href="/rayon/mode" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <Shirt size={18} />
              Rayons Mode
            </Link>
            <Link href="/rayon/connect" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <Wifi size={18} />
              Rayons Connect
            </Link>
            <Link href="/rayon/immo" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <Building size={18} />
              Rayons Immo
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <button className="hidden sm:flex items-center gap-1 text-sm font-bold text-gray-700 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full">
              <Globe size={16} />
              FR
            </button>
            <Link href="/checkout" className="relative p-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors group">
              <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
              {cartTotalCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {cartTotalCount}
                </span>
              )}
            </Link>
            <Link href={user ? (user as any).role === "DELIVERY" ? "/delivery/dashboard" : user.role === "SUPPLIER" ? "/supplier/dashboard" : "/profile" : "https://admin.rayons.net"} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-900 border-2 border-gray-200 hover:border-gray-900 rounded-full transition-colors">
              <span>{user ? user.displayName || "Mon compte" : "Se connecter"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-10">
        
        {/* Hero Banner */}
        <section className="relative w-full h-[400px] sm:h-[500px] rounded-3xl overflow-hidden shadow-sm mt-4">
          <img 
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero Banner" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/50 to-transparent"></div>
          
          <div className="absolute inset-0 p-8 sm:p-12 md:p-16 flex flex-col justify-center max-w-2xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-md">
              L'excellence pour votre quotidien.
            </h1>
            <p className="text-gray-200 text-sm sm:text-base md:text-lg mb-8 max-w-xl drop-shadow">
              Découvrez notre sélection premium d'équipements technologiques et de biens immobiliers de prestige.
            </p>
            <div>
              <button className="bg-white text-gray-900 font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-lg active:scale-95">
                Découvrir la collection
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </section>

        {/* Nos Rayons - Navigation type Supermarché */}
        <section className="mt-12">
          <div className="mb-6 px-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Explorer nos rayons
            </h2>
            <p className="text-gray-500 mt-1">L'expérience d'un grand magasin réinventée en ligne</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Rayon Mode */}
            <Link href="/rayon/mode" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-300 transition-all group flex flex-col justify-between items-start min-h-[160px] relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shirt size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
                  Mode <ChevronRight size={16} className="ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-sm text-gray-500 font-medium">Mode, Accessoires</p>
              </div>
            </Link>

            {/* Rayon Connect */}
            <Link href="/rayon/connect" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-300 transition-all group flex flex-col justify-between items-start min-h-[160px] relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Wifi size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
                  Connect <ChevronRight size={16} className="ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-sm text-gray-500 font-medium">Starlink, Tech B2B</p>
              </div>
            </Link>

            {/* Rayon Immo */}
            <Link href="/rayon/immo" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-300 transition-all group flex flex-col justify-between items-start min-h-[160px] relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Building size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center">
                  Immobilier <ChevronRight size={16} className="ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-sm text-gray-500 font-medium">Ventes & Locations</p>
              </div>
            </Link>
          </div>
        </section>
        {/* Products Grid */}
        <section>
          <div className="flex flex-col mb-4 px-1 gap-2 mt-8">
            <div>
              <span className="bg-[#4F46E5]/10 text-[#4F46E5] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                Sélection Premium
              </span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Nouveautés & Tendances
              </h2>
              <Link href="#" className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                Voir tout le catalogue <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-white rounded-2xl h-64 border border-gray-100"></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500 font-medium">Aucun produit dans cette catégorie pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-all active:scale-90">
                      <Heart size={16} />
                    </button>
                    {product.rating && (
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                        <Star size={12} className="fill-orange-400 text-orange-400" />
                        <span className="text-xs font-bold text-gray-900">{product.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-xs font-bold text-gray-500 mb-1 line-clamp-1">{product.category}</p>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                      <span className="font-bold text-lg text-gray-900">{parseFloat(product.price).toFixed(2)} AED</span>
                      <button 
                        onClick={() => addToCart({
                          id: product.id,
                          title: product.name,
                          price: product.price.toString(),
                          image: product.image
                        })}
                        className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center hover:bg-gray-900 hover:text-white transition-colors active:scale-90 shadow-sm"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

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
          <Link href="https://admin.rayons.net" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
            <div className="p-1"><User size={24} /></div>
            <span className="text-[10px] font-bold">Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
