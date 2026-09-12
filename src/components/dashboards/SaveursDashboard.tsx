"use client";

import { useRouter } from "next/navigation";
import { UtensilsCrossed, ShoppingCart, DollarSign, Clock, Truck } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import GenericDashboard, { KpiConfig, ActionConfig } from "./shared/GenericDashboard";
import { useSupplierDashboardStats } from "@/hooks/useSupplierDashboardStats";

export default function SaveursDashboard() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const { stats, loading, revenueData, recentOrders } = useSupplierDashboardStats();

  const KPIS: KpiConfig[] = [
    { title: "Plats & Articles en Vente", value: stats.totalProducts.toString(), subtitle: "Menu & Cuisine", subInfo: "Gérer la carte / catalogue", icon: UtensilsCrossed },
    { title: "Commandes Actives", value: stats.activeOrders.toString(), subtitle: "En cours", subInfo: "En cuisine / En préparation", icon: ShoppingCart },
    { title: "Chiffre d'affaires", value: formatPrice(stats.totalRevenue), subtitle: "Total", subInfo: "Revenus bruts", icon: DollarSign },
    { title: "Livraisons en attente", value: stats.pendingDeliveries.toString(), subtitle: "Action requise", subInfo: stats.pendingDeliveries > 0 ? "Prêt pour coursier" : "Toutes les livraisons traitées", icon: Truck, alertCondition: stats.pendingDeliveries > 0 },
  ];

  const actions: ActionConfig[] = [
    {
      title: "Ajouter un plat ou ustensile",
      description: "Publiez un nouveau plat cuisiné, un menu du jour ou un accessoire culinaire.",
      buttonText: "Ajouter au catalogue",
      onClick: () => router.push('/supplier/products'),
      isPrimary: true
    },
    {
      title: "Gérer les commandes & livraisons",
      description: "Consultez les commandes à préparer en cuisine et à confier aux coursiers.",
      buttonText: "Voir les commandes",
      onClick: () => router.push('/supplier/orders'),
      isPrimary: false
    }
  ];

  return (
    <GenericDashboard
      loading={loading}
      moduleName="Boutique Saveurs & Restaurant"
      kpis={KPIS}
      chartData={revenueData}
      chartTitle="Évolution des Ventes Saveurs (30 j)"
      chartColor="#FF6B35"
      recentItemsTitle="Commandes Récentes"
      recentItemsHeaders={["ID", "Date", "Client", "Montant", "Statut"]}
      recentItemsData={recentOrders}
      emptyStateMessage="Aucune commande récente."
      actionsTitle="Gérer mon espace Saveurs"
      actions={actions}
      renderRecentRow={(order: any) => (
        <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
          <td className="p-4 font-semibold text-white">#{order.id.slice(0, 6).toUpperCase()}</td>
          <td className="p-4">{order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : "-"}</td>
          <td className="p-4">{order.clientName || order.clientPhone}</td>
          <td className="p-4 font-bold text-[#FF6B35]">{formatPrice(order.myTotal || order.itemsTotal)}</td>
          <td className="p-4">
            <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
              order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 
              order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : 
              'bg-orange-500/10 text-orange-400'
            }`}>
              {order.status || 'EN COURS'}
            </span>
          </td>
        </tr>
      )}
    />
  );
}
