"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingBag, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeFromCart, cartTotalCount } = useCart();

  // Helper to parse price (e.g. "$ 581,67" -> 581.67) for calculating total
  const getNumericPrice = (priceStr: string) => {
    const cleaned = priceStr.replace(/[^0-9,]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const totalPrice = items.reduce((total, item) => {
    return total + getNumericPrice(item.price) * item.quantity;
  }, 0);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-gray-900">
                <ShoppingBag size={24} className="text-primary" />
                <h2 className="text-xl font-bold">Votre Panier</h2>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
                  {cartTotalCount}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <ShoppingBag size={64} className="opacity-20" />
                  <p>Votre panier est vide</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-primary hover:text-primary-dark transition-colors font-medium"
                  >
                    Continuer vos achats
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-primary font-bold mt-1">{item.price}</p>
                      
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:text-primary text-gray-500 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold text-gray-900 w-4 text-center">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:text-primary text-gray-500 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-500/70 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 font-medium">Sous-total</span>
                  <span className="text-xl font-bold text-gray-900">
                    $ {totalPrice.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    window.location.href = "/checkout";
                  }}
                  className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-sm"
                >
                  <span>Passer la commande</span>
                  <ChevronRight size={18} />
                </button>
                <p className="text-center text-xs text-gray-500 mt-4">
                  Les frais de transport seront calculés à l'étape suivante.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
