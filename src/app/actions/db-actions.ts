'use server';

import { getAllDcNumbers, addDcNumber } from '@/lib/db';

// Server action to get all DC numbers
export async function getDcNumbersAction() {
  try {
    const dcData = await getAllDcNumbers();
    const dcNumbers = dcData.map(item => item.dcNumber);
    const dcPartCodes = dcData.reduce((acc, item) => {
      acc[item.dcNumber] = item.partCodes;
      return acc;
    }, {} as Record<string, string[]>);
    
    return { success: true, dcNumbers, dcPartCodes };
  } catch (error) {
    console.error('Error loading DC numbers from database:', error);
    return { success: false, error: 'Failed to load DC data' };
  }
}

// Server action to add a DC number
export async function addDcNumberAction(dcNo: string, partCode: string, currentDcNumbers: string[], currentDcPartCodes: Record<string, string[]>) {
  try {
    // Import the function here to avoid client-side import
    const { addDcNumberWithPartCode } = await import('@/lib/dc-data-sync');
    
    const { dcNumbers: updatedDcNumbers, dcPartCodes: updatedDcPartCodes } = addDcNumberWithPartCode(
      dcNo,
      partCode,
      currentDcNumbers,
      currentDcPartCodes
    );
    
    // Get the part codes for this DC number
    const partCodes = updatedDcPartCodes[dcNo] || [];
    
    // Save to database
    const result = await addDcNumber(dcNo, partCodes);
    
    if (result) {
      return { success: true, dcNumbers: updatedDcNumbers, dcPartCodes: updatedDcPartCodes };
    } else {
      return { success: false, error: 'Failed to save DC number to database' };
    }
  } catch (error) {
    console.error('Error adding DC number to database:', error);
    return { success: false, error: 'Failed to save DC number to database' };
  }
}