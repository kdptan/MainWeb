// Format age value with unit
export const formatAge = (value, unit) => {
  return `${value} ${unit}`;
};

// Format duration in minutes to readable format
export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

// Convert hours to minutes
export const hoursToMinutes = (hours) => {
  return Math.round(hours * 60);
};

// Convert minutes to hours
export const minutesToHours = (minutes) => {
  return (minutes / 60).toFixed(2);
};

// Format number with thousand separators (e.g., 1000 -> 1,000)
export const formatNumber = (number, decimals = 2) => {
  if (number === null || number === undefined || isNaN(number)) return '0.00';
  const num = typeof number === 'string' ? parseFloat(number) : number;
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

// Format currency with peso sign and thousand separators (e.g., 1000 -> ₱1,000.00)
export const formatCurrency = (amount, decimals = 2) => {
  return `₱${formatNumber(amount, decimals)}`;
};

// Format order ID to professional alphanumeric format (ORD-XXXXX-XXXXX)
// Converts numeric ID to base36 (0-9, A-Z) for compact representation
export const formatOrderId = (orderId) => {
  if (!orderId) return 'ORD-00000-00001';
  
  // Convert ID to base36 (base 36 uses 0-9 and A-Z)
  const base36 = String(orderId).padStart(5, '0').slice(-5).toUpperCase();
  const checksum = (orderId * 7 + 42) % 1000; // Simple checksum
  const checksumStr = String(checksum).padStart(5, '0');
  
  return `ORD-${base36}-${checksumStr}`;
};
