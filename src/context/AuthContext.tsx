"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut, getIdTokenResult } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch real-time user data from Firestore
        const unsubscribeDoc = onSnapshot(doc(db, "users", currentUser.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Try to read role from custom claims if not present in Firestore
            let role = data.role;
            if (!role) {
              const tokenResult = await getIdTokenResult(currentUser);
              role = tokenResult.claims.role as string | undefined;
            }
            setUserData({ ...data, role });
          } else {
            // No doc – fallback to custom claims
            const tokenResult = await getIdTokenResult(currentUser);
            const role = tokenResult.claims.role as string | undefined;
            setUserData(role ? { role } : null);
          }
          setLoading(false);
        }, async (error) => {
          console.error("Error fetching user data, falling back to claims:", error);
          try {
            const tokenResult = await getIdTokenResult(currentUser);
            const role = tokenResult.claims.role as string | undefined;
            setUserData(role ? { role } : null);
          } catch (e) {
            console.error("Error fetching claims:", e);
            setUserData(null);
          }
          setLoading(false);
        });
        
        return () => unsubscribeDoc();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
