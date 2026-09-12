/**
 * Checks if the user is the Super Admin.
 * Super Admin has full control over the platform.
 */
export const isSuperAdmin = (user: any, userData: any): boolean => {
  return user?.email === "danielkiboko218@gmail.com" || userData?.role === "SUPER_ADMIN";
};


const isSubAdmin = (userData: any): boolean => {
  return userData?.role === "SUB_ADMIN";
};

/**
 * Checks if the user has any admin access (Super Admin or Sub Admin).
 */
export const hasAdminAccess = (user: any, userData: any): boolean => {
  return isSuperAdmin(user, userData) || isSubAdmin(userData);
};

/**
 * Checks if the user is a supplier (Fournisseur) of any type.
 */
export const isSupplier = (userData: any): boolean => {
  const role = userData?.role?.toUpperCase();
  return role === "SUPPLIER" || role === "SUPPLIER_IMMO" || role === "SUB_SUPPLIER";
};

/**
 * Determines the specific supplier service type (immo, mode, connect, or default).
 * Centralizes the logic to avoid duplicated checks across the app.
 */
export const getSupplierType = (userData: any): "immo" | "mode" | "connect" | "saveurs" | "default" => {
  // If running in browser and user has a saved active rayon from assigned rayons, respect it
  if (typeof window !== "undefined") {
    const active = localStorage.getItem("activeSupplierRayon");
    if (active && (active === "immo" || active === "mode" || active === "connect" || active === "saveurs")) {
      const assigned = userData?.assignedRayons;
      if (!assigned || (Array.isArray(assigned) && assigned.includes(active))) {
        return active;
      }
    }
  }

  // If user has specific assignedRayons array, use the first one
  if (Array.isArray(userData?.assignedRayons) && userData.assignedRayons.length > 0) {
    const first = userData.assignedRayons[0];
    if (first === "immo" || first === "mode" || first === "connect" || first === "saveurs") {
      return first;
    }
  }

  // Check if role or business type is explicitly Real Estate
  const isImmo = 
    userData?.role === "SUPPLIER_IMMO" || 
    userData?.businessType === "IMMOBILIER" || 
    userData?.rayon?.type === "REAL_ESTATE" || 
    userData?.rayon === "immo";

  if (isImmo) return "immo";

  const service = userData?.serviceAttached || userData?.rayon;
  if (service === "mode" || service === "connect" || service === "saveurs") {
    return service as "mode" | "connect" | "saveurs";
  }

  // Otherwise, fallback to default
  return "default";
};
