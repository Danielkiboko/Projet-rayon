"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, where, limit, setDoc, doc } from "firebase/firestore";

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

  useEffect(() => {
    if (!user) return;

    // Determine Chat ID
    const generateChatId = () => `${user.uid}_${supplierId}`;
    const id = generateChatId();
    setChatId(id);

    // Ensure chat doc exists
    const initChat = async () => {
      const chatRef = doc(db, "chats", id);
      await setDoc(chatRef, {
        clientId: user.uid,
        supplierId: supplierId,
        lastProductId: productId,
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
        unreadSupplier: true
      }, { merge: true });

    } catch (error) {
      console.error("Error sending message:", error);
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

      {/* Messages */}
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

      {/* Input */}
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
    </div>
  );
}
