"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export default function DashboardRedirect() {
  const router = useRouter()
  const { user, userData, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
      return
    }
    const role = userData?.role?.toUpperCase();
    switch (role) {
      case "DELIVERY":
      case "DRIVER":
      case "LIVREUR":
        router.replace("/delivery/dashboard")
        break
      case "SUPPLIER":
      case "FOURNISSEUR":
        router.replace("/supplier/dashboard")
        break
      case "SUB_ADMIN":
        if (userData?.permissions?.canViewDashboard) {
          router.replace("/admin/dashboard")
        } else if (userData?.permissions?.canManageProducts) {
          router.replace("/admin/products")
        } else if (userData?.permissions?.canManageDelivery) {
          router.replace("/admin/delivery/create")
        } else {
          router.replace("/admin/dashboard")
        }
        break
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-900">
      <p className="text-lg font-medium">Redirection en cours…</p>
    </div>
  )
}
