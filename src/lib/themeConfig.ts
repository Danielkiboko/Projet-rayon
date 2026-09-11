import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Building, 
  Users, 
  FileText,
  Wifi,
  Settings,
  Wallet,
  CreditCard,
  Truck,
  MessageSquare
} from "lucide-react";

export type ServiceType = "mode" | "immo" | "connect" | "default";

export interface MenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export interface ServiceTheme {
  name: string;
  colors: {
    sidebarBg: string;
    sidebarText: string;
    primaryBtn: string;
    primaryBtnHover: string;
    accentText: string;
    activeMenuBg: string;
    activeMenuText: string;
  };
  menu: MenuItem[];
}

export const themeConfig: Record<ServiceType, ServiceTheme> = {
  default: {
    name: "Rayons.NET",
    colors: {
      sidebarBg: "bg-[#0A0A0A]",
      sidebarText: "text-white",
      primaryBtn: "bg-blue-600",
      primaryBtnHover: "hover:bg-blue-700",
      accentText: "text-blue-500",
      activeMenuBg: "bg-blue-600/10",
      activeMenuText: "text-blue-500",
    },
    menu: [
      { title: "Dashboard", href: "/supplier", icon: LayoutDashboard },
      { title: "Livre de caisse", href: "/supplier/finance", icon: Wallet },
      { title: "Paramètres", href: "/supplier/settings", icon: Settings },
    ]
  },
  mode: {
    name: "Rayon Mode",
    colors: {
      sidebarBg: "bg-[#0A0A0A]",
      sidebarText: "text-white",
      primaryBtn: "bg-purple-600",
      primaryBtnHover: "hover:bg-purple-700",
      accentText: "text-purple-500",
      activeMenuBg: "bg-purple-600/10",
      activeMenuText: "text-purple-500",
    },
    menu: [
      { title: "Dashboard", href: "/supplier", icon: LayoutDashboard },
      { title: "Mes Produits", href: "/supplier/products", icon: Package },
      { title: "Commandes", href: "/supplier/orders", icon: ShoppingCart },
      { title: "Messages", href: "/supplier/messages", icon: MessageSquare },
      { title: "Proformas & Factures", href: "/supplier/invoices", icon: FileText },
      { title: "Livre de caisse", href: "/supplier/finance", icon: Wallet },
      { title: "Livreurs", href: "/supplier/drivers", icon: Truck },
      { title: "Paramètres", href: "/supplier/settings", icon: Settings },
    ]
  },
  immo: {
    name: "Rayon Immo",
    colors: {
      sidebarBg: "bg-[#0f172a]", // Dark slate
      sidebarText: "text-slate-100",
      primaryBtn: "bg-amber-600",
      primaryBtnHover: "hover:bg-amber-700",
      accentText: "text-amber-500",
      activeMenuBg: "bg-amber-600/10",
      activeMenuText: "text-amber-500",
    },
    menu: [
      { title: "Dashboard", href: "/supplier", icon: LayoutDashboard },
      { title: "Mes Biens", href: "/supplier/properties", icon: Building },
      { title: "Locataires", href: "/supplier/tenants", icon: Users },
      { title: "Messages", href: "/supplier/messages", icon: MessageSquare },
      { title: "Proformas & Factures", href: "/supplier/invoices", icon: FileText },
      { title: "Livre de caisse", href: "/supplier/finance", icon: Wallet },
      { title: "Paramètres", href: "/supplier/settings", icon: Settings },
    ]
  },
  connect: {
    name: "Rayon Connect",
    colors: {
      sidebarBg: "bg-[#0A0A0A]", 
      sidebarText: "text-blue-100",
      primaryBtn: "bg-blue-600",
      primaryBtnHover: "hover:bg-blue-700",
      accentText: "text-blue-500",
      activeMenuBg: "bg-blue-600/20",
      activeMenuText: "text-blue-400",
    },
    menu: [
      { title: "Dashboard", href: "/supplier", icon: LayoutDashboard },
      { title: "Mes Produits", href: "/supplier/products", icon: Package },
      { title: "Commandes", href: "/supplier/orders", icon: ShoppingCart },
      { title: "Messages", href: "/supplier/messages", icon: MessageSquare },
      { title: "Proformas & Factures", href: "/supplier/invoices", icon: FileText },
      { title: "Livre de caisse", href: "/supplier/finance", icon: Wallet },
      { title: "Livreurs", href: "/supplier/drivers", icon: Truck },
      { title: "Paramètres", href: "/supplier/settings", icon: Settings },
    ]
  }
};
