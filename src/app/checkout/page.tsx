"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, ShieldCheck, MapPin } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useCurrency } from "@/context/CurrencyContext";

export default function CheckoutPage() {
  const { items: cartItems, cartTotalCount, clearCart } = useCart();
  const { user, loading } = useAuth();
  const { formatPrice } = useCurrency();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/register?redirect=/checkout");
    }
  }, [user, loading, router]);

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Calculate totals
  const itemsTotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  const DISPATCH_FEE = 3; // 3 USD fee

  const handleGetLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          if (!address) {
             setAddress("Position GPS enregistrée (Le livreur sera guidé jusqu'à vous)");
          }
          setIsLocating(false);
        },
        (error) => {
          console.error(error);
          setError("Impossible de récupérer votre position. Veuillez vérifier vos permissions GPS.");
          setIsLocating(false);
        }
      );
    } else {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      setIsLocating(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Vous devez être connecté pour passer commande.");
      return;
    }

    if (cartTotalCount === 0) {
      setError("Votre panier est vide.");
      return;
    }

    if (!location && !address) {
      setError("Veuillez fournir une adresse ou votre position GPS.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Simulate Payment Gateway delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 1. Create order in Firestore
      const orderRef = await addDoc(collection(db, "orders"), {
        clientId: user?.uid || "",
        supplierId: cartItems[0]?.supplierId || "admin",
        clientPhone: phone,
        clientAddress: address,
        location: location || null,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.title,
          quantity: item.quantity,
          price: parseFloat(item.price),
          supplierId: item.supplierId || "admin"
        })),
        itemsTotal: itemsTotal,
        feePaid: DISPATCH_FEE,
        remainingBalance: itemsTotal, // The rest of the items price
        status: "EN_ATTENTE", // Waiting for driver to accept
        createdAt: serverTimestamp(),
      });

      // 2. Clear cart & show success
      clearCart();
      setSuccess(true);

    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue lors du paiement.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Commande Confirmée !</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          Vos frais de déplacement de <strong>3 USD</strong> ont été réglés. Un livreur va prendre en charge votre commande et se diriger vers votre position.
        </p>
        <Link href="/" className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center">
          <Link href="/" className="text-gray-500 hover:text-gray-900 mr-4 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Validation de la commande</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Form */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Vos informations</h2>
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Téléphone (SMS)</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 971501234567"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Vous recevrez le lien de paiement final sur ce numéro.</p>
            </div>

            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-bold text-gray-700">Adresse de livraison</label>
                <button 
                  type="button" 
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="text-xs font-bold text-blue-600 flex items-center hover:text-blue-800"
                >
                  <MapPin size={14} className="mr-1" />
                  {isLocating ? "Géolocalisation..." : "Ma position GPS"}
                </button>
              </div>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Marina Tower, Apt 402, Dubai"
                rows={3}
                className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-gray-900 outline-none resize-none ${location ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}
              ></textarea>
              {location && (
                <p className="text-xs text-green-600 mt-1 font-medium">✅ Position GPS exacte capturée avec succès.</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-6">
              <h3 className="font-bold text-blue-900 flex items-center text-sm mb-2">
                <CreditCard size={16} className="mr-2" />
                Paiement sécurisé (Simulation)
              </h3>
              <p className="text-xs text-blue-800">
                Vous allez être débité de <strong>3 USD</strong> pour confirmer la course du livreur. 
                Le solde de {formatPrice(itemsTotal)} sera à payer à l'arrivée.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing || cartTotalCount === 0}
              className="w-full mt-4 bg-gray-900 text-white font-bold py-4 rounded-xl shadow-sm hover:bg-gray-800 active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `Payer 3 USD pour valider`
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Résumé de la commande</h2>
          
          <div className="space-y-4 mb-6">
            {cartItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-500 mr-3">{item.quantity}x</span>
                  <span className="text-sm text-gray-900">{item.title}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{formatPrice(parseFloat(item.price) * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Sous-total produits</span>
              <span className="font-bold text-gray-900">{formatPrice(itemsTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-orange-600 font-bold">
              <span>Frais d'approche (À payer maintenant)</span>
              <span>3 USD</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
