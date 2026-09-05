"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, LayoutDashboard, Package, ShoppingCart, Truck, Wallet, CreditCard } from "lucide-react";
import { themeConfig } from "@/lib/themeConfig";
import ProfileUpdateModal from "@/components/ProfileUpdateModal";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { isSupplier, getSupplierType } from "@/lib/permissions";

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Redirect to billing if trial expired
  useEffect(() => {
    if (!loading && user && userData && isSupplier(userData)) {
      // Don't redirect if they are already on the billing page
      if (pathname === "/supplier/billing") return;

      if (userData.subscriptionStatus === "TRIAL" && userData.subscriptionEndDate) {
        const endDate = userData.subscriptionEndDate.toDate ? userData.subscriptionEndDate.toDate() : new Date(userData.subscriptionEndDate);
        if (new Date() > endDate) {
          router.push("/supplier/billing");
        }
      } else if (userData.subscriptionStatus === "EXPIRED") {
        router.push("/supplier/billing");
      }
    }
  }, [user, userData, loading, pathname, router]);

  // Listen to in-app notifications
  useEffect(() => {
    if (!user) return;
    
    let unsubNotifs: any;
    
    const setupNotifications = async () => {
      try {
        const { collection, query, where, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");

        const qNotifs = query(
          collection(db, "inapp_notifications"),
          where("supplierId", "==", user.uid),
          where("read", "==", false)
        );

        unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
          const items: any[] = [];
          snapshot.forEach(doc => {
            const d = doc.data();
            items.push({
              id: doc.id,
              type: d.type || "system",
              title: d.title || "Notification",
              message: d.message || "",
              time: d.time || Date.now(),
              link: d.link || "#"
            });
          });
          // Sort by newest first
          items.sort((a, b) => b.time - a.time);
          setNotifications(items);
          setUnreadCount(items.length);
        });
      } catch (err) {
        console.error("Error setting up supplier notifications:", err);
      }
    };

    setupNotifications();

    return () => {
      if (unsubNotifs) unsubNotifs();
    };
  }, [user]);

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-[#0b061c] text-white">Chargement...</div>;
  }

  if (!user || !isSupplier(userData)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0b061c] text-white flex-col">
        <ShieldAlert size={48} className="mb-4 text-red-500" />
        <p>Accès refusé. Réservé aux fournisseurs.</p>
      </div>
    );
  }

  // Subscription expired: show banner but still allow access so supplier receives notifications
  const isSubscriptionExpired = (() => {
    if (!userData?.subscriptionEndDate) return false;
    const endDate = userData.subscriptionEndDate.toDate
      ? userData.subscriptionEndDate.toDate()
      : new Date(userData.subscriptionEndDate);
    return new Date() > endDate;
  })();

  const service = getSupplierType(userData);
  const theme = themeConfig[service] || themeConfig["default"];
  const navItems = theme.menu;

  return (
    <DashboardLayout
      menuItems={navItems}
      themeColors={theme.colors}
      roleBadgeTitle="Service rattaché"
      roleBadgeValue={theme.name}
      topbarTitle="Tableau de bord"
      userName={userData?.displayName || userData?.name || "Fournisseur"}
      userRole="Partenaire"
      notifications={notifications}
      unreadCount={unreadCount}
      customProfileModal={
        <ProfileUpdateModal 
          user={user} 
          userData={userData} 
          onSuccess={() => window.location.reload()} 
        />
      }
    >
      {/* ── Subscription Expired Banner ── */}
      {isSubscriptionExpired && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-amber-400 shrink-0" size={22} />
            <div>
              <p className="text-amber-400 font-semibold text-sm">Abonnement expiré</p>
              <p className="text-amber-400/70 text-xs mt-0.5">
                Votre abonnement a expiré. Vous pouvez toujours consulter vos notifications et commandes, mais la publication de nouveaux produits est suspendue jusqu'au renouvellement.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/supplier/billing')}
            className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Renouveler
          </button>
        </div>
      )}
      
      {service === "immo" && 
        (!userData?.rccm || !userData?.nif || !userData?.logoUrl || !userData?.idNat) && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start space-x-3 mb-6">
          <ShieldAlert className="text-red-400 mt-0.5 shrink-0" size={20} />
          <div>
            <h3 className="text-red-400 font-semibold text-sm">Profil Légal Incomplet</h3>
            <p className="text-red-400/80 text-sm mt-1">Vous devez renseigner votre RCCM, ID Nat, NIF et Logo dans les Paramètres pour pouvoir générer des factures.</p>
            <Link href="/supplier/settings" className="inline-block mt-2 text-xs font-semibold text-white bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-colors">
              Aller aux paramètres
            </Link>
          </div>
        </div>
      )}
      
      {children}
    </DashboardLayout>
  );
}
