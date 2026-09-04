import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: any;
  lang: "fr" | "en";
  t: any;
  category: "mode" | "connect";
  index: number;
  handleAddToCart: (product: any) => void;
}

export function ProductCard({ product, lang, t, category, index, handleAddToCart }: ProductCardProps) {
  const isMode = category === "mode";
  
  const bgClass = isMode ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700";
  const tagTextClass = isMode ? "text-purple-600" : "text-blue-600";

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
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 bg-white/90 backdrop-blur-md ${tagTextClass} text-[10px] font-bold tracking-wider rounded border border-gray-200 shadow-sm uppercase`}>
            {product.tag?.[lang] || (isMode ? "Mode" : "Connect")}
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
            className={`py-2 ${bgClass} text-white text-sm font-semibold rounded-lg transition-colors text-center`}
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
  );
}
