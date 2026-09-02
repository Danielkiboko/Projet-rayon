"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ChatBox } from "@/components/ChatBox";

export default function ClientChatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    const q = query(
      collection(db, "chats"),
      where("clientId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(fetchedChats);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-8 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard/client" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Messagerie</h1>
        </div>

        <div className="flex flex-1 gap-6 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px]">
          
          {/* Chat List (Sidebar) */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-700">Vos conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Chargement...</div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Aucune conversation en cours.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {chats.map(chat => (
                    <li key={chat.id}>
                      <button
                        onClick={() => setActiveChatId(chat.id)}
                        className={`w-full text-left p-4 hover:bg-white transition-colors ${
                          activeChatId === chat.id ? "bg-white border-l-4 border-blue-500" : ""
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {chat.propertyTitle || "Agent Immobilier"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          Cliquez pour voir les messages
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 p-6 flex flex-col bg-white">
            {activeChatId ? (
              <ChatBox 
                chatId={activeChatId} 
                otherUserName={chats.find(c => c.id === activeChatId)?.propertyTitle || "Agent"} 
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <MessageSquare size={64} className="mb-4 text-gray-300" />
                <p>Sélectionnez une conversation pour commencer à discuter</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
