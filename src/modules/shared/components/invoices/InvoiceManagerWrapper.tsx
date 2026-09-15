"use client";
import dynamic from "next/dynamic";

const InvoiceManager = dynamic(() => import("./InvoiceManager"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-gray-500">Chargement...</div>
});

export default function InvoiceManagerWrapper() {
  return <InvoiceManager />;
}
