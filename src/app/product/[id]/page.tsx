"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ShoppingCart, ShieldCheck, Check, Truck, PackageOpen, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProductDetails({ params }: { params: { id: string } }) {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [quantity, setQuantity] = useState(1);
  const { addToCart, setIsCartOpen, cartTotalCount } = useCart();
  const [productData, setProductData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", params.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProductData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setProductData(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b061c] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400 font-medium tracking-wide">Chargement du produit...</p>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-[#0b061c] flex items-center justify-center text-white">
        <h2>Produit introuvable.</h2>
        <Link href="/" className="ml-4 text-primary-light hover:underline">Retour à l'accueil</Link>
      </div>
    );
  }

  // Calculate current price based on quantity (Bulk Pricing logic)
  let currentUnitPrice = productData.price;
  for (const tier of productData.bulkPricing) {
    const qtyRange = tier.qty.split("-");
    if (qtyRange.length === 2) {
      if (quantity >= parseInt(qtyRange[0]) && quantity <= parseInt(qtyRange[1])) {
        currentUnitPrice = tier.price;
      }
    } else if (tier.qty.endsWith("+")) {
      if (quantity >= parseInt(tier.qty)) {
        currentUnitPrice = tier.price;
      }
    }
  }

  const handleAddToCart = () => {
    // Add item N times or add one item with quantity N
    // Our cart context uses updateQuantity for multiples, but addToCart handles 1 at a time by default.
    // For simplicity, we can loop, or modify addToCart. Let's just loop for now, 
    // or better, since addToCart just adds 1 if it exists, let's call it N times.
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: params.id,
        title: productData.title[lang],
        price: `$ ${currentUnitPrice.toFixed(2).replace(".", ",")}`,
        image: productData.image,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b061c] text-white">
      {/* Header simple */}
      <header className="sticky top-0 z-50 bg-[#0b061c]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={20} className="mr-1" />
            <span className="text-sm font-medium">{lang === "fr" ? "Retour" : "Back"}</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-xs font-medium text-gray-300 hover:text-white transition-colors"
            >
              {lang.toUpperCase()}
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ShoppingCart size={20} />
              {cartTotalCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-primary rounded-full transform translate-x-1 -translate-y-1">
                  {cartTotalCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Colonne Image */}
          <div className="lg:w-1/2">
            <div className="sticky top-24">
              <div className="relative aspect-square md:aspect-video lg:aspect-square bg-[#140b2e] rounded-3xl overflow-hidden border border-white/10">
                <img 
                  src={productData.image} 
                  alt={productData.title[lang]}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-[#00e5ff] text-xs font-bold tracking-wider rounded border border-white/10 uppercase">
                    {productData.tag[lang]}
                  </span>
                </div>
              </div>
              
              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center">
                  <ShieldCheck size={24} className="text-green-400 mr-3" />
                  <div>
                    <h4 className="font-bold text-sm">Trade Assurance</h4>
                    <p className="text-xs text-gray-400">{lang === "fr" ? "Achat protégé" : "Protected purchase"}</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center">
                  <Truck size={24} className="text-blue-400 mr-3" />
                  <div>
                    <h4 className="font-bold text-sm">Livraison</h4>
                    <p className="text-xs text-gray-400">{lang === "fr" ? "Rapide & Suivie" : "Fast & Tracked"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne Infos & Achat */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="mb-2">
              <span className="text-primary-light text-sm font-bold tracking-wider uppercase">
                {productData.brand}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              {productData.title[lang]}
            </h1>
            
            <p className="text-gray-300 text-base mb-8 leading-relaxed">
              {productData.description[lang]}
            </p>

            {/* Features */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                {lang === "fr" ? "Points clés" : "Key features"}
              </h3>
              <ul className="space-y-3">
                {productData.features.map((feature: any, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <Check size={18} className="text-primary-light mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200 text-sm">{feature[lang]}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full h-[1px] bg-white/10 mb-8" />

            {/* Bulk Pricing Card */}
            <div className="bg-[#140b2e] border border-white/10 rounded-2xl p-6 mb-8">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                <PackageOpen size={18} className="mr-2 text-primary-light" />
                {lang === "fr" ? "Tarifs de gros (B2B)" : "Bulk Pricing (B2B)"}
              </h3>
              <div className="flex flex-wrap gap-3">
                {productData.bulkPricing.map((tier: any, idx: number) => {
                  // highlight current tier
                  const isActive = currentUnitPrice === tier.price;
                  return (
                    <div 
                      key={idx} 
                      className={`flex-1 min-w-[100px] p-3 rounded-xl border transition-colors ${
                        isActive ? "bg-primary/20 border-primary" : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="text-xs text-gray-400 mb-1">{tier.qty} {lang === "fr" ? "unités" : "units"}</div>
                      <div className={`text-lg font-bold ${isActive ? "text-primary-light" : "text-white"}`}>
                        $ {tier.price.toFixed(2).replace(".", ",")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add to Cart Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-auto">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                
                {/* Quantity selector */}
                <div className="flex items-center space-x-4 bg-black/40 rounded-xl p-2 border border-white/5 w-full sm:w-auto justify-between sm:justify-start">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:text-primary-light text-gray-400 transition-colors bg-white/5 rounded-lg"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="text-xl font-bold text-white w-8 text-center">
                    {quantity}
                  </span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:text-primary-light text-gray-400 transition-colors bg-white/5 rounded-lg"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Add to cart button */}
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 w-full py-4 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2"
                >
                  <ShoppingCart size={20} />
                  <span>
                    {lang === "fr" ? "Ajouter au panier" : "Add to cart"} 
                    <span className="ml-2 font-normal opacity-80">
                      ($ {(currentUnitPrice * quantity).toFixed(2).replace(".", ",")})
                    </span>
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
