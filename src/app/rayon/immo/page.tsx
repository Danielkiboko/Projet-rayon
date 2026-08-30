"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home as HomeIcon, Wifi, Building2, Globe, MapPin, Maximize, BedDouble, Bath, ChevronRight, Shirt, User } from "lucide-react";
import { ImmoContactModal } from "@/components/ImmoContactModal";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProductSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";

const DICT = {
  fr: {
    home: "Accueil",
    connect: "Rayons Connect",
    immo: "Rayons Immo",
    login: "Se connecter",
    title: "Trouvez le bien de vos rêves",
    subtitle: "Découvrez notre sélection de biens immobiliers exclusifs, maisons d'architecte et appartements de standing.",
    tag: "Immobilier Premium",
    all: "Tout",
    sale: "À Vendre",
    rent: "À Louer",
    appointment: "Prendre RDV",
  },
  en: {
    home: "Home",
    connect: "Connect Store",
    immo: "Immo Store",
    login: "Login",
    title: "Find your dream home",
    subtitle: "Discover our selection of exclusive real estate properties, architect-designed houses and luxury apartments.",
    tag: "Premium Real Estate",
    all: "All",
    sale: "For Sale",
    rent: "For Rent",
    appointment: "Book Appointment",
  }
};

const DUMMY_PROPERTIES = [
  {
    id: "dummy-immo-1",
    title: { fr: "Villa Contemporaine avec Piscine", en: "Contemporary Villa with Pool" },
    location: "Kinshasa, Gombe",
    typeTransaction: "Vente",
    price: 850000,
    image: "https://images.unsplash.com/photo-1613490908592-fd5e0c6c9e99?auto=format&fit=crop&q=80&w=800",
    immoDetails: { area: 450, beds: 5, baths: 4 }
  },
  {
    id: "dummy-immo-2",
    title: { fr: "Appartement de Standing Vue Fleuve", en: "Luxury Apartment with River View" },
    location: "Kinshasa, Ngaliema",
    typeTransaction: "Location",
    price: 3500, // Mensuel
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800",
    immoDetails: { area: 180, beds: 3, baths: 2 }
  },
  {
    id: "dummy-immo-3",
    title: { fr: "Maison Familiale Jardin Arboré", en: "Family House with Wooded Garden" },
    location: "Lubumbashi, Golf",
    typeTransaction: "Vente",
    price: 420000,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800",
    immoDetails: { area: 320, beds: 4, baths: 3 }
  },
  {
    id: "dummy-immo-4",
    title: { fr: "Duplex Moderne Centre-Ville", en: "Modern Downtown Duplex" },
    location: "Kinshasa, Limete",
    typeTransaction: "Location",
    price: 2800,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800",
    immoDetails: { area: 210, beds: 3, baths: 2 }
  },
  {
    id: "dummy-immo-5",
    title: { fr: "Terrain Constructible Clôturé", en: "Fenced Building Plot" },
    location: "Kinshasa, Macampagne",
    typeTransaction: "Vente",
    price: 150000,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800",
    immoDetails: { area: 1200, beds: 0, baths: 0 }
  },
  {
    id: "dummy-immo-6",
    title: { fr: "Studio Meublé Haut de Gamme", en: "High-end Furnished Studio" },
    location: "Kinshasa, Gombe",
    typeTransaction: "Location",
    price: 1500,
    image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=800",
    immoDetails: { area: 65, beds: 1, baths: 1 }
  }
];

export default function ImmoPage() {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = DICT[lang];
  const { user, loading, signOut } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), where("category", "==", "immo"));
        const querySnapshot = await getDocs(q);
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (productsList.length === 0) {
          setProducts(DUMMY_PROPERTIES);
        } else {
          setProducts(productsList);
        }
      } catch (error) {
        console.error("Error fetching properties:", error);
        setProducts(DUMMY_PROPERTIES);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <nav className="flex items-center justify-between p-4 lg:px-8 max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shadow-sm">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-wider">
              Rayons<span className="text-green-600 text-sm">.IMMO</span>
            </span>
          </div>
          
          {/* Main Navigation (Tabs) */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link href="/" className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <HomeIcon size={16} className="mr-2" /> {t.home}
            </Link>
            <Link href="/rayon/mode" className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Shirt size={16} className="mr-2 text-purple-600" /> Mode
            </Link>
            <Link href="/rayon/connect" className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Wifi size={16} className="mr-2 text-blue-600" /> {t.connect}
            </Link>
            <Link href="/rayon/immo" className="flex items-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 transition-colors">
              <Building2 size={16} className="mr-2 text-green-600" /> {t.immo}
            </Link>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="flex items-center px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Globe size={14} className="mr-1" /> {lang.toUpperCase()}
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
        
        {/* Immo Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-12 shadow-xl h-[300px]">
          <img 
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=2000" 
            alt="Modern House" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-900/60 to-transparent"></div>
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 w-full md:w-2/3">
            <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold tracking-wider rounded-full mb-4 border border-white/30 uppercase w-max">
              {t.tag}
            </span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4"
            >
              {t.title}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-green-50 max-w-lg hidden md:block"
            >
              {t.subtitle}
            </motion.p>
          </div>
        </div>

        {/* Filters (Simplified) */}
        <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
          <button className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-full text-sm">{t.all}</button>
          <button className="px-6 py-2 bg-white border border-gray-200 text-gray-600 font-semibold rounded-full text-sm hover:bg-gray-50 transition-colors">{t.sale}</button>
          <button className="px-6 py-2 bg-white border border-gray-200 text-gray-600 font-semibold rounded-full text-sm hover:bg-gray-50 transition-colors">{t.rent}</button>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <>
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
            </>
          ) : (
            products.map((property, idx) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group flex flex-col"
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={property.image} 
                    alt={property.title?.[lang]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 text-xs font-bold tracking-wider rounded border uppercase ${
                      property.typeTransaction === "Vente" ? "bg-white/90 text-green-700 border-green-200" : "bg-white/90 text-blue-700 border-blue-200"
                    } backdrop-blur-md shadow-sm`}>
                      {property.typeTransaction || "Vente"}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="text-2xl font-bold text-white drop-shadow-md">
                      $ {property.price?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                    {property.title?.[lang]}
                  </h3>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-6">
                    <MapPin size={16} className="mr-1 text-green-600" />
                    {property.location}
                  </div>
                  
                  {/* Features */}
                  <div className="flex items-center justify-between border-t border-b border-gray-100 py-4 mb-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Maximize size={18} className="text-gray-400" />
                      <span>{property.immoDetails?.area} m²</span>
                    </div>
                    {property.immoDetails?.beds > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <BedDouble size={18} className="text-gray-400" />
                        <span>{property.immoDetails?.beds}</span>
                      </div>
                    )}
                    {property.immoDetails?.baths > 0 && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Bath size={18} className="text-gray-400" />
                        <span>{property.immoDetails?.baths}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-auto">
                    <button 
                      onClick={() => setSelectedProperty(property.title?.[lang])}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-sm"
                    >
                      <span>{t.appointment}</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

      </main>

      <ImmoContactModal 
        isOpen={!!selectedProperty} 
        onClose={() => setSelectedProperty(null)} 
        propertyTitle={selectedProperty || ""}
      />
    </div>
  );
}
