"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, UserPlus, Shield, Check } from "lucide-react";
import { themeConfig } from "@/lib/themeConfig";
import { getSupplierType } from "@/lib/permissions";
import toast from "react-hot-toast";

export default function SupplierTeamPage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    notificationMethod: "email" as "email" | "sms",
    phoneNumber: "",
  });

  const [permissions, setPermissions] = useState<string[]>([]);

  if (!userData) return null;

  const service = getSupplierType(userData);
  const theme = themeConfig[service] || themeConfig["default"];
  // Filter out Dashboard and Settings/Billing to only show assignable permissions
  const assignableMenus = theme.menu.filter(
    (item) => !["/supplier", "/supplier/billing", "/supplier/settings"].includes(item.href)
  );

  const togglePermission = (href: string) => {
    setPermissions((prev) =>
      prev.includes(href) ? prev.filter((p) => p !== href) : [...prev, href]
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.name,
          roleToCreate: "SUB_SUPPLIER",
          extraData: {
            parentSupplierId: user?.uid,
            permissions,
            serviceAttached: service, // inherit service
          },
          notificationMethod: formData.notificationMethod,
          phoneNumber: formData.notificationMethod === 'sms' ? formData.phoneNumber : undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création");

      if (formData.notificationMethod === 'email') {
        const { getAuth, sendPasswordResetEmail } = await import("firebase/auth");
        const auth = getAuth();
        await sendPasswordResetEmail(auth, formData.email).catch(console.error);
      }

      toast.success(`Collaborateur créé avec succès. ${formData.notificationMethod === 'email' ? "Un e-mail d'activation a été envoyé." : "Un SMS avec le mot de passe a été envoyé."}`);
      setFormData({ name: "", email: "", password: "", notificationMethod: "email", phoneNumber: "" });
      setPermissions([]);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserPlus className="text-blue-500" />
          Équipe et Collaborateurs
        </h1>
        <p className="text-gray-400 mt-1">
          Gérez les accès de vos employés à votre tableau de bord.
        </p>
      </div>

      <div className="bg-[#111] border border-gray-800 p-6 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-6">Ajouter un collaborateur</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nom complet</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Ex: Jean Dupont"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="jean@exemple.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Mot de passe provisoire</label>
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-800">
            <h3 className="text-md font-semibold text-white">Notification au collaborateur</h3>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 text-white cursor-pointer">
                <input 
                  type="radio" 
                  name="notificationMethod" 
                  value="email" 
                  checked={formData.notificationMethod === 'email'} 
                  onChange={(e) => setFormData({ ...formData, notificationMethod: 'email' })}
                  className="text-blue-500 focus:ring-blue-500 bg-black border-gray-800"
                />
                <span>Email</span>
              </label>
              <label className="flex items-center space-x-2 text-white cursor-pointer">
                <input 
                  type="radio" 
                  name="notificationMethod" 
                  value="sms" 
                  checked={formData.notificationMethod === 'sms'} 
                  onChange={(e) => setFormData({ ...formData, notificationMethod: 'sms' })}
                  className="text-blue-500 focus:ring-blue-500 bg-black border-gray-800"
                />
                <span>SMS</span>
              </label>
            </div>

            {formData.notificationMethod === 'sms' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Numéro de téléphone</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="+243..."
                  className="w-full md:w-1/2 bg-black border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
              <Shield size={18} className="text-amber-500" />
              Permissions (Modules accessibles)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {assignableMenus.map((item) => {
                const isSelected = permissions.includes(item.href);
                return (
                  <div
                    key={item.href}
                    onClick={() => togglePermission(item.href)}
                    className={`cursor-pointer p-4 rounded-xl border flex items-center gap-3 transition-colors ${
                      isSelected 
                        ? "border-blue-500 bg-blue-500/10 text-white" 
                        : "border-gray-800 bg-black text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? "border-blue-500 bg-blue-500" : "border-gray-600"}`}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                    <item.icon size={20} />
                    <span className="font-medium text-sm">{item.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-800">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Créer le compte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
