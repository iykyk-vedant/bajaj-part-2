'use server';

import { getAllDcNumbers, addDcNumber } from '@/lib/pg-db';

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
    // Check if DC number already exists
    const existingDcData = await getAllDcNumbers();
    const dcExists = existingDcData.some(item => item.dcNumber === dcNo);
    
    // Prepare part codes - if DC exists, get existing part codes and add the new one
    let partCodes: string[] = [];
    if (dcExists) {
      const existingPartCodes = existingDcData.find(item => item.dcNumber === dcNo)?.partCodes || [];
      // Add new part code if it doesn't already exist
      if (partCode && !existingPartCodes.includes(partCode)) {
        partCodes = [...existingPartCodes, partCode];
      } else {
        partCodes = existingPartCodes;
      }
    } else {
      // For new DC number, add the part code
      partCodes = partCode ? [partCode] : [];
    }
    
    // Save to database
    const result = await addDcNumber(dcNo, partCodes);
    
    if (result) {
      return { success: true, message: dcExists ? 'Part code added to existing DC number successfully' : 'DC number created successfully' };
    } else {
      return { success: false, error: 'Failed to save DC number to database' };
    }
  } catch (error) {
    console.error('Error adding DC number to database:', error);
    return { success: false, error: 'Failed to save DC number to database' };
  }
}