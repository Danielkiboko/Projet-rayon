"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart, ShieldCheck, ChevronRight, Home as HomeIcon, Wifi, Building2, Globe, Shirt, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { db } from "@/lib/firebase";
import { ProductSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";

const DICT = {
  fr: {
    home: "Accueil",
    connect: "Rayons Connect",
    immo: "Rayons Immo",
    login: "Se connecter",
    title: "Équipements Technologiques",
    add: "Ajouter au panier",
    details: "Détails",
  },
  en: {
    home: "Home",
    connect: "Connect Store",
    immo: "Immo Store",
    login: "Login",
    title: "Technological Equipment",
    add: "Add to cart",
    details: "Details",
  }
};

const DUMMY_PRODUCTS = [
  {
    id: "dummy-connect-1",
    title: { fr: "Starlink Kit Standard", en: "Starlink Standard Kit" },
    description: { fr: "Internet haut débit à faible latence partout dans le monde.", en: "High-speed, low-latency broadband internet across the globe." },
    price: 499.00,
    image: "https://images.unsplash.com/photo-1623821035216-9538dc903fb5?auto=format&fit=crop&q=80&w=800",
    brand: "SpaceX",
    tag: { fr: "Populaire", en: "Popular" }
  },
  {
    id: "dummy-connect-2",
    title: { fr: "Routeur Pro Wi-Fi 6", en: "Pro Wi-Fi 6 Router" },
    description: { fr: "Connectivité ultra-rapide pour toute la maison.", en: "Ultra-fast connectivity for the whole house." },
    price: 199.99,
    image: "https://images.unsplash.com/photo-1544228833-289b4e135f60?auto=format&fit=crop&q=80&w=800",
    brand: "NetTech",
    tag: { fr: "Nouveau", en: "New" }
  },
  {
    id: "dummy-connect-3",
    title: { fr: "Caméra de Sécurité 4K", en: "4K Security Camera" },
    description: { fr: "Surveillance intelligente avec vision nocturne avancée.", en: "Smart surveillance with advanced night vision." },
    price: 129.50,
    image: "https://images.unsplash.com/photo-1557825835-b4597f7663db?auto=format&fit=crop&q=80&w=800",
    brand: "SecureVision",
    tag: { fr: "Essentiel", en: "Essential" }
  },
  {
    id: "dummy-connect-4",
    title: { fr: "Onduleur UPS 1500VA", en: "UPS 1500VA" },
    description: { fr: "Protection de l'alimentation avec batterie de secours.", en: "Power protection with battery backup." },
    price: 249.00,
    image: "https://images.unsplash.com/photo-1587840171670-8b850147754e?auto=format&fit=crop&q=80&w=800",
    brand: "PowerSafe",
    tag: { fr: "Pro", en: "Pro" }
  },
  {
    id: "dummy-connect-5",
    title: { fr: "Casque Réduction de Bruit", en: "Noise Cancelling Headphones" },
    description: { fr: "Audio premium pour la concentration au travail.", en: "Premium audio for work concentration." },
    price: 349.99,
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800",
    brand: "AuraSound",
    tag: { fr: "Premium", en: "Premium" }
  },
  {
    id: "dummy-connect-6",
    title: { fr: "Hub USB-C 10-en-1", en: "10-in-1 USB-C Hub" },
    description: { fr: "Station d'accueil multifonction pour ordinateur portable.", en: "Multifunction docking station for laptop." },
    price: 79.90,
    image: "https://images.unsplash.com/photo-1596756627684-257aedfb2559?auto=format&fit=crop&q=80&w=800",
    brand: "TechConnect",
    tag: { fr: "Accessoire", en: "Accessory" }
  }
];

export default function ConnectPage() {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = DICT[lang];
  const { addToCart, setIsCartOpen, cartTotalCount } = useCart();
  const { user, loading, signOut } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), where("category", "==", "connect"));
        const querySnapshot = await getDocs(q);
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (productsList.length === 0) {
          setProducts(DUMMY_PRODUCTS);
        } else {
          setProducts(productsList);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts(DUMMY_PRODUCTS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      title: product.title[lang] || product.title,
      price: `$ ${Number(product.price).toFixed(2).replace(".", ",")}`,
      image: product.image,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <nav className="flex items-center justify-between p-4 lg:px-8 max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Wifi size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-wider">
              Rayons<span className="text-blue-600 text-sm">.CONNECT</span>
            </span>
          </div>
          
          {/* Main Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link href="/" className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <HomeIcon size={16} className="mr-2" /> {t.home}
            </Link>
            <Link href="/rayon/mode" className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Shirt size={16} className="mr-2 text-purple-600" /> Mode
            </Link>
            <Link href="/rayon/connect" className="flex items-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 transition-colors">
              <Wifi size={16} className="mr-2 text-blue-600" /> {t.connect}
            </Link>
            <Link href="/rayon/immo" className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Building2 size={16} className="mr-2 text-green-600" /> {t.immo}
            </Link>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <button 
                onClick={() => setLang(lang === "fr" ? "en" : "fr")}
                className="flex items-center px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Globe size={14} className="mr-1" /> {lang.toUpperCase()}
              </button>
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ShoppingCart size={20} />
              {cartTotalCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-blue-600 rounded-full transform translate-x-1 -translate-y-1">
                  {cartTotalCount}
                </span>
              )}
            </button>
            <Link href="/login" className="hidden sm:flex items-center gap-1 text-sm font-bold text-gray-700 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-full">
              <User size={18} />
              {t.login}
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Connect Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-12 shadow-xl h-[300px]">
          <img 
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=2000" 
            alt="Technology" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/60 to-transparent"></div>
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 w-full md:w-2/3">
            <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold tracking-wider rounded-full mb-4 border border-white/30 uppercase w-max">
              {t.connect}
            </span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight"
            >
              {t.title}
            </motion.h1>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <>
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
            </>
          ) : (
            products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group flex flex-col"
              >
                {/* Product Image */}
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  <img 
                    src={product.image} 
                    alt={product.title?.[lang]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-blue-600 text-[10px] font-bold tracking-wider rounded border border-gray-200 shadow-sm uppercase">
                      {product.tag?.[lang]}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-xs font-bold tracking-wider">{product.brand}</span>
                    <span className="flex items-center text-green-600 text-[10px] font-bold">
                      <ShieldCheck size={12} className="mr-1" /> Verified
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                    {product.title?.[lang]}
                  </h3>
                  
                  <p className="text-gray-500 text-sm mb-6 flex-1 line-clamp-2">
                    {product.description?.[lang]}
                  </p>
                  
                  <div className="text-2xl font-bold text-gray-900 mb-6">
                    $ {product.price?.toFixed(2).replace(".", ",")}
                  </div>
                
                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors text-center"
                    >
                      {t.add}
                    </button>
                    <Link 
                      href={`/product/${product.id}`}
                      className="py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors text-center flex items-center justify-center shadow-sm"
                    >
                      {t.details}
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
