"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MessageSquare, ChevronLeft, Maximize2 } from "lucide-react";
import Link from "next/link";
import { ChatBox } from "@/components/ChatBox";

interface ClientChatsWidgetProps {
  embedded?: boolean;
  onChatSelected?: (chatId: string) => void;
}

export function ClientChatsWidget({ embedded = false }: ClientChatsWidgetProps) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const paramSupplierId = searchParams.get("supplierId");
  const paramChatId = searchParams.get("chatId");

  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Listen to all client chats
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
      const fetchedChats: any[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Sort by updatedAt desc
      fetchedChats.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis?.() || a.lastMessageTime?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || b.lastMessageTime?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setChats(fetchedChats);
      setIsLoading(false);
    }, (err) => {
      console.warn("Client chats listener warning:", err.message);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  // 2. Handle searchParams (supplierId or chatId) & auto-selection
  useEffect(() => {
    if (!user || isLoading) return;

    const resolveChat = async () => {
      // Direct chatId provided
      if (paramChatId) {
        setActiveChatId(paramChatId);
        return;
      }

      // supplierId provided
      if (paramSupplierId) {
        const existing = chats.find(c => c.supplierId === paramSupplierId);
        if (existing) {
          setActiveChatId(existing.id);
        } else {
          // Initialize a new chat with this supplier
          try {
            const supplierDoc = await getDoc(doc(db, "users", paramSupplierId));
            const supplierData = supplierDoc.data() || {};
            const supplierName = supplierData.displayName || supplierData.businessName || supplierData.email || "Fournisseur";

            const newChatId = `${user.uid}_${paramSupplierId}`;
            await setDoc(doc(db, "chats", newChatId), {
              clientId: user.uid,
              supplierId: paramSupplierId,
              productName: supplierName,
              propertyTitle: supplierName,
              updatedAt: serverTimestamp(),
            }, { merge: true });

            setActiveChatId(newChatId);
          } catch (e) {
            console.warn("Error resolving supplier chat:", e);
          }
        }
        return;
      }

      // Default auto-select first conversation if none selected on desktop
      if (!activeChatId && chats.length > 0 && typeof window !== "undefined" && window.innerWidth >= 768) {
        setActiveChatId(chats[0].id);
      }
    };

    resolveChat();
  }, [paramChatId, paramSupplierId, chats, isLoading, user, activeChatId]);

  if (!user) {
    return <div className="p-8 text-center text-gray-400">Chargement...</div>;
  }

  const activeChat = chats.find(c => c.id === activeChatId);
  const activeChatName = activeChat?.propertyTitle || activeChat?.productName || "Agent / Vendeur";

  return (
    <div className={`flex flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${embedded ? 'min-h-[580px] h-[650px]' : 'min-h-[600px]'}`}>
      
      {/* Chat List (Sidebar) */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/80 ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-800 text-sm">Vos conversations</h2>
            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full font-medium">
              {chats.length}
            </span>
          </div>
          {embedded && (
            <Link 
              href="/dashboard/client/chats" 
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium transition-colors"
              title="Ouvrir en plein écran"
            >
              <Maximize2 size={13} />
              Plein écran
            </Link>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Chargement des discussions...</div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <MessageSquare size={36} className="mx-auto mb-2 text-gray-300" />
              <p className="font-medium text-gray-600 mb-1">Aucune conversation</p>
              <p className="text-xs text-gray-400">Contactez un vendeur ou un agent immobilier pour débuter un échange.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200/70">
              {chats.map(chat => {
                const isSelected = activeChatId === chat.id;
                const hasUnread = Boolean(chat.unreadClient);
                const title = chat.propertyTitle || chat.productName || "Agent / Vendeur";

                return (
                  <li key={chat.id}>
                    <button
                      onClick={() => setActiveChatId(chat.id)}
                      className={`w-full text-left p-4 hover:bg-white transition-colors flex items-start justify-between gap-2 ${
                        isSelected ? "bg-white border-l-4 border-primary shadow-xs" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900 text-sm truncate">
                            {chat.isHotel ? "🏨 " : ""}{title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {chat.lastMessage || "Nouvelle conversation"}
                        </p>
                      </div>

                      {hasUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 p-4 md:p-6 flex flex-col bg-white ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {activeChatId ? (
          <div className="h-full flex flex-col flex-1 min-h-0">
            {/* Mobile back button */}
            <div className="md:hidden pb-3 mb-3 border-b border-gray-100 flex items-center justify-between">
              <button 
                onClick={() => setActiveChatId(null)}
                className="flex items-center text-xs font-medium text-primary hover:text-primary-dark"
              >
                <ChevronLeft size={16} /> Toutes les conversations
              </button>
              {embedded && (
                <Link 
                  href={`/dashboard/client/chats?chatId=${activeChatId}`} 
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <Maximize2 size={12} /> Agrandir
                </Link>
              )}
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              <ChatBox 
                chatId={activeChatId} 
                otherUserName={activeChatName} 
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <MessageSquare size={54} className="mb-3 text-gray-300" />
            <h3 className="text-gray-700 font-semibold mb-1">Sélectionnez une discussion</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Choisissez un échange dans la colonne de gauche pour discuter en direct ou négocier avec vos partenaires.
            </p>
          </div>
        )}
      </div>
      
    </div>
  );
}
