"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { motion } from "framer-motion"

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, userData, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
      return
    }
    let role = userData?.role?.toUpperCase();
    
    // Hardcode super admin email for redirect if no role is explicitly set in Firestore
    if (!role && user?.email === "danielkiboko218@gmail.com") {
      role = "SUPER_ADMIN";
    }

    switch (role) {
      case "DELIVERY":
      case "DRIVER":
      case "LIVREUR":
        router.replace("/driver")
        break
      case "SUPPLIER":
      case "FOURNISSEUR":
        router.replace("/supplier")
        break
      case "SUB_ADMIN":
      case "SUPER_ADMIN":
      case "SUPERADMIN":
      case "ADMIN":
        router.replace("/admin/dashboard")
        break
      default:
        console.warn("Rôle non reconnu ou manquant:", userData?.role);
        router.replace("/")
    }
  }, [loading, user, userData, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b061c] text-white">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-24 h-24 rounded-full border-4 border-white/10 border-t-primary border-l-primary"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-primary/50"
          >
            <span className="text-xl font-bold text-white tracking-wider">R<span className="text-primary-light">.</span></span>
          </motion.div>
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-lg font-medium text-gray-400 tracking-wide"
      >
        Préparation de votre espace...
      </motion.p>
    </div>
  )
}
