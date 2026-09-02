export type UserRole = "ADMIN" | "SUPPLIER" | "CLIENT" | "DRIVER";

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  createdAt: number;
  // Supplier specific
  rayonId?: string; // The category they are attached to
  // Driver specific
  isAvailable?: boolean;
  currentLocation?: { lat: number; lng: number };
}

export interface Rayon {
  id: string;
  name: string;
  slug: string;
  type: "PRODUCT" | "SERVICE" | "REAL_ESTATE";
  description: string;
}

export interface Product {
  id: string;
  rayonId: string;
  supplierId: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  createdAt: number;
}

export interface Property {
  id: string;
  supplierId: string;
  title: { fr: string; en: string } | string;
  type: string; // e.g. "appartement", "maison"
  price: number;
  location: string;
  description: string;
  image: string;
  propertyCoords?: { lat: number; lng: number };
  createdAt: any;
  status: string;
  immoDetails?: {
    area?: number;
    beds?: number;
    baths?: number;
    levels?: {
      id: string;
      name: string;
      units: {
        id: string;
        name: string;
        type: string;
        capacity?: number;
      }[];
    }[];
  };
}

export type OrderStatus = "PENDING_TRANSPORT_PAYMENT" | "AWAITING_DRIVER" | "IN_TRANSIT" | "PENDING_PRODUCT_PAYMENT" | "COMPLETED" | "CANCELLED";

export interface Order {
  id: string;
  clientId: string;
  products: { productId: string; quantity: number }[];
  totalProductPrice: number;
  transportFee: number;
  status: OrderStatus;
  createdAt: number;
  deliveryAddress: string;
  // References
  driverId?: string;
  // Payment abstraction
  paymentReference?: string;
}

export interface DeliveryMission {
  id: string;
  orderId: string;
  status: "BROADCASTING" | "ACCEPTED" | "DELIVERED";
  driverId?: string;
  pickupLocation: string; // From Supplier
  dropoffLocation: string; // To Client
  createdAt: number;
}
