// Utility functions for synchronizing DC numbers and Part Code mappings between pages

// Load DC numbers from database
export async function loadDcNumbersFromDb(): Promise<string[]> {
  if (typeof window === 'undefined') return [];

  try {
    // Import the server action dynamically to avoid importing it on the client
    const { getDcNumbersAction } = await import('@/app/actions/db-actions');
    const result = await getDcNumbersAction();
    
    if (result.success) {
      return result.dcNumbers || [];
    }
  } catch (e) {
    console.error('Error loading DC numbers from database:', e);
  }

  return [];
}

// Load DC-PartCode mappings from database
export async function loadDcPartCodesFromDb(): Promise<Record<string, string[]>> {
  if (typeof window === 'undefined') return {};

  try {
    // Import the server action dynamically to avoid importing it on the client
    const { getDcNumbersAction } = await import('@/app/actions/db-actions');
    const result = await getDcNumbersAction();
    
    if (result.success) {
      return result.dcPartCodes || {};
    }
  } catch (e) {
    console.error('Error loading DC-PartCode mappings from database:', e);
  }

  return {};
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