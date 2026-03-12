/**
 * Utility functions for formatting data safely
 */

/**
 * Safely format a number to fixed decimal places
 * Returns "N/A" if the value is not a valid number
 */
export function safeToFixed(value: any, decimals: number = 1): string {
  if (value === null || value === undefined) return "N/A";
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (typeof num !== 'number' || isNaN(num)) return "N/A";
  
  return num.toFixed(decimals);
}

/**
 * Safely format a trust score (0-100 scale)
 */
export function formatTrustScore(score: any): string {
  return safeToFixed(score, 1);
}

/**
 * Safely format currency amount
 */
export function formatCurrency(amount: any, currency: string = "USD", decimals: number = 2): string {
  const formatted = safeToFixed(amount, decimals);
  if (formatted === "N/A") return "$0.00";
  
  const symbol = currency === "USD" ? "$" : currency === "NGN" ? "₦" : currency;
  return `${symbol}${formatted}`;
}

/**
 * Safely get a numeric value with fallback
 */
export function safeNumber(value: any, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (typeof num !== 'number' || isNaN(num)) return fallback;
  
  return num;
}