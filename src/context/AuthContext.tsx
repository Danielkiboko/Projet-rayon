"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut, getIdTokenResult } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch user data from Firestore using getDoc instead of onSnapshot to save reads
        try {
          const docSnap = await getDoc(doc(db, "users", currentUser.uid));
            if (docSnap.exists()) {
              const data = docSnap.data();
              let role = data.role;
              if (currentUser.email === 'danielkiboko218@gmail.com' || currentUser.email === 'admin@rayons.net') {
                role = role || 'SUPER_ADMIN';
                // Silently refresh token in background to get updated claims
                currentUser.getIdToken(true).catch(() => {});
              }
              if (!role) {
                const tokenResult = await getIdTokenResult(currentUser, true);
                role = tokenResult.claims.role as string | undefined;
              }
              setUserData({ ...data, role });
            } else {
              let role: string | undefined = undefined;
              if (currentUser.email === 'danielkiboko218@gmail.com' || currentUser.email === 'admin@rayons.net') {
                role = 'SUPER_ADMIN';
                currentUser.getIdToken(true).catch(() => {});
              } else {
                const tokenResult = await getIdTokenResult(currentUser, true);
                role = tokenResult.claims.role as string | undefined;
              }
              setUserData(role ? { role } : null);
            }
        } catch (error) {
          console.error("Error fetching user data, falling back to claims:", error);
          try {
            const tokenResult = await getIdTokenResult(currentUser);
            let role = tokenResult.claims.role as string | undefined;
            if (!role && (currentUser.email === 'danielkiboko218@gmail.com' || currentUser.email === 'admin@rayons.net')) {
              role = 'SUPER_ADMIN';
            }
            setUserData({
              role: role || (currentUser.email === 'danielkiboko218@gmail.com' ? 'SUPER_ADMIN' : 'CLIENT'),
              email: currentUser.email,
              displayName: currentUser.displayName || 'Utilisateur'
            });
          } catch (e) {
            console.error("Error fetching claims:", e);
            if (currentUser.email === 'danielkiboko218@gmail.com' || currentUser.email === 'admin@rayons.net') {
              setUserData({ role: 'SUPER_ADMIN', email: currentUser.email, displayName: currentUser.displayName || 'Daniel Kiboko' });
            } else {
              setUserData({ role: 'CLIENT', email: currentUser.email, displayName: currentUser.displayName || 'Client' });
            }
          }
        } finally {
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // EFFECT 1: Inactivity Timer (depends on user role)
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    let lastActivity = Date.now();

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      // 10 minutes = 10 * 60 * 1000 ms
      inactivityTimer = setTimeout(() => {
        if (user && userData && (userData.role === 'admin' || userData.role === 'SUB_ADMIN' || userData.role === 'supplier' || userData.role === 'SUB_SUPPLIER')) {
          firebaseSignOut(auth).then(() => {
            router.push("/login?reason=inactivity");
          });
        }
      }, 10 * 60 * 1000);
    };

    const handleActivity = () => {
      // Throttle to reset timer at most once per second
      if (Date.now() - lastActivity > 1000) {
        lastActivity = Date.now();
        resetTimer();
      }
    };

    if (user && userData && (userData.role === 'admin' || userData.role === 'SUB_ADMIN' || userData.role === 'supplier' || userData.role === 'SUB_SUPPLIER')) {
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      window.addEventListener('scroll', handleActivity);
      window.addEventListener('touchstart', handleActivity);
      resetTimer();
    }
    
    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [user, userData?.role, router]);

  const signOut = async () => {
    try {
      if (user) {
        try {
          // Fire and forget, or timeout after 1 second so it doesn't hang the logout
          await Promise.race([
            setDoc(doc(db, "users", user.uid), {
              isOnline: false,
              lastConnection: serverTimestamp()
            }, { merge: true }),
            new Promise(resolve => setTimeout(resolve, 1000))
          ]);
        } catch (e) {
          console.error("Firestore update failed on signout", e);
        }
      }
      await firebaseSignOut(auth).catch(e => console.error("Firebase Auth signout error", e));
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setUser(null);
      setUserData(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
