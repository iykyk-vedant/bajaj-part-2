// Utility functions for synchronizing DC numbers and Part Code mappings between pages

// Default values - empty as per requirement
const DEFAULT_DC_NUMBERS: string[] = [];
const DEFAULT_DC_PARTCODES: Record<string, string[]> = {};

// Load DC numbers from localStorage
export function loadDcNumbers(): string[] {
  if (typeof window === 'undefined') return DEFAULT_DC_NUMBERS;
  
  try {
    const stored = localStorage.getItem('dc-numbers');
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : DEFAULT_DC_NUMBERS;
    }
  } catch (e) {
    console.error('Error loading DC numbers:', e);
  }
  
  return DEFAULT_DC_NUMBERS;
}

// Load DC-PartCode mappings from localStorage
export function loadDcPartCodes(): Record<string, string[]> {
  if (typeof window === 'undefined') return DEFAULT_DC_PARTCODES;
  
  try {
    const stored = localStorage.getItem('dc-partcode-mappings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return typeof parsed === 'object' && parsed !== null ? parsed : DEFAULT_DC_PARTCODES;
    }
  } catch (e) {
    console.error('Error loading DC-PartCode mappings:', e);
  }
  
  return DEFAULT_DC_PARTCODES;
}

// Save DC numbers to localStorage
export function saveDcNumbers(dcNumbers: string[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('dc-numbers', JSON.stringify(dcNumbers));
  } catch (e) {
    console.error('Error saving DC numbers:', e);
  }
}

// Save DC-PartCode mappings to localStorage
export function saveDcPartCodes(dcPartCodes: Record<string, string[]>): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('dc-partcode-mappings', JSON.stringify(dcPartCodes));
  } catch (e) {
    console.error('Error saving DC-PartCode mappings:', e);
  }
}

// Add a new DC number with Part Code
export function addDcNumberWithPartCode(
  dcNo: string, 
  partCode: string,
  currentDcNumbers: string[],
  currentDcPartCodes: Record<string, string[]>
): { dcNumbers: string[], dcPartCodes: Record<string, string[]> } {
  // Update DC numbers
  let updatedDcNumbers = [...currentDcNumbers];
  if (dcNo && !updatedDcNumbers.includes(dcNo)) {
    updatedDcNumbers = [...updatedDcNumbers, dcNo];
  }
  
  // Update Part Code mappings
  let updatedDcPartCodes = { ...currentDcPartCodes };
  if (partCode) {
    const currentPartCodes = updatedDcPartCodes[dcNo] || [];
    
    // Only add the part code if it doesn't already exist
    if (!currentPartCodes.includes(partCode)) {
      updatedDcPartCodes = {
        ...updatedDcPartCodes,
        [dcNo]: [...currentPartCodes, partCode]
      };
    }
  }
  
  return { dcNumbers: updatedDcNumbers, dcPartCodes: updatedDcPartCodes };
}