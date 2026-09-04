import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import SwipeButton from '../components/SwipeButton';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useLocationTracking } from '../hooks/useLocationTracking';

export default function DashboardScreen({ onLogout, userName = "Livreur", userId = "", onAcceptOrder }: { onLogout: () => void, userName?: string, userId?: string, onAcceptOrder?: (id: string) => void }) {
  const [greeting, setGreeting] = React.useState("Bonjour");
  const [status, setStatus] = React.useState("En attente de commandes...");
  const [radarColor, setRadarColor] = React.useState("#38bdf8");
  
  const { location, errorMsg } = useLocationTracking();
  const [orders, setOrders] = React.useState<any[]>([]);

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 5) {
      setGreeting("Bonsoir");
    } else {
      setGreeting("Bonjour");
    }
  }, []);

  React.useEffect(() => {
    // Listen for pending orders
    const q = query(collection(db, 'orders'), where('status', '==', 'CONFIRMED_AWAITING_DRIVER'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: any[] = [];
      snapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() });
      });
      setOrders(fetchedOrders);
      if (fetchedOrders.length > 0) {
        setStatus(`${fetchedOrders.length} commande(s) trouvée(s) !`);
        setRadarColor("#facc15");
      } else {
        setStatus("En attente de commandes...");
        setRadarColor("#38bdf8");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSwipeConfirm = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'ACCEPTED',
        driverId: userId
      });
      setStatus("Commande confirmée !");
      setRadarColor("#22c55e");
      // Redirection vers ActiveDeliveryScreen
      if (onAcceptOrder) {
        onAcceptOrder(orderId);
      } else {
        alert("Commande acceptée avec succès !");
      }
    } catch (err) {
      console.error("Erreur d'acceptation:", err);
      alert("Erreur lors de l'acceptation");
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <Text style={styles.orderTitle}>Commande #{item.id.substring(0,6)}</Text>
      <Text style={styles.orderDetail}>De: {item.supplierName || 'Fournisseur'}</Text>
      <Text style={styles.orderDetail}>Pour: {item.clientName || 'Client'}</Text>
      <Text style={styles.orderDetail}>Montant: {item.total} {item.currency || 'FC'}</Text>
      <View style={{ marginTop: 16 }}>
        <SwipeButton onConfirm={() => handleSwipeConfirm(item.id)} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}, {userName}</Text>
          <Text style={styles.status}>{status}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <FontAwesome5 name="sign-out-alt" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        /* Radar Section */
        <View style={styles.radarContainer}>
          <View style={[styles.radarPulse, { borderColor: `${radarColor}4D`, backgroundColor: `${radarColor}1A` }]}>
            <FontAwesome5 name={status === "Commande confirmée !" ? "check-circle" : "map-marker-alt"} size={40} color={radarColor} />
          </View>
          <Text style={styles.radarText}>Recherche de livraisons à proximité</Text>
        </View>
      ) : (
        /* Orders List */
        <View style={styles.ordersContainer}>
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
            contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b061c',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  status: {
    fontSize: 14,
    color: '#38bdf8',
    marginTop: 4,
  },
  logoutButton: {
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
  },
  radarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarPulse: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 24,
  },
  radarText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  ordersContainer: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  orderDetail: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  }
});
