import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { GlobalChatbot } from "@/components/GlobalChatbot";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rayons.net | Tout ce dont vous avez besoin, en un seul endroit",
  description: "Rayons est la marketplace de référence : Technologies & Objets connectés (Rayons Connect), Immobilier & Hôtels (Rayons Immo), Prêt-à-porter & Accessoires (Rayons Mode).",
};

import { AuthProvider } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AdSense from "@/components/shared/AdSense";

import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${montserrat.variable} ${inter.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-[#0F1D27] text-[#0F1D27] dark:text-gray-100 transition-colors font-sans" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CurrencyProvider>
              <ChatProvider>
                {children}
                <GlobalChatbot />
              </ChatProvider>
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
        <SpeedInsights />
        <AdSense />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
