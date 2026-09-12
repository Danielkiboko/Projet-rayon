"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClientChatsWidget } from "@/components/ClientChatsWidget";

export default function ClientChatsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/client" 
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="Retour à mon espace"
            >
              <ArrowLeft size={22} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messagerie</h1>
              <p className="text-xs text-gray-500">Échangez directement avec vos agents et vendeurs</p>
            </div>
          </div>
        </div>

        <Suspense fallback={<div className="min-h-[500px] bg-white rounded-2xl border border-gray-200 flex items-center justify-center text-gray-400">Chargement de la messagerie...</div>}>
          <ClientChatsWidget embedded={false} />
        </Suspense>

      </div>
    </div>
  );
}
