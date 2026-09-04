"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, ShoppingCart, DollarSign, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import RevenueAreaChart from "@/components/charts/RevenueAreaChart";
import { useCurrency } from "@/context/CurrencyContext";
import GenericDashboard, { KpiConfig, ActionConfig } from "./shared/GenericDashboard";
import { useSupplierDashboardStats } from "@/hooks/useSupplierDashboardStats";

export default function ConnectDashboard() {
  const { formatPrice } = useCurrency();
  const { stats, loading, revenueData, recentOrders } = useSupplierDashboardStats();

  const KPIS: KpiConfig[] = [
    { title: "Matériels en Vente", value: stats.totalProducts.toString(), subtitle: "Catalogue", subInfo: "Gérer le catalogue", icon: Package },
    { title: "Commandes Actives", value: stats.activeOrders.toString(), subtitle: "En cours", subInfo: "À traiter", icon: ShoppingCart },
    { title: "Chiffre d'affaires", value: formatPrice(stats.totalRevenue), subtitle: "Total", subInfo: "Revenus bruts", icon: DollarSign },
    { title: "À Expédier", value: stats.pendingDeliveries.toString(), subtitle: "Action requise", subInfo: stats.pendingDeliveries > 0 ? "Préparer les colis" : "Tout est expédié", icon: Truck, alertCondition: stats.pendingDeliveries > 0 },
  ];

  const actions: ActionConfig[] = [
    {
      title: "Ajouter du matériel",
      description: "Mettez en vente de nouveaux équipements (Starlink, etc.).",
      buttonText: "Créer un produit",
      onClick: () => window.location.href = '/supplier/products',
      isPrimary: true
    },
    {
      title: "Voir les expéditions",
      description: "Consultez les commandes en attente d'expédition par un livreur.",
      buttonText: "Gérer les commandes",
      onClick: () => window.location.href = '/supplier/orders',
      isPrimary: false
    }
  ];

  return (
    <GenericDashboard
      loading={loading}
      moduleName="Boutique Tech"
      kpis={KPIS}
      chartData={revenueData}
      chartTitle="Évolution des Ventes Tech (30 j)"
      chartColor="#10b981"
      recentItemsTitle="Commandes Récentes"
      recentItemsHeaders={["ID", "Date", "Client", "Montant", "Statut"]}
      recentItemsData={recentOrders}
      emptyStateMessage="Aucune commande récente."
      actionsTitle="Gérer ma boutique Tech"
      actions={actions}
      renderRecentRow={(order: any) => (
        <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
          <td className="p-4 font-semibold text-white">#{order.id.slice(0, 6).toUpperCase()}</td>
          <td className="p-4">{order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : "-"}</td>
          <td className="p-4">{order.clientName || order.clientPhone}</td>
          <td className="p-4 font-bold text-emerald-400">{formatPrice(order.itemsTotal)}</td>
          <td className="p-4">
            <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
              order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' : 
              order.status === 'PENDING' ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {order.status}
            </span>
          </td>
        </tr>
      )}
    />
  );
}
