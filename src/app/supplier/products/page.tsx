"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Search, Package, Image as ImageIcon, AlertCircle, Send, Bot, User } from "lucide-react";
import imageCompression from 'browser-image-compression';

const MOCK_PRODUCTS = [
  { id: "1", title: "Kit Starlink Standard", price: "280,000 FC", stock: 15, status: "En ligne", category: "Électronique" },
  { id: "2", title: "Caméra de sécurité PTZ", price: "45,000 FC", stock: 8, status: "En ligne", category: "Sécurité" },
  { id: "3", title: "Routeur 4G LTE", price: "25,000 FC", stock: 2, status: "Stock Faible", category: "Réseau" },
];

export default function SupplierProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatMessages, setChatMessages] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [productTitle, setProductTitle] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productDesc, setProductDesc] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp"
      };
      
      const compressedFile = await imageCompression(file, options);
      setImageFile(compressedFile);
      
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        setImagePreview(base64data);
        
        setIsAiLoading(true);
        try {
           const res = await fetch('/api/ai/product-assistant', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               message: "Voici la photo de mon produit. Peux-tu l'analyser et m'aider à créer une bonne description ?",
               imageBase64: base64data,
               imageMimeType: compressedFile.type,
               history: []
             })
           });
           const data = await res.json();
           if (data.text) {
             let aiText = data.text;
             const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/);
             if (jsonMatch) {
               try {
                 const parsed = JSON.parse(jsonMatch[1]);
                 if (parsed.autoFill) {
                   if (parsed.autoFill.title) setProductTitle(parsed.autoFill.title);
                   if (parsed.autoFill.category) setProductCategory(parsed.autoFill.category);
                   if (parsed.autoFill.price) setProductPrice(parsed.autoFill.price);
                   if (parsed.autoFill.stock) setProductStock(parsed.autoFill.stock);
                   if (parsed.autoFill.description) setProductDesc(parsed.autoFill.description);
                 }
               } catch (e) {
                 console.error("Erreur parsing JSON de l'IA", e);
               }
               aiText = aiText.replace(/```json\n[\s\S]*?\n```/, '').trim();
             }
             
             if (aiText) {
               setChatMessages([
                 { role: 'user', text: 'Image ajoutée.' },
                 { role: 'model', text: aiText }
               ]);
             }
           }
        } catch(err) {
           console.error(err);
        } finally {
           setIsAiLoading(false);
        }
      };

    } catch (error) {
      console.error("Erreur de compression d'image:", error);
    }
  };

  const handleSendMessage = async () => {
     if (!chatInput.trim()) return;
     const newMessages = [...chatMessages, { role: 'user', text: chatInput }];
     setChatMessages(newMessages);
     setChatInput("");
     setIsAiLoading(true);
     
     try {
       const res = await fetch('/api/ai/product-assistant', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           message: chatInput,
           history: newMessages.slice(0, -1)
         })
       });
       const data = await res.json();
       if (data.text) {
         let aiText = data.text;
         const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/);
         if (jsonMatch) {
           try {
             const parsed = JSON.parse(jsonMatch[1]);
             if (parsed.autoFill) {
               if (parsed.autoFill.title) setProductTitle(parsed.autoFill.title);
               if (parsed.autoFill.category) setProductCategory(parsed.autoFill.category);
               if (parsed.autoFill.price) setProductPrice(parsed.autoFill.price);
               if (parsed.autoFill.stock) setProductStock(parsed.autoFill.stock);
               if (parsed.autoFill.description) setProductDesc(parsed.autoFill.description);
             }
           } catch (e) {
             console.error("Erreur parsing JSON de l'IA", e);
           }
           aiText = aiText.replace(/```json\n[\s\S]*?\n```/, '').trim();
         }
         if (aiText) {
           setChatMessages([...newMessages, { role: 'model', text: aiText }]);
         }
       }
     } catch (err) {
       console.error(err);
     } finally {
       setIsAiLoading(false);
     }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to Firebase to add a new product
    setIsModalOpen(false);
    setImageFile(null);
    setImagePreview(null);
    setChatMessages([]);
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
              className="w-full max-w-2xl bg-[#140b2e] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] my-4"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-[#140b2e]">
                <h2 className="text-xl font-semibold text-white">Ajouter un produit</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="p-4 space-y-5 overflow-y-auto scrollbar-hide">
                
                {/* Image Upload Area */}
                {!imagePreview ? (
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-black/20 relative"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-white/5 rounded-full text-primary-light">
                        <ImageIcon size={32} />
                      </div>
                    </div>
                    <p className="text-white font-medium mb-1">Cliquez pour ajouter une image</p>
                    <p className="text-sm text-gray-400">PNG, JPG ou WEBP (Max 5MB)</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden h-40 bg-black/40 flex items-center justify-center border border-white/10">
                       <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex justify-center">
                       <button 
                         type="button"
                         onClick={() => {
                           setImagePreview(null);
                           setImageFile(null);
                           setChatMessages([]);
                           if (fileInputRef.current) {
                             fileInputRef.current.value = "";
                           }
                         }}
                         className="flex items-center space-x-2 text-sm text-red-400 hover:text-red-300 bg-red-400/10 px-4 py-2 rounded-lg transition"
                       >
                         <X size={16} />
                         <span>Supprimer et changer d'image</span>
                       </button>
                    </div>

                    {/* AI Chat Assistant */}
                    <div className="bg-black/20 border border-primary/30 rounded-xl p-4 space-y-4">
                      <div className="flex items-center space-x-2 text-primary-light mb-2">
                        <Bot size={20} />
                        <h3 className="font-semibold text-sm">Assistant IA Rayon</h3>
                      </div>
                      
                      <div className="h-40 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                        {chatMessages.length === 0 && isAiLoading ? (
                          <div className="flex items-center space-x-2 text-gray-400 text-sm">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Bot size={16} /></motion.div>
                            <p>Analyse de la photo en cours...</p>
                          </div>
                        ) : (
                          chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                               <div className={`px-4 py-2 rounded-xl text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                                 {msg.text}
                               </div>
                            </div>
                          ))
                        )}
                        {isAiLoading && chatMessages.length > 0 && (
                          <div className="flex items-center space-x-2 text-gray-400 text-sm">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Bot size={16} /></motion.div>
                            <p>Écriture...</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
                        <input 
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if(e.key === 'Enter') {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Répondez à l'assistant..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                          disabled={isAiLoading}
                        />
                        <button 
                          type="button"
                          onClick={handleSendMessage}
                          disabled={isAiLoading || !chatInput.trim()}
                          className="p-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 transition"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Titre du produit</label>
                    <input
                      type="text"
                      required
                      value={productTitle}
                      onChange={(e) => setProductTitle(e.target.value)}
                      placeholder="Ex: iPhone 15 Pro"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Catégorie</label>
                    <select required value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white">
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
                    <label className="text-sm font-medium text-gray-300">Prix (FC)</label>
                    <input
                      type="number"
                      required
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-300">Quantité en stock</label>
                    <input
                      type="number"
                      required
                      value={productStock}
                      onChange={(e) => setProductStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Description</label>
                  <textarea
                    rows={4}
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
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
