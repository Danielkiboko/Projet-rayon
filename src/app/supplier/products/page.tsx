"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Search, Package, Image as ImageIcon, AlertCircle } from "lucide-react";

const MOCK_PRODUCTS = [
  { id: "1", title: "Kit Starlink Standard", price: "280,000 FCFA", stock: 15, status: "En ligne", category: "Électronique" },
  { id: "2", title: "Caméra de sécurité PTZ", price: "45,000 FCFA", stock: 8, status: "En ligne", category: "Sécurité" },
  { id: "3", title: "Routeur 4G LTE", price: "25,000 FCFA", stock: 2, status: "Stock Faible", category: "Réseau" },
];

export default function SupplierProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to Firebase to add a new product
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mes Produits</h1>
          <p className="text-sm text-gray-400">Gérez votre catalogue d'articles et vos stocks.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Ajouter un produit</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Produits</p>
            <p className="text-2xl font-bold text-white mt-1">24</p>
          </div>
          <div className="p-3 bg-purple-400/10 text-purple-400 rounded-lg">
            <Package size={20} />
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Rupture / Stock faible</p>
            <p className="text-2xl font-bold text-white mt-1">3</p>
          </div>
          <div className="p-3 bg-orange-400/10 text-orange-400 rounded-lg">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white text-sm transition-all"
            />
          </div>
          <select className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="all">Toutes les catégories</option>
            <option value="electronique">Électronique</option>
            <option value="securite">Sécurité</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/20 text-gray-400">
              <tr>
                <th className="px-6 py-4">Nom du produit</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4">Prix</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PRODUCTS.map((product) => (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary-light">
                      <Package size={16} />
                    </div>
                    <span>{product.title}</span>
                  </td>
                  <td className="px-6 py-4">{product.category}</td>
                  <td className="px-6 py-4">{product.price}</td>
                  <td className="px-6 py-4">{product.stock} unités</td>
                  <td className="px-6 py-4">
                    <span className={product.status === "En ligne" ? "text-green-400" : "text-orange-400"}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary-light hover:text-white transition-colors">Modifier</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[#140b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-8"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#140b2e] z-10">
                <h2 className="text-xl font-semibold text-white">Ajouter un produit</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="p-6 space-y-6">
                
                {/* Image Upload Area */}
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-black/20">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white/5 rounded-full text-primary-light">
                      <ImageIcon size={32} />
                    </div>
                  </div>
                  <p className="text-white font-medium mb-1">Cliquez pour ajouter une image</p>
                  <p className="text-sm text-gray-400">PNG, JPG ou WEBP (Max 5MB)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Titre du produit</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: iPhone 15 Pro"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Catégorie</label>
                    <select required className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white">
                      <option value="">Sélectionner une catégorie</option>
                      <option value="electronique">Électronique</option>
                      <option value="vetements">Vêtements</option>
                      <option value="maison">Maison & Décoration</option>
                      <option value="beaute">Beauté</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Prix (FCFA)</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Quantité en stock</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Description</label>
                  <textarea
                    rows={4}
                    placeholder="Décrivez votre produit en détail..."
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                  ></textarea>
                </div>

                <div className="pt-4 flex justify-end space-x-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors"
                  >
                    Publier le produit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
