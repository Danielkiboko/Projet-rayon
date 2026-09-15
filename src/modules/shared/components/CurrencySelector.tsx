"use client";

import { Globe } from "lucide-react";
import { useCurrency, CurrencyCode } from "@/context/CurrencyContext";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const currencies: CurrencyCode[] = ["FC", "USD", "EUR"];

  return (
    <div className="relative group/currency">
      <button className="flex items-center gap-1 text-sm font-bold text-gray-700 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full transition-colors">
        <Globe size={16} />
        {currency}
      </button>
      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-24 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover/currency:opacity-100 group-hover/currency:visible transition-all duration-200 z-50 overflow-hidden">
        {currencies.map((code) => (
          <button
            key={code}
            onClick={() => setCurrency(code)}
            className={`block w-full text-left px-4 py-2 text-sm font-bold hover:bg-gray-50 transition-colors ${
              currency === code ? "text-[#4F46E5] bg-[#4F46E5]/5" : "text-gray-700"
            }`}
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
}
