"use client";

import { useState } from "react";
import { Save, Store, CreditCard, Bell } from "lucide-react";
import { motion } from "framer-motion";

export default function SupplierSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-sm text-gray-400">Gérez les informations de votre boutique et vos préférences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "profile" ? "bg-primary text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Store size={20} />
            <span className="font-medium">Profil de la boutique</span>
          </button>
          <button 
            onClick={() => setActiveTab("payment")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "payment" ? "bg-primary text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
          >
            <CreditCard size={20} />
            <span className="font-medium">Moyens de paiement</span>
          </button>
          <button 
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "notifications" ? "bg-primary text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Bell size={20} />
            <span className="font-medium">Notifications</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-4">Informations Générales</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nom de la boutique</label>
                    <input type="text" defaultValue="Rayon Connect" className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea rows={4} defaultValue="Votre boutique d'électronique et gadgets tech au meilleur prix." className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email de contact</label>
                    <input type="email" defaultValue="contact@rayonconnect.com" className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button className="flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors">
                    <Save size={18} />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "payment" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-4">Modes de reversement</h2>
                <p className="text-sm text-gray-400">Comment souhaitez-vous recevoir vos paiements ?</p>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 p-4 bg-black/20 border border-white/10 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <input type="radio" name="payment" className="text-primary focus:ring-primary h-4 w-4" defaultChecked />
                    <div>
                      <p className="text-white font-medium">Mobile Money (Wave / Orange)</p>
                      <p className="text-xs text-gray-400 mt-1">Paiement rapide sous 24h</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center space-x-3 p-4 bg-black/20 border border-white/10 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <input type="radio" name="payment" className="text-primary focus:ring-primary h-4 w-4" />
                    <div>
                      <p className="text-white font-medium">Virement bancaire</p>
                      <p className="text-xs text-gray-400 mt-1">Paiement sous 3 à 5 jours ouvrés</p>
                    </div>
                  </label>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Numéro de téléphone / IBAN</label>
                    <input type="text" placeholder="Entrez votre numéro ou IBAN" className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button className="flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg transition-colors">
                    <Save size={18} />
                    <span>Mettre à jour</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-4">Préférences d'alertes</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Nouvelle commande</p>
                      <p className="text-xs text-gray-400 mt-1">Recevoir un email à chaque nouvelle commande</p>
                    </div>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="toggle1" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked />
                      <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-6 rounded-full bg-primary cursor-pointer"></label>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Rupture de stock</p>
                      <p className="text-xs text-gray-400 mt-1">Être alerté quand le stock est inférieur à 5</p>
                    </div>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="toggle2" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked />
                      <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-6 rounded-full bg-primary cursor-pointer"></label>
                    </div>
                  </label>
                </div>

                {/* Note: we might need custom CSS for toggles or just use standard inputs. To keep it simple in Tailwind, we can just use a simple styling or a library component. Let's use standard checkboxes for now to avoid custom CSS issues */}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
