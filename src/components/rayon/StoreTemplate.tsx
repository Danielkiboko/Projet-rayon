"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProductSkeleton } from "@/components/ui/Skeleton";
import { useCart } from "@/context/CartContext";
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
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), where("category", "==", category));
        const querySnapshot = await getDocs(q);
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (productsList.length === 0) {
          setProducts(dummyProducts);
        } else {
          setProducts(productsList);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts(dummyProducts);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [category, dummyProducts]);

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      title: product.title[lang] || product.title?.fr || product.title,
      price: `$ ${Number(product.price).toFixed(2).replace(".", ",")}`,
      image: product.image,
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
                handleAddToCart={handleAddToCart}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
