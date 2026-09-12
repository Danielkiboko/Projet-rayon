import Link from "next/link";
import { ShieldCheck, Star, AlertTriangle, ShoppingBag, MessageSquare, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { evaluateProductVerification } from "@/lib/productVerification";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: any;
  lang: "fr" | "en";
  t: any;
  category: "mode" | "connect" | "saveurs";
  index: number;
  handleChat: (product: any) => void;
  onBuy?: (product: any) => void;
}

export function ProductCard({ product, lang, t, category, index, handleChat, onBuy }: ProductCardProps) {
  const { addToCart } = useCart();
  const isMode = category === "mode";
  const isSaveurs = category === "saveurs";
  const verification = evaluateProductVerification(product);
  
  const bgClass = isMode 
    ? "bg-[#D4B08C] hover:bg-[#c49f7b] text-[#0F1D27] font-bold" 
    : isSaveurs
    ? "bg-[#FF6B35] hover:bg-[#e85d04] text-white font-bold"
    : "bg-[#00B5A5] hover:bg-[#009e90] text-white font-bold";

  const tagTextClass = isMode 
    ? "text-[#9C764D]" 
    : isSaveurs 
    ? "text-[#FF6B35]" 
    : "text-[#00B5A5]";

  const defaultTag = isMode ? "Mode" : isSaveurs ? "Saveurs" : "Connect";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 4) * 0.1, duration: 0.5 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group flex flex-col"
    >
      {/* Product Image */}
      <div className="relative h-64 overflow-hidden bg-gray-100">
        <img 
          src={product.image} 
          alt={product.title?.[lang] || product.title?.fr || "Produit"}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 bg-white/90 backdrop-blur-md ${tagTextClass} text-[10px] font-bold tracking-wider rounded border border-gray-200 shadow-sm uppercase`}>
            {product.tag?.[lang] || defaultTag}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 text-xs font-bold tracking-wider">{product.brand || "Marque"}</span>
          
          {/* Dynamic Verification Badge */}
          {verification.badgeType === "admin_official" ? (
            <span className="flex items-center bg-[#0F1D27]/10 text-[#0F1D27] px-2 py-0.5 rounded text-[10px] font-bold border border-[#0F1D27]/20" title="Produit officiel vendu et certifié par Rayons.net">
              <ShieldCheck size={12} className="mr-1 text-[#C7D300]" /> Certifié Rayons
            </span>
          ) : verification.badgeType === "community_verified" ? (
            <span className="flex items-center bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200" title={`Certifié par les votes clients (★ ${verification.averageRating.toFixed(1)}/5)`}>
              <ShieldCheck size={12} className="mr-1 text-emerald-600" /> Vérifié (★ {verification.averageRating.toFixed(1)})
            </span>
          ) : verification.badgeType === "low_rating" ? (
            <span className="flex items-center bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200" title="Cote basse : vigilance requise">
              <AlertTriangle size={11} className="mr-1 text-red-600" /> Non certifié (★ {verification.averageRating.toFixed(1)})
            </span>
          ) : (
            <span className="flex items-center text-gray-400 text-[10px] font-medium">
              {verification.ratingsCount > 0 ? (
                <>
                  <Star size={11} className="mr-1 text-amber-400 fill-amber-400" />
                  {verification.averageRating.toFixed(1)} ({verification.ratingsCount})
                </>
              ) : (
                "Nouveau"
              )}
            </span>
          )}
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
        <div className="flex flex-col gap-2 mt-auto">
          <div className="grid grid-cols-2 gap-2">
            {onBuy && (
              <button 
                type="button"
                onClick={() => onBuy(product)}
                className="py-2.5 bg-[#0F1D27] hover:bg-[#1a2e3b] text-[#C7D300] text-xs font-heading font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1 shadow-xs active:scale-98 cursor-pointer"
                title="Achat express direct"
              >
                <ShoppingBag size={13} />
                <span>Acheter direct</span>
              </button>
            )}

            <button 
              type="button"
              onClick={() => addToCart(product, 1)}
              className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-heading font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1 shadow-2xs active:scale-98 cursor-pointer"
              title="Ajouter au panier"
            >
              <ShoppingCart size={13} className="text-primary" />
              <span>Panier</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={() => handleChat(product)}
              className={`py-2 ${bgClass} text-xs font-semibold rounded-lg transition-colors text-center flex items-center justify-center space-x-1 cursor-pointer`}
            >
              <MessageSquare size={13} className="shrink-0" />
              <span>Discuter</span>
            </button>
            <Link 
              href={`/product/${product.id}`}
              className="py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors text-center flex items-center justify-center shadow-2xs"
            >
              {t.details || "Détails"}
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
