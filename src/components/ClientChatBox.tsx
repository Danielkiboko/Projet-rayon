"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, where, limit, setDoc, doc } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

interface ClientChatBoxProps {
  supplierId: string;
  productId: string;
  productName: string;
  onClose: () => void;
}

export function ClientChatBox({ supplierId, productId, productName, onClose }: ClientChatBoxProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Guest Form State
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveredEmail, setRecoveredEmail] = useState("");

  useEffect(() => {
    if (!user) return;

    // Determine Chat ID
    const generateChatId = () => `${user.uid}_${supplierId}_${productId}`;
    const id = generateChatId();
    setChatId(id);

    // Ensure chat doc exists
    const initChat = async () => {
      const chatRef = doc(db, "chats", id);
      await setDoc(chatRef, {
        clientId: user.uid,
        supplierId: supplierId,
        propertyId: productId,
        productName: productName,
        updatedAt: serverTimestamp()
      }, { merge: true });
    };
    initChat();

    // Listen to messages
    const q = query(
      collection(db, `chats/${id}/messages`),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [user, supplierId, productId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    try {
      const msg = newMessage;
      setNewMessage(""); // optimistic clear

      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text: msg,
        senderId: user.uid,
        createdAt: serverTimestamp()
      });

      // Update last message in chat doc
      await setDoc(doc(db, "chats", chatId), {
        lastMessage: msg,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadSupplier: true,
        notified: false
      }, { merge: true });

    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleGuestAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail || !guestPhone) return;
    
    setIsAuthenticating(true);
    setAuthError("");

    try {
      // Use phone number as password (ensure min 6 chars by padding if necessary)
      const pwd = guestPhone.length >= 6 ? guestPhone : guestPhone + "RAYON";
      
      try {
        await signInWithEmailAndPassword(auth, guestEmail, pwd);
      } catch (err: any) {
        // If user not found or invalid credential, try creating one
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/invalid-login-credentials") {
          const cred = await createUserWithEmailAndPassword(auth, guestEmail, pwd);
          // Save guest profile
          await setDoc(doc(db, "users", cred.user.uid), {
            uid: cred.user.uid,
            email: guestEmail,
            phone: guestPhone,
            role: "CLIENT",
            isGuest: true,
            createdAt: serverTimestamp()
          });
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      console.error("Guest Auth Error:", error);
      setAuthError("Erreur d'authentification. Vérifiez vos identifiants.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRecoverEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestPhone) return;
    
    setIsAuthenticating(true);
    setAuthError("");
    setRecoveredEmail("");

    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: guestPhone })
      });
      const data = await res.json();
      
      if (res.ok && data.email) {
        setRecoveredEmail(data.email);
        setGuestEmail(data.email);
      } else {
        setAuthError(data.error || "Compte introuvable.");
      }
    } catch (error) {
      setAuthError("Erreur lors de la récupération.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-[350px] h-[450px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div>
          <h4 className="font-bold text-sm">Discuter avec le vendeur</h4>
          <p className="text-xs text-gray-400">À propos de: {productName}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Body: Messages or Guest Form */}
      {!user ? (
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col justify-center">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {showRecovery ? "Récupérer mon email" : "Commencer la discussion"}
            </h3>
            <p className="text-sm text-gray-500">
              {showRecovery 
                ? "Entrez votre numéro de téléphone pour retrouver l'email associé à votre compte invité."
                : "Veuillez renseigner vos coordonnées pour discuter avec le vendeur. Ces informations lui permettront de vous recontacter."}
            </p>
          </div>
          
          {authError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">
              {authError}
            </div>
          )}

          {recoveredEmail && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl">
              Votre email est : <strong>{recoveredEmail}</strong>
            </div>
          )}

          {showRecovery ? (
            <form onSubmit={handleRecoverEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:outline-none"
                  placeholder="Ex: 085..."
                />
              </div>
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium flex justify-center items-center hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {isAuthenticating ? <Loader2 size={20} className="animate-spin" /> : "Trouver mon email"}
              </button>
              <button 
                type="button" 
                onClick={() => setShowRecovery(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-900"
              >
                Retour à la connexion
              </button>
            </form>
          ) : (
            <form onSubmit={handleGuestAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:outline-none"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                  <button type="button" onClick={() => setShowRecovery(true)} className="text-xs text-blue-600 hover:underline">
                    Email oublié ?
                  </button>
                </div>
                <input
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:outline-none"
                  placeholder="Ex: 085..."
                />
                <p className="text-xs text-gray-500 mt-1">Sert également de mot de passe pour retrouver votre discussion.</p>
              </div>
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium flex justify-center items-center hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {isAuthenticating ? <Loader2 size={20} className="animate-spin" /> : "Discuter maintenant"}
              </button>
            </form>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm my-auto">
                Envoyez votre premier message au vendeur.
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                    <div className={`p-3 rounded-2xl text-sm ${isMe ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Votre message..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="ml-2 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <Send size={16} className="-ml-0.5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
