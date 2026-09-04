import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer } from "@/components/CartDrawer";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rayons.NET | E-commerce & Immobilier",
  description: "Découvrez notre sélection premium d'équipements technologiques et de biens immobiliers de prestige. L'excellence pour votre quotidien.",
};

import { AuthProvider } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AdSense from "@/components/shared/AdSense";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${montserrat.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-[#0b061c] text-gray-900 dark:text-gray-100 transition-colors" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CurrencyProvider>
              <CartProvider>
                {children}
                <CartDrawer />
              </CartProvider>
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
        <SpeedInsights />
        <AdSense />
      </body>
    </html>
  );
}
