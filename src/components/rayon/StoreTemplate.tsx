"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProductSkeleton } from "@/components/ui/Skeleton";
import { useChat } from "@/context/ChatContext";
import { RayonNavbar } from "./RayonNavbar";
import { ProductCard } from "./ProductCard";

interface StoreTemplateProps {
  category: "mode" | "connect";
  heroImage: string;
  dummyProducts: any[];
  dict: any;
}

export function StoreTemplate({ category, heroImage, dummyProducts, dict }: StoreTemplateProps) {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = dict[lang];
  const { openChatForProduct } = useChat();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const productsRef = collection(db, "products");
    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const allProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const isTargetRayon = (p: any) => {
          if (p.status === "REJECTED") return false;

          const cat = (p.category || "").toString().toLowerCase().trim();
          const ray = (p.rayon || "").toString().toLowerCase().trim();

          if (category === "mode") {
            return (
              cat === "mode" ||
              ray === "mode" ||
              cat.includes("mode") ||
              cat.includes("vetement") ||
              cat.includes("vêtement") ||
              cat.includes("habit") ||
              cat.includes("chaussure") ||
              cat.includes("accessoire") ||
              cat.includes("pantalon") ||
              cat.includes("robe") ||
              cat.includes("chemise") ||
              cat.includes("costume")
            );
          } else if (category === "connect") {
            return (
              cat === "connect" ||
              ray === "connect" ||
              cat.includes("connect") ||
              cat.includes("electr") ||
              cat.includes("électr") ||
              cat.includes("tech") ||
              cat.includes("telecom") ||
              cat.includes("télécom") ||
              cat.includes("starlink") ||
              cat.includes("wifi") ||
              cat.includes("informatique") ||
              cat.includes("ordi") ||
              cat.includes("phone")
            );
          }
          return cat === category || ray === category;
        };

        const matchedProducts = allProducts.filter(isTargetRayon);

        if (matchedProducts.length === 0) {
          setProducts(dummyProducts);
        } else {
          setProducts(matchedProducts);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to products:", error);
        setProducts(dummyProducts);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [category, dummyProducts]);

  const handleChat = (product: any) => {
    openChatForProduct({
      id: product.id,
      supplierId: product.supplierId || "admin",
      name: product.title[lang] || product.title?.fr || product.title
    });
  };

  const isMode = category === "mode";
  const bgGradient = isMode 
    ? "from-purple-900/90 via-purple-900/60" 
    : "from-blue-900/90 via-blue-900/60";
  const heroTextColor = isMode ? "text-purple-50" : "text-blue-50";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <RayonNavbar 
        category={category}
        lang={lang}
        setLang={setLang}
        t={t}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden mb-12 shadow-xl h-[300px]">
          <img 
            src={heroImage} 
            alt={t[category] || category} 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${bgGradient} to-transparent`}></div>
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 w-full md:w-2/3">
            <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold tracking-wider rounded-full mb-4 border border-white/30 uppercase w-max">
              {t[category] || category}
            </span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4"
            >
              {t.title}
            </motion.h1>
            {t.subtitle && (
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`text-lg ${heroTextColor} max-w-lg hidden md:block`}
              >
                {t.subtitle}
              </motion.p>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <>
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
            </>
          ) : (
            products.map((product, idx) => (
              <ProductCard 
                key={product.id}
                product={product}
                index={idx}
                category={category}
                lang={lang}
                t={t}
                handleChat={handleChat}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
