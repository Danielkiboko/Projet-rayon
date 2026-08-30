"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare, Send, User } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";

type Chat = {
  id: string;
  clientId: string;
  supplierId: string;
  lastMessage: string;
  updatedAt: any;
};

type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
};

export default function SupplierMessagesPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");

  // Fetch chats list
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "chats"),
      where("supplierId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      // Sort by updatedAt descending locally since we didn't add an index for it yet
      fetchedChats.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
      setChats(fetchedChats);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChatId) {
      setChatMessages([]);
      return;
    }
    const q = query(
      collection(db, "chats", activeChatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setChatMessages(msgs);
    });
    return () => unsubscribe();
  }, [activeChatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !user || !activeChatId) return;

    try {
      await addDoc(collection(db, "chats", activeChatId, "messages"), {
        text: newChatMessage,
        senderId: user.uid,
        createdAt: serverTimestamp()
      });
      
      await updateDoc(doc(db, "chats", activeChatId), {
        lastMessage: newChatMessage,
        updatedAt: serverTimestamp()
      });
      
      setNewChatMessage("");
    } catch (err) {
      console.error("Error sending message", err);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-sm text-gray-400">Communiquez avec vos clients.</p>
      </div>

      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-xl">
        
        {/* Chats List Sidebar */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-black/20">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-semibold text-white flex items-center">
              <MessageSquare size={18} className="mr-2 text-primary-light" />
              Conversations ({chats.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Aucune conversation</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {chats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`w-full p-4 text-left transition-colors flex items-center space-x-3 hover:bg-white/5 ${
                      activeChatId === chat.id ? "bg-white/10 border-l-4 border-primary" : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary-light flex-shrink-0">
                      <User size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">Client: {chat.clientId.substring(0,6)}...</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{chat.lastMessage || "Nouveau message"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Box area */}
        <div className="flex-1 flex flex-col bg-transparent">
          {!activeChatId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <MessageSquare size={32} className="text-gray-600" />
              </div>
              <p className="font-medium text-gray-400">Sélectionnez une conversation</p>
              <p className="text-sm mt-1 text-center">Les messages de vos clients apparaîtront ici.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 bg-black/20 flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary-light mr-3">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Client {chats.find(c => c.id === activeChatId)?.clientId.substring(0,6)}...</p>
                </div>
              </div>

              {/* Messages History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    Aucun message. Envoyez un message pour commencer.
                  </div>
                ) : (
                  chatMessages.map(msg => {
                    const isMe = msg.senderId === user?.uid;
                    const isSystem = msg.senderId === 'system';
                    
                    if (isSystem) {
                      return (
                         <div key={msg.id} className="flex justify-center my-2">
                           <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full text-center">
                             {msg.text}
                           </span>
                         </div>
                      );
                    }
                    
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[75%] p-3 text-sm shadow-sm ${
                            isMe 
                              ? 'bg-primary text-white rounded-2xl rounded-tr-sm' 
                              : 'bg-white/10 text-gray-100 rounded-2xl rounded-tl-sm border border-white/5'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-white/10 bg-black/20">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!newChatMessage.trim()}
                    className="bg-primary hover:bg-primary-light text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
}
