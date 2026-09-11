"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Home as HomeIcon, Wifi, Building2, Globe, MapPin, Maximize, 
  BedDouble, Bath, ChevronRight, Shirt, User, MessageSquare,
  Hotel, Star, Sparkles, Zap, Waves, CalendarCheck
} from "lucide-react";
import { RayonNavbar } from "@/components/rayon/RayonNavbar";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProductSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { ImmoContactModal } from "@/components/ImmoContactModal";

const DICT = {
  fr: {
    home: "Accueil",
    connect: "Rayons Connect",
    immo: "Rayons Immo",
    login: "Se connecter",
    title: "Trouvez le bien de vos rêves",
    subtitle: "Découvrez notre sélection exclusive : villas de standing, appartements d'architecte et hôtels de prestige.",
    tag: "Immobilier & Hôtellerie Premium",
    all: "Tous les biens",
    sale: "À Vendre",
    rent: "À Louer",
    hotels: "🏨 Hôtels & Nuitées",
    appointment: "Prendre RDV",
  },
  en: {
    home: "Home",
    connect: "Connect Store",
    immo: "Immo Store",
    login: "Login",
    title: "Find your dream home",
    subtitle: "Discover our exclusive selection: luxury villas, designer apartments and prestigious hotels.",
    tag: "Premium Real Estate & Hospitality",
    all: "All properties",
    sale: "For Sale",
    rent: "For Rent",
    hotels: "🏨 Hotels & Stays",
    appointment: "Book Appointment",
  }
};

export default function ImmoPage() {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = DICT[lang];
  const { user, loading, signOut } = useAuth();
  const { openChatForProduct } = useChat();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "sale" | "rent" | "hotel">("all");
  const [contactProperty, setContactProperty] = useState<any | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, "properties"), 
          where("status", "==", "Disponible")
        );
        const querySnapshot = await getDocs(q);
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProducts(productsList);
      } catch (error) {
        console.error("Error fetching properties:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(property => {
    const t = (property.typeTransaction || "").toLowerCase().trim();
    const type = (property.type || "").toLowerCase().trim();
    const isHotel = type === "hotel" || t.includes("hotel") || t.includes("nuit") || t.includes("réservation") || t.includes("reservation") || t.includes("journali") || !!property.hotelDetails;

    if (selectedCategory === "all") return true;
    if (selectedCategory === "hotel") return isHotel;
    if (selectedCategory === "sale") {
      return !isHotel && (t.includes("vent") || t.includes("vendre") || t === "sale");
    }
    if (selectedCategory === "rent") {
      return !isHotel && (t.includes("locat") || t.includes("lou") || t.includes("coloc") || t === "rent");
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <RayonNavbar 
        category="immo"
        lang={lang}
        setLang={setLang}
        t={t}
      />

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

        {/* Filters */}
        <div className="flex space-x-3 mb-8 overflow-x-auto pb-2">
          <button 
            onClick={() => setSelectedCategory("all")}
            className={`px-5 py-2 font-semibold rounded-full text-sm transition-all whitespace-nowrap ${
              selectedCategory === "all" ? "bg-gray-900 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.all}
          </button>
          <button 
            onClick={() => setSelectedCategory("hotel")}
            className={`px-5 py-2 font-semibold rounded-full text-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === "hotel" 
                ? "bg-gray-900 text-white shadow-md" 
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
            }`}
          >
            <Hotel size={16} className={selectedCategory === "hotel" ? "text-amber-400" : "text-amber-600"} />
            <span>{t.hotels}</span>
          </button>
          <button 
            onClick={() => setSelectedCategory("sale")}
            className={`px-5 py-2 font-semibold rounded-full text-sm transition-all whitespace-nowrap ${
              selectedCategory === "sale" ? "bg-green-700 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.sale}
          </button>
          <button 
            onClick={() => setSelectedCategory("rent")}
            className={`px-5 py-2 font-semibold rounded-full text-sm transition-all whitespace-nowrap ${
              selectedCategory === "rent" ? "bg-blue-700 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.rent}
          </button>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <>
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
            </>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
              <Hotel size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="font-semibold">Aucun bien disponible dans cette catégorie pour le moment.</p>
              <button onClick={() => setSelectedCategory("all")} className="mt-3 text-sm text-green-700 hover:underline">
                Voir tous les biens
              </button>
            </div>
          ) : (
            filteredProducts.map((property, idx) => {
              const t = (property.typeTransaction || "").toLowerCase().trim();
              const isHotel = property.type === "hotel" || t.includes("hotel") || t.includes("nuit") || t.includes("réservation") || t.includes("reservation") || t.includes("journali") || !!property.hotelDetails;
              const isSale = !isHotel && (t.includes("vent") || t.includes("vendre") || t === "sale");

              return (
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
                      alt={property.title?.[lang] || property.title?.fr || property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      {isHotel ? (
                        <span className="px-3 py-1.5 text-xs font-bold tracking-wider rounded-xl uppercase bg-black/85 text-white border border-white/20 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                          <Hotel size={13} className="text-amber-400" />
                          {property.hotelDetails?.stars && !isNaN(parseInt(property.hotelDetails.stars)) ? (
                            <>
                              <span className="text-amber-400 font-bold">{property.hotelDetails.stars}★</span>
                              <span className="text-gray-100 font-semibold tracking-wider">HÔTEL</span>
                            </>
                          ) : property.hotelDetails?.stars === "boutique" ? (
                            <span className="text-amber-300 font-semibold tracking-wider">HÔTEL BOUTIQUE</span>
                          ) : (
                            <span className="text-emerald-300 font-semibold tracking-wider">RÉSIDENCE HÔTELIÈRE</span>
                          )}
                        </span>
                      ) : (
                        <span className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-xl border uppercase backdrop-blur-md shadow-sm ${
                          isSale 
                            ? "bg-white/95 text-emerald-800 border-emerald-200/80" 
                            : "bg-white/95 text-blue-800 border-blue-200/80"
                        }`}>
                          {isSale ? "À Vendre" : "À Louer"}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="text-2xl font-bold text-white drop-shadow-md flex items-baseline gap-1">
                        $ {property.price?.toLocaleString()}
                        {isHotel && <span className="text-sm font-normal text-gray-300">/ nuitée</span>}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                      {property.title?.[lang] || property.title?.fr || property.title}
                    </h3>
                    
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <MapPin size={16} className="mr-1 text-green-600 shrink-0" />
                      <span className="truncate">{property.location}</span>
                    </div>
                    
                    {/* Features & Prestations */}
                    {isHotel ? (
                      <div className="border-t border-b border-gray-100 py-3 mb-6 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span className="font-medium text-gray-700">
                            Check-in: {property.hotelDetails?.checkInTime || "14h"}
                          </span>
                          <span className="font-medium text-gray-700">
                            Check-out: {property.hotelDetails?.checkOutTime || "12h"}
                          </span>
                        </div>
                        {property.hotelDetails?.amenities && property.hotelDetails.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {property.hotelDetails.amenities.includes("generator") && (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded text-[11px] font-medium border border-amber-200">
                                ⚡ Groupe 24/7
                              </span>
                            )}
                            {property.hotelDetails.amenities.includes("wifi") && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[11px] font-medium border border-blue-200">
                                📶 Wifi Fibre
                              </span>
                            )}
                            {property.hotelDetails.amenities.includes("pool") && (
                              <span className="px-2 py-0.5 bg-cyan-50 text-cyan-800 rounded text-[11px] font-medium border border-cyan-200">
                                🏊 Piscine
                              </span>
                            )}
                            {property.hotelDetails.amenities.includes("ac") && (
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded text-[11px] font-medium border border-indigo-200">
                                ❄️ Clim
                              </span>
                            )}
                            {property.hotelDetails.amenities.includes("breakfast") && (
                              <span className="px-2 py-0.5 bg-orange-50 text-orange-800 rounded text-[11px] font-medium border border-orange-200">
                                🍳 P. Déjeuner
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
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
                    )}
                    
                    {/* Actions */}
                    <div className="mt-auto flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setContactProperty(property);
                          setIsContactModalOpen(true);
                        }}
                        className={`flex-1 py-3 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm ${
                          isHotel 
                            ? "bg-gradient-to-r from-gray-900 via-neutral-900 to-black hover:bg-black border border-amber-500/30" 
                            : "bg-gray-900 hover:bg-gray-800"
                        }`}
                      >
                        {isHotel ? (
                          <>
                            <CalendarCheck size={16} className="text-amber-400" />
                            <span>Réserver une nuitée</span>
                          </>
                        ) : (
                          <>
                            <CalendarCheck size={16} />
                            <span>Prendre RDV / Visite</span>
                          </>
                        )}
                      </button>

                      <button 
                        onClick={() => {
                          openChatForProduct({
                            id: property.id,
                            supplierId: property.supplierId || "admin",
                            name: property.title?.[lang] || property.title?.fr || property.title,
                            type: isHotel ? "hotel" : "property"
                          });
                        }}
                        title={isHotel ? "Contacter l'hôtel" : "Discuter directement"}
                        className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors shrink-0"
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

      </main>

      {/* Contact / Reservation Modal */}
      <ImmoContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
        property={contactProperty} 
      />
    </div>
  );
}
