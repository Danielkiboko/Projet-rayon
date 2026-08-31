"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CurrencyCode = "FC" | "USD" | "EUR";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatPrice: (amountInFC: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "FC",
  setCurrency: () => {},
  formatPrice: () => "",
});

const EXCHANGE_RATES = {
  FC: 1,
  USD: 1 / 2800,
  EUR: 1 / 3000,
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("FC");

  // Persist currency preference
  useEffect(() => {
    const saved = localStorage.getItem("rayon_currency");
    if (saved && (saved === "FC" || saved === "USD" || saved === "EUR")) {
      setCurrencyState(saved as CurrencyCode);
    }
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem("rayon_currency", c);
  };

  const formatPrice = (amountInFC: number) => {
    const converted = amountInFC * EXCHANGE_RATES[currency];
    
    if (currency === "FC") {
      return `${converted.toLocaleString("fr-FR")} FC`;
    } else if (currency === "USD") {
      return `$${converted.toFixed(2)}`;
    } else {
      return `${converted.toFixed(2)} €`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
