"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  ShieldAlert,
  Users,
  Building,
  Package,
  Activity,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminDashboardPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    pendingSuppliers: 0,
    pendingProperties: 0,
    pendingProducts: 0,
    totalActiveSuppliers: 0,
    totalProperties: 0,
    totalProducts: 0,
  });

  const [dataLoading, setDataLoading] = useState(true);

  // Protect route
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        const isSuperAdmin = user.email === "danielkiboko218@gmail.com" || userData?.role === "SUPER_ADMIN";
        const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN";
        
        if (!isSuperAdmin && !isAuthorizedSubAdmin) {
          router.push("/");
        }
      }
    }
  }, [user, userData, loading, router]);

  // Fetch Validation & Regulation Data
  useEffect(() => {
    if (!user) return;
    const isSuperAdmin = user.email === "danielkiboko218@gmail.com" || userData?.role === "SUPER_ADMIN";
    const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN";
    if (!isSuperAdmin && !isAuthorizedSubAdmin) return;

    const fetchDashboardData = async () => {
      try {
        // 1. Fetch pending & active suppliers
        const qUsers = query(collection(db, "users"), where("role", "in", ["SUPPLIER", "supplier", "SUPPLIER_IMMO"]));
        const snapUsers = await getDocs(qUsers);
        let pSuppliers = 0;
        let aSuppliers = 0;
        snapUsers.forEach(doc => {
          const d = doc.data();
          if (d.status === "PENDING_APPROVAL" || d.profileUpdateStatus === "PENDING_APPROVAL") pSuppliers++;
          else aSuppliers++;
        });

        // 2. Fetch pending & active properties
        const snapProps = await getDocs(collection(db, "properties"));
        let pProps = 0;
        let aProps = 0;
        snapProps.forEach(doc => {
          const d = doc.data();
          if (d.status === "PENDING_APPROVAL") pProps++;
          else aProps++;
        });

        // 3. Fetch pending & active products
        const snapProducts = await getDocs(collection(db, "products"));
        let pProds = 0;
        let aProds = 0;
        snapProducts.forEach(doc => {
          const d = doc.data();
          if (d.status === "PENDING_APPROVAL" || d.status === "pending_approval") pProds++;
          else aProds++;
        });

        setStats({
          pendingSuppliers: pSuppliers,
          pendingProperties: pProps,
          pendingProducts: pProds,
          totalActiveSuppliers: aSuppliers,
          totalProperties: aProps,
          totalProducts: aProds,
        });

      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, userData]);

  const isSuperAdmin = user?.email === "danielkiboko218@gmail.com" || userData?.role === "SUPER_ADMIN";
  const isAuthorizedSubAdmin = userData?.role === "SUB_ADMIN";

  if (loading || !user || (!isSuperAdmin && !isAuthorizedSubAdmin)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-white flex flex-col items-center">
          <ShieldAlert size={48} className="text-gray-500 mb-4 animate-pulse" />
          <p>Vérification des accès sécurisés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Centre de Régulation</h2>
        <p className="text-gray-400 mt-1 text-sm">Gérez les accès, validez les comptes et approuvez les annonces.</p>
      </div>

      {/* SECTION VALIDATION */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <AlertTriangle className="text-orange-500 mr-2" size={20} />
          En attente de validation
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Validation Fournisseurs */}
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-orange-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <h4 className="text-sm font-semibold text-gray-300 flex justify-between">
              Comptes Fournisseurs
              <Users size={16} className="text-orange-500" />
            </h4>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-white">{dataLoading ? "-" : stats.pendingSuppliers}</span>
              <span className="text-sm text-gray-500">en attente</span>
            </div>
            <Link href="/admin/suppliers">
              <button className="mt-6 w-full py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-medium rounded-lg text-sm transition-colors border border-orange-500/20">
                Examiner les comptes
              </button>
            </Link>
          </div>

          {/* Validation Immo */}
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-amber-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <h4 className="text-sm font-semibold text-gray-300 flex justify-between">
              Annonces Immo
              <Building size={16} className="text-amber-500" />
            </h4>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-white">{dataLoading ? "-" : stats.pendingProperties}</span>
              <span className="text-sm text-gray-500">en attente</span>
            </div>
            {/* Lien fictif pour l'instant vers properties admin si existant */}
            <Link href="/admin/dashboard">
              <button className="mt-6 w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-medium rounded-lg text-sm transition-colors border border-amber-500/20">
                Examiner les biens
              </button>
            </Link>
          </div>

          {/* Validation Mode */}
          <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-blue-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <h4 className="text-sm font-semibold text-gray-300 flex justify-between">
              Produits E-commerce
              <Package size={16} className="text-blue-500" />
            </h4>
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-white">{dataLoading ? "-" : stats.pendingProducts}</span>
              <span className="text-sm text-gray-500">en attente</span>
            </div>
            <Link href="/admin/products">
              <button className="mt-6 w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-medium rounded-lg text-sm transition-colors border border-blue-500/20">
                Examiner les produits
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION VUE GLOBALE MULTI-RAYONS */}
      <div className="pt-8 border-t border-white/5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Activity className="text-green-500 mr-2" size={20} />
          Activité sur la Plateforme
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#1a1a1a] p-5 rounded-2xl shadow-sm border border-white/5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{dataLoading ? "-" : stats.totalActiveSuppliers}</p>
              <p className="text-sm text-gray-400">Fournisseurs Actifs</p>
            </div>
          </div>
          
          <div className="bg-[#1a1a1a] p-5 rounded-2xl shadow-sm border border-white/5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Building className="text-amber-500" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{dataLoading ? "-" : stats.totalProperties}</p>
              <p className="text-sm text-gray-400">Biens en Ligne</p>
            </div>
          </div>

          <div className="bg-[#1a1a1a] p-5 rounded-2xl shadow-sm border border-white/5 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Package className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{dataLoading ? "-" : stats.totalProducts}</p>
              <p className="text-sm text-gray-400">Produits en Ligne</p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
