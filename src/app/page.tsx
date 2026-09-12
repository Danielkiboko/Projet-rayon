"use client";

import { useState, useEffect } from "react";
import { OptimizedImage } from "@/components/OptimizedImage";
import Link from "next/link";
import { Search, User, Menu, MapPin, ChevronRight, Star, Heart, TrendingUp, Home as HomeIcon, Wifi, Building, Globe, ArrowRight, Shirt, MessageCircle, Sparkles, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Footer } from "@/components/Footer";
import { useChat } from "@/context/ChatContext";
import { useCurrency, CurrencyCode } from "@/context/CurrencyContext";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, limit, where } from "firebase/firestore";
import { CurrencySelector } from "@/components/CurrencySelector";
import { RayonsLogo } from "@/components/brand/RayonsLogo";


export default function Home() {
  const { user, userData, signOut } = useAuth();
  const { toggleChat, openChatForProduct } = useChat();
  const { currency, setCurrency, formatPrice } = useCurrency();

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbProperties, setDbProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real products & properties from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodSnap, propSnap] = await Promise.all([
          getDocs(query(collection(db, "products"), limit(50))),
          getDocs(query(collection(db, "properties"), where("status", "==", "Disponible"), limit(4)))
        ]);

        const prods: any[] = [];
        prodSnap.forEach(doc => {
          const data = doc.data();
          if (data.status !== "REJECTED") {
            prods.push({ id: doc.id, ...data });
          }
        });
        setDbProducts(prods);

        const props: any[] = [];
        propSnap.forEach(doc => {
          props.push({ id: doc.id, ...doc.data() });
        });
        setDbProperties(props);
      } catch (error) {
        console.error("Erreur de chargement des données d'accueil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const allProducts = dbProducts;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans selection:bg-[#C7D300]/30 selection:text-[#0F1D27]">
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs transition-all border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 -ml-2 text-gray-600 hover:text-[#0F1D27] lg:hidden">
              <Menu size={24} />
            </button>
            <RayonsLogo size="md" href="/" />
          </div>

          <nav className="hidden lg:flex items-center gap-1 bg-gray-50/80 p-1 rounded-full border border-gray-100">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[#0F1D27] bg-white shadow-xs px-4 py-1.5 rounded-full">
              <HomeIcon size={16} />
              Accueil
            </Link>
            <Link href="/rayon/connect" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#00B5A5] hover:bg-white/60 px-4 py-1.5 rounded-full transition-colors">
              <Wifi size={16} className="text-[#00B5A5]" />
              Rayons Connect
            </Link>
            <Link href="/rayon/immo" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#4C6EF5] hover:bg-white/60 px-4 py-1.5 rounded-full transition-colors">
              <Building size={16} className="text-[#4C6EF5]" />
              Rayons Immo
            </Link>
            <Link href="/rayon/mode" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#D4B08C] hover:bg-white/60 px-4 py-1.5 rounded-full transition-colors">
              <Shirt size={16} className="text-[#D4B08C]" />
              Rayons Mode
            </Link>
            <Link href="/rayon/saveurs" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#FF6B35] hover:bg-white/60 px-4 py-1.5 rounded-full transition-colors">
              <UtensilsCrossed size={16} className="text-[#FF6B35]" />
              Rayons Saveurs
            </Link>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Currency Selector */}
            <div className="hidden sm:block">
              <CurrencySelector />
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-bold text-[#0F1D27] hover:bg-gray-200 bg-gray-100 px-3.5 py-2 rounded-full transition-colors">
                  <User size={16} />
                  <span className="hidden sm:block">{userData?.displayName || user.displayName || "Mon espace"}</span>
                </Link>
                <button onClick={() => signOut()} className="hidden sm:block text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-2 rounded-full transition-colors">
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 text-sm font-bold text-[#0F1D27] hover:bg-gray-200 bg-gray-100 px-3.5 py-2 rounded-full transition-colors">
                <User size={16} />
                <span className="hidden sm:block">Se connecter</span>
              </Link>
            )}
            <button onClick={toggleChat} className="relative p-2.5 text-[#0F1D27] hover:bg-gray-100 rounded-full transition-colors group" title="Messagerie & Support">
              <MessageCircle size={22} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-12">
        
        {/* Hero Banner avec Charte Graphique Officielle */}
        <section className="relative w-full min-h-[420px] sm:min-h-[480px] rounded-3xl overflow-hidden shadow-xl mt-2 bg-[#0F1D27] border border-white/10 flex items-center">
          {/* Arrière-plan stylisé */}
          <OptimizedImage 
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000" 
            alt="Rayons Hero" 
            fill
            priority
            className="absolute inset-0 object-cover opacity-35 mix-blend-luminosity"
            sizes="100vw"
          />
          {/* Gradient Bleu Rayons */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F1D27] via-[#0F1D27]/85 to-transparent"></div>
          
          <div className="relative z-10 p-8 sm:p-12 md:p-16 flex flex-col justify-center max-w-2xl">
            {/* Tag Brand */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C7D300]/15 border border-[#C7D300]/30 w-max mb-5">
              <Sparkles size={14} className="text-[#C7D300]" />
              <span className="text-xs font-heading font-bold text-[#C7D300] tracking-wider uppercase">
                Plateforme Officielle Rayons.net
              </span>
            </div>

            {/* Titre Signature de la Charte */}
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-5 tracking-tight">
              Tout ce dont vous avez besoin, <span className="text-[#C7D300]">en un seul endroit.</span>
            </h1>
            
            <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-8 max-w-xl leading-relaxed font-sans">
              Rayons réunit quatre univers d'excellence complémentaires : technologies et objets connectés, immobilier et hôtellerie de prestige, prêt-à-porter de créateurs, et gastronomie avec ustensiles culinaires.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => document.getElementById('rayons')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-[#C7D300] text-[#0F1D27] font-heading font-bold px-7 py-3.5 rounded-xl flex items-center gap-2 hover:bg-[#b5c000] transition-all shadow-lg shadow-[#C7D300]/20 active:scale-95 cursor-pointer text-sm sm:text-base"
              >
                Explorer nos rayons
                <ArrowRight size={18} />
              </button>
              
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-xl text-white font-medium text-sm sm:text-base bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all"
              >
                Espace Partenaires & Fournisseurs
              </Link>
            </div>
          </div>
        </section>

        {/* Nos Rayons - Les 4 Activités de la Charte */}
        <section id="rayons" className="mt-14 scroll-mt-20">
          <div className="mb-8 px-1 flex flex-col md:flex-row md:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-heading font-bold text-gray-400 uppercase tracking-widest">
                Une identité unifiée, quatre expertises
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F1D27] tracking-tight mt-1">
                Les Rayons Officiels
              </h2>
            </div>
            <p className="text-gray-500 text-sm max-w-md">
              Chaque rayon possède son univers dédié, tout en partageant la rapidité, le paiement sécurisé et la fiabilité du réseau Rayons.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Rayon Connect */}
            <Link 
              href="/rayon/connect" 
              className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:border-[#00B5A5]/60 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between min-h-[200px] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00B5A5]/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#00B5A5]/10 text-[#00B5A5] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#00B5A5] group-hover:text-white transition-all shadow-xs">
                  <Wifi size={26} />
                </div>
                <div className="inline-block text-[11px] font-heading font-bold uppercase tracking-wider text-[#00B5A5] bg-[#00B5A5]/10 px-2.5 py-0.5 rounded-md mb-2">
                  Innovation & Tech
                </div>
                <h3 className="text-xl font-heading font-extrabold text-[#0F1D27] mb-1.5 flex items-center">
                  Rayons Connect
                  <ChevronRight size={18} className="ml-1 text-[#00B5A5] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Technologies et objets connectés (Starlink, smartphones, audio, domotique et équipements pro).
                </p>
              </div>
            </Link>

            {/* Rayon Immo & Hôtels */}
            <Link 
              href="/rayon/immo" 
              className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:border-[#4C6EF5]/60 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between min-h-[200px] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4C6EF5]/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#4C6EF5]/10 text-[#4C6EF5] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#4C6EF5] group-hover:text-white transition-all shadow-xs">
                  <Building size={26} />
                </div>
                <div className="inline-block text-[11px] font-heading font-bold uppercase tracking-wider text-[#4C6EF5] bg-[#4C6EF5]/10 px-2.5 py-0.5 rounded-md mb-2">
                  Immobilier & Hôtellerie
                </div>
                <h3 className="text-xl font-heading font-extrabold text-[#0F1D27] mb-1.5 flex items-center">
                  Rayons Immo & Hôtels
                  <ChevronRight size={18} className="ml-1 text-[#4C6EF5] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Immobilier en ligne de qualité (villas, appartements, bureaux) et réservations d'hôtels de prestige.
                </p>
              </div>
            </Link>

            {/* Rayon Mode */}
            <Link 
              href="/rayon/mode" 
              className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:border-[#D4B08C]/80 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between min-h-[200px] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4B08C]/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#D4B08C]/20 text-[#9C764D] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#D4B08C] group-hover:text-white transition-all shadow-xs">
                  <Shirt size={26} />
                </div>
                <div className="inline-block text-[11px] font-heading font-bold uppercase tracking-wider text-[#9C764D] bg-[#D4B08C]/20 px-2.5 py-0.5 rounded-md mb-2">
                  Mode & Lifestyle
                </div>
                <h3 className="text-xl font-heading font-extrabold text-[#0F1D27] mb-1.5 flex items-center">
                  Rayons Mode
                  <ChevronRight size={18} className="ml-1 text-[#D4B08C] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Prêt-à-porter haut de gamme, maroquinerie, accessoires et collections exclusives.
                </p>
              </div>
            </Link>

            {/* Rayon Saveurs */}
            <Link 
              href="/rayon/saveurs" 
              className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:border-[#FF6B35]/70 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between min-h-[200px] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B35]/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#FF6B35]/10 text-[#FF6B35] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#FF6B35] group-hover:text-white transition-all shadow-xs">
                  <UtensilsCrossed size={26} />
                </div>
                <div className="inline-block text-[11px] font-heading font-bold uppercase tracking-wider text-[#FF6B35] bg-[#FF6B35]/10 px-2.5 py-0.5 rounded-md mb-2">
                  Gastronomie & Cuisine
                </div>
                <h3 className="text-xl font-heading font-extrabold text-[#0F1D27] mb-1.5 flex items-center">
                  Rayons Saveurs
                  <ChevronRight size={18} className="ml-1 text-[#FF6B35] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Restaurants, plats de chefs en livraison rapide et vente d&apos;ustensiles & équipements de cuisine.
                </p>
              </div>
            </Link>

          </div>
        </section>

        {/* Product Sections by Rayon */}
        {(() => {
          const renderProductGrid = (title: string, subtitle: string, categoryFilter: string, link: string) => {
            const isImmoSection = categoryFilter.toLowerCase() === "immo";
            const isConnectSection = categoryFilter.toLowerCase() === "connect";
            const isModeSection = categoryFilter.toLowerCase() === "mode";
            const isSaveursSection = categoryFilter.toLowerCase() === "saveurs";

            const badgeStyles = isModeSection 
              ? "bg-[#D4B08C]/20 text-[#8C6438] border-[#D4B08C]/35" 
              : isConnectSection 
              ? "bg-[#00B5A5]/20 text-[#007D72] border-[#00B5A5]/35"
              : isSaveursSection
              ? "bg-[#FF6B35]/20 text-[#E0531D] border-[#FF6B35]/35"
              : "bg-[#4C6EF5]/20 text-[#3B5BDB] border-[#4C6EF5]/35";

            const items = isImmoSection
              ? dbProperties.slice(0, 4)
              : allProducts.filter(p => {
                  const cat = (p.category || "").toLowerCase();
                  if (isSaveursSection) {
                    return cat.includes("saveurs") || cat.includes("resto") || cat.includes("cuisine") || cat.includes("repas") || cat.includes("food");
                  }
                  return cat.includes(categoryFilter.toLowerCase());
                }).slice(0, 4);
            
            return (
              <section className="mt-12">
                <div className="flex flex-col mb-5 px-1 gap-2">
                  <div>
                    <span className={`text-[11px] font-heading font-extrabold px-3 py-1 rounded-md uppercase tracking-wider border ${badgeStyles}`}>
                      {subtitle}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F1D27] tracking-tight">
                      {title}
                    </h2>
                    <Link href={link} className="text-sm font-bold text-gray-500 hover:text-[#0F1D27] flex items-center gap-1 transition-colors">
                      Voir le rayon <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
                
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="animate-pulse bg-white rounded-2xl h-64 border border-gray-100"></div>
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <p className="text-gray-500 font-medium">Bientôt de nouveaux articles dans ce rayon.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {items.map((item) => {
                      const itemName = item.title?.fr || item.title || item.name || "Article";
                      const itemImage = item.image || item.images?.[0] || "https://images.unsplash.com/photo-1522071820081-009f0129c71c";
                      const itemCategory = isImmoSection 
                        ? (item.immoBranch === "hotel" ? "Hôtel / Nuitée" : item.typeTransaction || "Immobilier")
                        : (item.category || "Produit");

                      return (
                        <div key={item.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                          <div className="relative aspect-square overflow-hidden bg-gray-100">
                            <OptimizedImage
                              src={itemImage}
                              alt={itemName}
                              fill
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                            />
                            <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-all active:scale-90">
                              <Heart size={16} />
                            </button>
                          </div>
                          <div className="p-4 flex flex-col flex-1">
                            <p className="text-xs font-bold text-gray-500 mb-1 line-clamp-1">{itemCategory}</p>
                            <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                              {itemName}
                            </h3>
                            <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                              <span className="font-bold text-base sm:text-lg text-gray-900">
                                {formatPrice(item.price)}
                                {isImmoSection && item.immoBranch === "hotel" && <span className="text-xs text-gray-500 font-normal"> / nuitée</span>}
                                {isImmoSection && item.typeTransaction?.toLowerCase().includes("locat") && <span className="text-xs text-gray-500 font-normal"> / mois</span>}
                              </span>
                              <button 
                                onClick={() => openChatForProduct({
                                   id: item.id,
                                   supplierId: item.supplierId || "admin",
                                   name: itemName
                                 })}
                                className="w-8 h-8 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center hover:bg-gray-900 hover:text-white transition-colors active:scale-90 shadow-sm"
                                title="Poser une question"
                              >
                                <MessageCircle size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          };

          return (
            <>
              {renderProductGrid("Populaire en Rayon Mode", "Mode & Accessoires", "Mode", "/rayon/mode")}
              {renderProductGrid("Nouveautés Rayon Connect", "Tech & Services", "Connect", "/rayon/connect")}
              {renderProductGrid("Délices & Cuisine en Rayon Saveurs", "Gastronomie & Cuisine", "Saveurs", "/rayon/saveurs")}
              {renderProductGrid("Exclusivités Rayon Immo & Hôtels", "Immobilier & Hôtellerie", "Immo", "/rayon/immo")}
            </>
          );
        })()}

      </main>

      <Footer />
    </div>
  );
}
