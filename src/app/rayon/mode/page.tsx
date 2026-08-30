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
    mode: "Rayons Mode",
    login: "Se connecter",
    title: "La Nouvelle Collection",
    subtitle: "Découvrez notre sélection de vêtements, chaussures et accessoires tendance.",
    add: "Ajouter au panier",
    details: "Détails",
  },
  en: {
    home: "Home",
    connect: "Connect Store",
    immo: "Immo Store",
    mode: "Fashion Store",
    login: "Login",
    title: "New Collection",
    subtitle: "Discover our selection of trendy clothes, shoes and accessories.",
    add: "Add to cart",
    details: "Details",
  }
};

const DUMMY_PRODUCTS = [
  {
    id: "dummy-mode-1",
    title: { fr: "Veste en Cuir Biker", en: "Biker Leather Jacket" },
    description: { fr: "Veste en cuir véritable avec détails zippés. Parfaite pour un look rock et urbain.", en: "Genuine leather jacket with zip details. Perfect for a rock and urban look." },
    price: 129.99,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800",
    brand: "Urban Style",
    tag: { fr: "Nouveau", en: "New" }
  },
  {
    id: "dummy-mode-2",
    title: { fr: "Robe d'Été Fleurie", en: "Floral Summer Dress" },
    description: { fr: "Robe légère et fluide avec imprimé floral. Idéale pour les journées ensoleillées.", en: "Light and flowing dress with floral print. Ideal for sunny days." },
    price: 45.00,
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800",
    brand: "Chic Bohème",
    tag: { fr: "Tendance", en: "Trendy" }
  },
  {
    id: "dummy-mode-3",
    title: { fr: "Sneakers Classiques", en: "Classic Sneakers" },
    description: { fr: "Baskets blanches indémodables, confortables pour tous les jours.", en: "Timeless white sneakers, comfortable for everyday wear." },
    price: 89.90,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800",
    brand: "RunFoot",
    tag: { fr: "Basique", en: "Basic" }
  },
  {
    id: "dummy-mode-4",
    title: { fr: "Chemise en Lin", en: "Linen Shirt" },
    description: { fr: "Chemise légère 100% lin, coupe ajustée, couleur beige naturel.", en: "Lightweight 100% linen shirt, slim fit, natural beige color." },
    price: 55.00,
    image: "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?auto=format&fit=crop&q=80&w=800",
    brand: "Elegance",
    tag: { fr: "Premium", en: "Premium" }
  },
  {
    id: "dummy-mode-5",
    title: { fr: "Jeans Denim Brut", en: "Raw Denim Jeans" },
    description: { fr: "Jeans coupe droite en toile denim épaisse. Résistant et stylé.", en: "Straight-cut jeans in thick denim canvas. Durable and stylish." },
    price: 69.99,
    image: "https://images.unsplash.com/photo-1542272604-780c8d52a5ce?auto=format&fit=crop&q=80&w=800",
    brand: "Denim Co.",
    tag: { fr: "Populaire", en: "Popular" }
  },
  {
    id: "dummy-mode-6",
    title: { fr: "Sac à Main Élégant", en: "Elegant Handbag" },
    description: { fr: "Sac à main en simili cuir avec finitions dorées. Spacieux et pratique.", en: "Faux leather handbag with gold finishes. Spacious and practical." },
    price: 79.50,
    image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=800",
    brand: "LuxeAccess",
    tag: { fr: "Accessoire", en: "Accessory" }
  },
  {
    id: "dummy-mode-7",
    title: { fr: "T-Shirt Oversize", en: "Oversized T-Shirt" },
    description: { fr: "T-shirt en coton bio coupe oversize. Impression minimaliste.", en: "Organic cotton t-shirt, oversized fit. Minimalist print." },
    price: 25.00,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800",
    brand: "StreetWear",
    tag: { fr: "Essentiel", en: "Essential" }
  },
  {
    id: "dummy-mode-8",
    title: { fr: "Montre Minimaliste", en: "Minimalist Watch" },
    description: { fr: "Montre bracelet en maille milanaise noire, cadran épuré.", en: "Watch with black Milanese mesh strap, sleek dial." },
    price: 110.00,
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=800",
    brand: "TimePiece",
    tag: { fr: "Élégant", en: "Elegant" }
  },
  {
    id: "dummy-mode-9",
    title: { fr: "Manteau d'Hiver", en: "Winter Coat" },
    description: { fr: "Manteau long en laine mélangée. Parfait pour affronter le froid avec style.", en: "Long wool-blend coat. Perfect to face the cold in style." },
    price: 189.00,
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&q=80&w=800",
    brand: "Nordic Wear",
    tag: { fr: "Hiver", en: "Winter" }
  },
  {
    id: "dummy-mode-10",
    title: { fr: "Lunettes de Soleil Vintage", en: "Vintage Sunglasses" },
    description: { fr: "Lunettes de soleil polarisées style rétro avec monture écaille de tortue.", en: "Retro style polarized sunglasses with tortoiseshell frame." },
    price: 49.90,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800",
    brand: "SunVision",
    tag: { fr: "Vintage", en: "Vintage" }
  }
];

export default function ModePage() {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = DICT[lang];
  const { addToCart, setIsCartOpen, cartTotalCount } = useCart();
  const { user, loading, signOut } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), where("category", "in", ["Mode", "Vêtements"]));
        const querySnapshot = await getDocs(q);
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Use dummy products if no real products are found
        if (productsList.length === 0) {
          setProducts(DUMMY_PRODUCTS);
        } else {
          setProducts(productsList);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        // Fallback to dummy on error
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
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-sm">
              <Shirt size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-wider">
              Rayons<span className="text-purple-600 text-sm">.MODE</span>
            </span>
          </div>
          
          {/* Main Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link href="/" className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <HomeIcon size={16} className="mr-2" /> {t.home}
            </Link>
            <Link href="/rayon/mode" className="flex items-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 transition-colors">
              <Shirt size={16} className="mr-2 text-purple-600" /> {t.mode}
            </Link>
            <Link href="/rayon/connect" className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
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
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-purple-600 rounded-full transform translate-x-1 -translate-y-1">
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
        
        {/* Mode Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-12 shadow-xl h-[300px]">
          <img 
            src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=2000" 
            alt="Fashion" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-900/60 to-transparent"></div>
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 w-full md:w-2/3">
            <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold tracking-wider rounded-full mb-4 border border-white/30 uppercase w-max">
              {t.mode}
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
              className="text-lg text-purple-50 max-w-lg hidden md:block"
            >
              {t.subtitle}
            </motion.p>
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
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (idx % 4) * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group flex flex-col"
              >
                {/* Product Image */}
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <img 
                    src={product.image} 
                    alt={product.title?.[lang] || product.title?.fr || "Produit"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-purple-600 text-[10px] font-bold tracking-wider rounded border border-gray-200 shadow-sm uppercase">
                      {product.tag?.[lang] || "Mode"}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-500 text-xs font-bold tracking-wider">{product.brand || "Marque"}</span>
                    <span className="flex items-center text-green-600 text-[10px] font-bold">
                      <ShieldCheck size={12} className="mr-1" /> Verified
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                    {product.title?.[lang] || product.title?.fr || product.title}
                  </h3>
                  
                  <p className="text-gray-500 text-sm mb-4 flex-1 line-clamp-2">
                    {product.description?.[lang] || product.description?.fr || product.description}
                  </p>
                  
                  <div className="text-2xl font-bold text-gray-900 mb-4">
                    $ {Number(product.price).toFixed(2).replace(".", ",")}
                  </div>
                
                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors text-center"
                    >
                      {t.add}
                    </button>
                    <Link 
                      href={`/product/${product.id}`}
                      className="py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors text-center flex items-center justify-center shadow-sm"
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
