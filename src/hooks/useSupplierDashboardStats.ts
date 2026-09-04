import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const groupPaymentsByDate = (payments: any[]) => {
  const result: Record<string, number> = {};
  payments.forEach(payment => {
    if (!payment.createdAt) return;
    const dateObj = new Date((payment.createdAt.seconds || payment.createdAt._seconds) * 1000);
    const dateStr = dateObj.toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' });
    if (!result[dateStr]) result[dateStr] = 0;
    result[dateStr] += payment.amount || 0;
  });
  
  return Object.keys(result).map(key => ({
    name: key,
    total: result[key]
  })).reverse();
};

export function useSupplierDashboardStats(productsCollectionName = "products") {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingDeliveries: 0,
  });

  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // We allow fetching from different product collections (e.g., 'properties' for Immo)
    const qProps = query(collection(db, productsCollectionName), where("supplierId", "==", user.uid));
    const unsubProducts = onSnapshot(qProps, (snapshot) => {
      setStats(prev => ({ ...prev, totalProducts: snapshot.size }));
    });

    const qOrders = query(
      collection(db, "orders"),
      where("supplierIds", "array-contains", user.uid),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      let active = 0;
      let pending = 0;
      let revenue = 0;
      const ordersData: any[] = [];
      const paymentsForChart: any[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        ordersData.push({ id: doc.id, ...data });

        if (data.status === "COMPLETED") {
          revenue += (data.itemsTotal || 0);
          paymentsForChart.push({ createdAt: data.createdAt, amount: data.itemsTotal || 0 });
        } else {
          active++;
          if (data.status === "PENDING" || data.status === "CONFIRMED_AWAITING_DRIVER") {
            pending++;
          }
        }
      });

      setStats(prev => ({ ...prev, activeOrders: active, pendingDeliveries: pending, totalRevenue: revenue }));
      setRecentOrders(ordersData.slice(0, 5));
      setRevenueData(groupPaymentsByDate(paymentsForChart));
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [user, productsCollectionName]);

  return { stats, loading, revenueData, recentOrders };
}
