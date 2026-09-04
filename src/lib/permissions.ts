/**
 * Checks if the user is the Super Admin.
 * Super Admin has full control over the platform.
 */
export const isSuperAdmin = (user: any, userData: any): boolean => {
  return user?.email === "danielkiboko218@gmail.com" || userData?.role === "SUPER_ADMIN";
};

/**
 * Checks if the user is a Sub Admin.
 * Sub Admin has elevated privileges but might be restricted on certain destructive actions.
 */
export const isSubAdmin = (userData: any): boolean => {
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
  return role === "SUPPLIER" || role === "SUPPLIER_IMMO";
};

/**
 * Determines the specific supplier service type (immo, mode, connect, or default).
 * Centralizes the logic to avoid duplicated checks across the app.
 */
export const getSupplierType = (userData: any): "immo" | "mode" | "connect" | "default" => {
  // First, check if there's a strong indicator for Real Estate
  const isImmo = 
    userData?.role === "SUPPLIER_IMMO" || 
    userData?.businessType === "IMMOBILIER" || 
    userData?.rayon?.type === "REAL_ESTATE" || 
    userData?.rayon === "immo";

  if (isImmo) return "immo";

  // Otherwise, fallback to the serviceAttached property, or default
  return (userData?.serviceAttached as "mode" | "connect" | "default") || "default";
};
