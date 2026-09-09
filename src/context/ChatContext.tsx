"use client";

import React, { createContext, useContext, useState } from "react";

interface ProductInfo {
  id: string;
  supplierId: string;
  name: string;
}

interface ChatContextType {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  
  activeProduct: ProductInfo | null;
  openChatForProduct: (product: ProductInfo) => void;
  closeActiveProductChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState<ProductInfo | null>(null);

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => {
    setIsChatOpen(false);
    // Optionally keep active product to resume later, or clear it
  };
  const toggleChat = () => setIsChatOpen(prev => !prev);

  const openChatForProduct = (product: ProductInfo) => {
    setActiveProduct(product);
    setIsChatOpen(true);
  };

  const closeActiveProductChat = () => {
    setActiveProduct(null);
    // keep chat widget open to show list
  };

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        openChat,
        closeChat,
        toggleChat,
        activeProduct,
        openChatForProduct,
        closeActiveProductChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
