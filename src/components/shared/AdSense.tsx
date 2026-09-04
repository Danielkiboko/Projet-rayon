"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export default function AdSense() {
  const adSenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setIsDev(true);
    }
  }, []);

  if (!adSenseId) {
    return null;
  }

  return (
    <>
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      {isDev && (
        <div className="fixed bottom-0 left-0 right-0 w-full bg-slate-200 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 h-[90px] flex items-center justify-center z-50 opacity-95 shadow-lg">
          <div className="text-center">
            <span className="text-xs text-slate-500 uppercase tracking-widest block mb-1">Espace Publicitaire (Simulation Localhost)</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Votre publicité Google AdSense s'affichera ici en production</span>
          </div>
        </div>
      )}
    </>
  );
}
