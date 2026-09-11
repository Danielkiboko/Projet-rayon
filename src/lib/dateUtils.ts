/**
 * Centralized date and financial aggregation utilities.
 */

export interface GroupedRevenuePoint {
  name: string;
  total: number;
}

/**
 * Groups a list of payments/orders by day (fr-FR short date) for chart display.
 */
export const groupPaymentsByDate = (payments: any[]): GroupedRevenuePoint[] => {
  if (!Array.isArray(payments) || payments.length === 0) return [];
  
  const result: Record<string, number> = {};
  
  payments.forEach((payment) => {
    if (!payment) return;
    const ts = payment.createdAt;
    if (!ts) return;
    
    const seconds = ts.seconds ?? ts._seconds;
    const dateObj = seconds ? new Date(seconds * 1000) : (ts instanceof Date ? ts : null);
    if (!dateObj || isNaN(dateObj.getTime())) return;
    
    const dateStr = dateObj.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    if (!result[dateStr]) result[dateStr] = 0;
    result[dateStr] += Number(payment.amount || payment.myTotal || 0);
  });

  return Object.keys(result)
    .map((key) => ({
      name: key,
      total: result[key],
    }))
    .reverse();
};
