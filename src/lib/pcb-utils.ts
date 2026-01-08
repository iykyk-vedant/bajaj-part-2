// Utility functions for PCB serial number generation

const PCB_COUNTER_KEY = 'pcb-serial-counter';

// Returns month code letter (A-L) for a given month index (0-based)
export const getMonthCode = (monthIndex: number) => {
  const codes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  return codes[monthIndex] ?? 'A';
};

// Generates PCB number using provided Part Code, mfgMonthYear, and an incrementing counter
export const generatePcbNumber = (partCode: string, srNo?: string, mfgMonthYear?: string) => {
  if (!partCode) throw new Error('Please provide a Part Code before generating PCB number');

  // Extract the part code (first 7 characters, or pad with zeros if shorter)
  const cleanPartCode = partCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const partCodeSegment = cleanPartCode.substring(0, 7).padEnd(7, '0');

  // Extract month and year from mfgMonthYear if provided, otherwise use current date
  let monthCode: string, year: string;
  if (mfgMonthYear) {
    // Parse mfgMonthYear in MM/YYYY format
    const [monthStr, yearStr] = mfgMonthYear.split('/');
    if (monthStr && yearStr && monthStr.length === 2 && yearStr.length === 4) {
      const monthNum = parseInt(monthStr, 10) - 1; // Convert to 0-based index
      if (!isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
        monthCode = getMonthCode(monthNum);
        year = yearStr.slice(-2); // Get last 2 digits of year
      } else {
        // Invalid format, fall back to current date
        const now = new Date();
        monthCode = getMonthCode(now.getMonth());
        year = String(now.getFullYear()).slice(-2);
      }
    } else {
      // Invalid format, fall back to current date
      const now = new Date();
      monthCode = getMonthCode(now.getMonth());
      year = String(now.getFullYear()).slice(-2);
    }
  } else {
    // Use current date if mfgMonthYear is not provided
    const now = new Date();
    monthCode = getMonthCode(now.getMonth());
    year = String(now.getFullYear()).slice(-2);
  }

  // Use SR number if provided, otherwise use counter
  let identifier;
  if (srNo) {
    // Use the SR number as the identifier, ensuring uniqueness within Part Code
    const srNum = parseInt(srNo, 10);
    identifier = isNaN(srNum) ? '001' : String(srNum).padStart(3, '0');
  } else {
    // Counter: persist in localStorage, increment per generation
    let counter = 1;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PCB_COUNTER_KEY);
      counter = stored ? Math.min(999, Math.max(1, parseInt(stored, 10) || 1)) : 1;
      localStorage.setItem(PCB_COUNTER_KEY, String(Math.min(999, counter + 1)));
    }
    identifier = String(counter).padStart(3, '0');
  }

  // Final format: ES + partcode + monthCode + year + identifier
  return `ES${partCodeSegment}${monthCode}${year}${identifier}`;
};

// Get the PCB number that would be generated for a specific Part Code without incrementing the counter
export const getPcbNumberForDc = (partCode: string, srNo?: string, mfgMonthYear?: string) => {
  if (!partCode) throw new Error('Please provide a Part Code.');

  // Extract the part code (first 7 characters, or pad with zeros if shorter)
  const cleanPartCode = partCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const partCodeSegment = cleanPartCode.substring(0, 7).padEnd(7, '0');

  // Extract month and year from mfgMonthYear if provided, otherwise use current date
  let monthCode: string, year: string;
  if (mfgMonthYear) {
    // Parse mfgMonthYear in MM/YYYY format
    const [monthStr, yearStr] = mfgMonthYear.split('/');
    if (monthStr && yearStr && monthStr.length === 2 && yearStr.length === 4) {
      const monthNum = parseInt(monthStr, 10) - 1; // Convert to 0-based index
      if (!isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
        monthCode = getMonthCode(monthNum);
        year = yearStr.slice(-2); // Get last 2 digits of year
      } else {
        // Invalid format, fall back to current date
        const now = new Date();
        monthCode = getMonthCode(now.getMonth());
        year = String(now.getFullYear()).slice(-2);
      }
    } else {
      // Invalid format, fall back to current date
      const now = new Date();
      monthCode = getMonthCode(now.getMonth());
      year = String(now.getFullYear()).slice(-2);
    }
  } else {
    // Use current date if mfgMonthYear is not provided
    const now = new Date();
    monthCode = getMonthCode(now.getMonth());
    year = String(now.getFullYear()).slice(-2);
  }

  // Use SR number if provided, otherwise use counter
  let identifier;
  if (srNo) {
    // Use the SR number as the identifier, ensuring uniqueness within Part Code
    const srNum = parseInt(srNo, 10);
    identifier = isNaN(srNum) ? '001' : String(srNum).padStart(3, '0');
  } else {
    // Get current counter without incrementing
    let counter = 1;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PCB_COUNTER_KEY);
      counter = stored ? Math.min(999, Math.max(1, parseInt(stored, 10) || 1)) : 1;
    }
    identifier = String(counter).padStart(3, '0');
  }

  // Final format: ES + partcode + monthCode + year + identifier
  return `ES${partCodeSegment}${monthCode}${year}${identifier}`;
};