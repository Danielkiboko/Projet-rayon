"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export type CartItem = {
  id: string;
  title: string;
  price: string;
  image: string;
  quantity: number;
  supplierId?: string;
  category?: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartTotalCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth();
  
  // Prevent saving to DB on the very first render before we load data
  const isInitialized = useRef(false);

  // 1. Load initial cart
  useEffect(() => {
    const loadCart = async () => {
      let loadedItems: CartItem[] = [];

      // Load from local storage first (for fast UI and anonymous users)
      const saved = localStorage.getItem("rayon-cart");
      if (saved) {
        try {
          loadedItems = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse cart");
        }
      }

      // If user is logged in, try to fetch from Firebase
      if (user) {
        try {
          const cartRef = doc(db, "carts", user.uid);
          const cartSnap = await getDoc(cartRef);
          
          if (cartSnap.exists()) {
            const dbItems = cartSnap.data().items as CartItem[];
            if (dbItems && dbItems.length > 0) {
              loadedItems = dbItems; // Prefer DB cart if it exists
            }
          }
        } catch (error) {
          console.error("Firebase quota exceeded or error fetching cart. Falling back to local storage.", error);
        }
      }

      setItems(loadedItems);
      isInitialized.current = true;
    };

    loadCart();
  }, [user]); // Re-run when user logs in/out

  // 2. Save cart changes
  useEffect(() => {
    if (!isInitialized.current) return;

    // Always save to local storage
    localStorage.setItem("rayon-cart", JSON.stringify(items));

    // Save to Firebase if user is logged in
    if (user) {
      const saveToDb = async () => {
        try {
          const cartRef = doc(db, "carts", user.uid);
          await setDoc(cartRef, { items }, { merge: true });
        } catch (error) {
          console.error("Firebase quota exceeded or error saving cart.", error);
        }
      };
      saveToDb();
    }
  }, [items, user]);

  const addToCart = (newItem: Omit<CartItem, "quantity">) => {
    setItems((currentItems) => {
      const existing = currentItems.find((i) => i.id === newItem.id);
      if (existing) {
        return currentItems.map((i) =>
          i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...currentItems, { ...newItem, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setItems((current) => current.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartTotalCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartTotalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
