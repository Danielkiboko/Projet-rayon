import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Building, 
  Users, 
  FileText,
  Wifi,
  Settings
} from "lucide-react";

export type ServiceType = "mode" | "immo" | "connect" | "default";

export interface MenuItem {
  title: string;
  href: string;
  icon: any; // Lucide icon
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
      { title: "Dashboard", href: "/supplier/dashboard", icon: LayoutDashboard },
      { title: "Paramètres", href: "/supplier/settings", icon: Settings },
    ]
  },
  mode: {
    name: "Rayon Mode",
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
      { title: "Dashboard", href: "/supplier/dashboard", icon: LayoutDashboard },
      { title: "Mes Produits", href: "/supplier/products", icon: Package },
      { title: "Commandes", href: "/supplier/orders", icon: ShoppingCart },
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
      { title: "Dashboard", href: "/supplier/dashboard", icon: LayoutDashboard },
      { title: "Mes Propriétés", href: "/supplier/properties", icon: Building },
      { title: "Locataires", href: "/supplier/tenants", icon: Users },
      { title: "Contrats", href: "/supplier/contracts", icon: FileText },
    ]
  },
  connect: {
    name: "Rayon Connect",
    colors: {
      sidebarBg: "bg-[#064e3b]", // Dark emerald
      sidebarText: "text-emerald-100",
      primaryBtn: "bg-emerald-600",
      primaryBtnHover: "hover:bg-emerald-700",
      accentText: "text-emerald-500",
      activeMenuBg: "bg-emerald-600/20",
      activeMenuText: "text-emerald-400",
    },
    menu: [
      { title: "Dashboard", href: "/supplier/dashboard", icon: LayoutDashboard },
      { title: "Services Réseau", href: "/supplier/services", icon: Wifi },
      { title: "Abonnements", href: "/supplier/subscriptions", icon: Users },
    ]
  }
};
