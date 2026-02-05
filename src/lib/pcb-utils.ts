// Utility functions for PCB serial number generation

const PCB_COUNTER_KEY = 'pcb-serial-counter';

// Returns month code letter (A-L) for a given month index (0-based)
export const getMonthCode = (monthIndex: number) => {
  const codes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  return codes[monthIndex] ?? 'A';
};

// Generates PCB number using provided Part Code and an incrementing counter, always using current month and year
export const generatePcbNumber = (partCode: string, srNo?: string, mfgMonthYear?: string) => {
  if (!partCode) throw new Error('Please provide a Part Code before generating PCB number');

  // Extract the part code (first 7 characters, or pad with zeros if shorter)
  const cleanPartCode = partCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const partCodeSegment = cleanPartCode.substring(0, 7).padEnd(7, '0');

  // Determine month code and year
  let monthCode: string;
  let year: string;

  if (mfgMonthYear) {
    // Try to parse MM/YYYY or YYYY-MM
    let dateObj: Date | null = null;

    if (mfgMonthYear.includes('/')) {
      const [month, yearStr] = mfgMonthYear.split('/');
      // Create date using 1st of the month
      dateObj = new Date(parseInt(yearStr), parseInt(month) - 1, 1);
    } else if (mfgMonthYear.includes('-')) {
      // Assume YYYY-MM
      const [yearStr, month] = mfgMonthYear.split('-');
      dateObj = new Date(parseInt(yearStr), parseInt(month) - 1, 1);
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      monthCode = getMonthCode(dateObj.getMonth());
      year = String(dateObj.getFullYear()).slice(-2);
    } else {
      // Fallback to current date if parse fails
      const now = new Date();
      monthCode = getMonthCode(now.getMonth());
      year = String(now.getFullYear()).slice(-2);
    }
  } else {
    // Use current date if no mfgMonthYear provided
    const now = new Date();
    monthCode = getMonthCode(now.getMonth());
    year = String(now.getFullYear()).slice(-2);
  }

  // Use SR number if provided, otherwise use counter
  let identifier;
  if (srNo) {
    // Use the SR number as the identifier, ensuring uniqueness within Part Code
    const srNum = parseInt(srNo, 10);
    identifier = isNaN(srNum) ? '00001' : String(srNum).padStart(5, '0');  // Changed from 3 to 5 digits
  } else {
    // Counter: persist in localStorage, increment per generation
    let counter = 1;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PCB_COUNTER_KEY);
      counter = stored ? Math.min(99999, Math.max(1, parseInt(stored, 10) || 1)) : 1;  // Changed from 999 to 99999
      localStorage.setItem(PCB_COUNTER_KEY, String(Math.min(99999, counter + 1)));  // Changed from 999 to 99999
    }
    identifier = String(counter).padStart(5, '0');  // Changed from 3 to 5 digits
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

  // Determine month code and year
  let monthCode: string;
  let year: string;

  if (mfgMonthYear) {
    // Try to parse MM/YYYY or YYYY-MM
    let dateObj: Date | null = null;

    if (mfgMonthYear.includes('/')) {
      const [month, yearStr] = mfgMonthYear.split('/');
      // Create date using 1st of the month
      dateObj = new Date(parseInt(yearStr), parseInt(month) - 1, 1);
    } else if (mfgMonthYear.includes('-')) {
      // Assume YYYY-MM
      const [yearStr, month] = mfgMonthYear.split('-');
      dateObj = new Date(parseInt(yearStr), parseInt(month) - 1, 1);
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      monthCode = getMonthCode(dateObj.getMonth());
      year = String(dateObj.getFullYear()).slice(-2);
    } else {
      // Fallback to current date if parse fails
      const now = new Date();
      monthCode = getMonthCode(now.getMonth());
      year = String(now.getFullYear()).slice(-2);
    }
  } else {
    // Use current date if no mfgMonthYear provided
    const now = new Date();
    monthCode = getMonthCode(now.getMonth());
    year = String(now.getFullYear()).slice(-2);
  }

  // Use SR number if provided, otherwise use counter
  let identifier;
  if (srNo) {
    // Use the SR number as the identifier, ensuring uniqueness within Part Code
    const srNum = parseInt(srNo, 10);
    identifier = isNaN(srNum) ? '00001' : String(srNum).padStart(5, '0');  // Changed from 3 to 5 digits
  } else {
    // Get current counter without incrementing
    let counter = 1;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PCB_COUNTER_KEY);
      counter = stored ? Math.min(99999, Math.max(1, parseInt(stored, 10) || 1)) : 1;  // Changed from 999 to 99999
    }
    identifier = String(counter).padStart(5, '0');  // Changed from 3 to 5 digits
  }

  // Final format: ES + partcode + monthCode + year + identifier
  return `ES${partCodeSegment}${monthCode}${year}${identifier}`;
};