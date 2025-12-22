// Utility functions for PCB serial number generation

const PCB_COUNTER_KEY = 'pcb-serial-counter';

// Returns month code letter (A-L) for a given month index (0-based)
export const getMonthCode = (monthIndex: number) => {
  const codes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  return codes[monthIndex] ?? 'A';
};

// Generates PCB number using provided DC No. and an incrementing counter
export const generatePcbNumber = (dcNo: string) => {
  if (!dcNo) throw new Error('Please select a DC No. before generating PCB number');

  // Strip RC prefix and non-digits
  const dcDigits = dcNo.replace(/^RC/i, '').replace(/\D/g, '');

  // Middle part: first 4 digits after RC (pad with zeros if short)
  const middle = dcDigits.slice(0, 4).padEnd(4, '0');

  // Last 4 digits of DC No.
  const last4 = dcDigits.slice(-4).padStart(4, '0');

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0'); // 01-31
  const monthCode = getMonthCode(now.getMonth()); // A-L
  const year = String(now.getFullYear()).slice(-2); // YY

  // Counter: persist in localStorage, increment per generation
  let counter = 1;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(PCB_COUNTER_KEY);
    counter = stored ? Math.min(9999, Math.max(1, parseInt(stored, 10) || 1)) : 1;
    localStorage.setItem(PCB_COUNTER_KEY, String(Math.min(9999, counter + 1)));
  }
  const counterStr = String(counter).padStart(4, '0');

  // Final format: ES + middle + last4 + day + monthCode + year + counter
  return `ES${middle}${last4}${day}${monthCode}${year}${counterStr}`;
};

// Get the PCB number that would be generated for a specific DC without incrementing the counter
export const getPcbNumberForDc = (dcNo: string) => {
  if (!dcNo) throw new Error('Please select a DC No.');

  // Strip RC prefix and non-digits
  const dcDigits = dcNo.replace(/^RC/i, '').replace(/\D/g, '');

  // Middle part: first 4 digits after RC (pad with zeros if short)
  const middle = dcDigits.slice(0, 4).padEnd(4, '0');

  // Last 4 digits of DC No.
  const last4 = dcDigits.slice(-4).padStart(4, '0');

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0'); // 01-31
  const monthCode = getMonthCode(now.getMonth()); // A-L
  const year = String(now.getFullYear()).slice(-2); // YY

  // Get current counter without incrementing
  let counter = 1;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(PCB_COUNTER_KEY);
    counter = stored ? Math.min(9999, Math.max(1, parseInt(stored, 10) || 1)) : 1;
  }
  const counterStr = String(counter).padStart(4, '0');

  // Final format: ES + middle + last4 + day + monthCode + year + counter
  return `ES${middle}${last4}${day}${monthCode}${year}${counterStr}`;
};