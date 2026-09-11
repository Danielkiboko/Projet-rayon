import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { groupPaymentsByDate } from "@/lib/dateUtils";

export function useSupplierDashboardStats(productsCollectionName = "products") {
  const { user, userData } = useAuth();
  const activeSupplierId = userData?.parentSupplierId || user?.uid;
  
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
    if (!user || !activeSupplierId) return;

    // We allow fetching from different product collections (e.g., 'properties' for Immo)
    const qProps = query(collection(db, productsCollectionName), where("supplierId", "==", activeSupplierId));
    const unsubProducts = onSnapshot(qProps, (snapshot) => {
      setStats(prev => ({ ...prev, totalProducts: snapshot.size }));
    });

    const qOrders = query(
      collection(db, "orders"),
      where("supplierIds", "array-contains", activeSupplierId),
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
        
        // Calculate supplier specific portion
        const myItems = data.items?.filter((item: any) => item.supplierId === activeSupplierId) || [];
        const myTotal = myItems.reduce((acc: number, item: any) => acc + (item.price * (item.quantity || 1)), 0);

        ordersData.push({ id: doc.id, myTotal, ...data });

        if (data.status === "COMPLETED" || data.status === "LIVRÉE" || data.status === "DELIVERED") {
          revenue += myTotal;
          paymentsForChart.push({ createdAt: data.createdAt, amount: myTotal });
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
  }, [user, activeSupplierId, productsCollectionName]);

  return { stats, loading, revenueData, recentOrders };
}
