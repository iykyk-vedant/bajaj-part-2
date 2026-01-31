'use server';

import {
  validateConsumption as validateConsumptionService,
  formatValidatedComponents,
  formatComponentConsumption
} from '@/lib/consumption-validation-service';

// Server action to validate consumption
export async function validateConsumption(analysisText: string, partCode?: string) {
  try {
    const result = await validateConsumptionService(analysisText, partCode);
    return {
      success: true,
      data: {
        validatedComponents: result.validatedComponents,
        isValid: result.isValid,
        errorMessage: result.errorMessage,
        formattedComponents: formatValidatedComponents(result.validatedComponents),
        componentConsumption: formatComponentConsumption(result.validatedComponents)
      }
    };
  } catch (error) {
    console.error('Error validating consumption:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to validate BOM components
export async function validateBomComponents(analysisText: string, partCode?: string) {
  try {
    const result = await validateConsumptionService(analysisText, partCode);
    return {
      success: true,
      data: {
        validatedComponents: result.validatedComponents,
        isValid: result.isValid,
        errorMessage: result.errorMessage,
        formattedComponents: formatValidatedComponents(result.validatedComponents),
        componentConsumption: formatComponentConsumption(result.validatedComponents)
      }
    };
  } catch (error) {
    console.error('Error validating BOM components:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to save consumption entry
export async function saveConsumptionEntry(entry: any) {
  try {
    // Consumption entries table has been removed, so we don't save to database anymore
    console.log('Consumption entries table has been removed. Skipping database save.');
    return {
      success: true,
      data: true
    };
  } catch (error) {
    console.error('Error in saveConsumptionEntry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to get consumption entries
export async function getConsumptionEntries() {
  try {
    // Consumption entries table has been removed, so return empty array
    console.log('Consumption entries table has been removed. Returning empty array.');
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error('Error fetching consumption entries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to save consolidated data entry
export async function saveConsolidatedData(data: any, sessionDcNumber?: string, sessionPartcode?: string) {
  try {
    console.log('=== SAVE CONSOLIDATED DATA CALLED ===');
    console.log('Data received:', data);
    console.log('Session data - DC Number:', sessionDcNumber, 'Partcode:', sessionPartcode);
    
    // Don't save consumption-specific data to database for new entries
    const dataWithoutConsumption = {
      ...data,
      repairDate: data.repairDate || null,
      testing: data.testing || null,
      failure: data.failure || null,
      status: data.status || null,
      analysis: data.analysis || null,
      componentChange: data.componentChange || null,
      enggName: data.enggName || null,
      dispatchDate: data.dispatchDate || null,
      rfObservation: data.rfObservation || null,
      validationResult: data.validationResult || null
    };
    
    console.log('Data to save:', dataWithoutConsumption);
    
    const { saveConsolidatedDataEntry } = await import('@/lib/pg-db');
    const result = await saveConsolidatedDataEntry(dataWithoutConsumption, sessionDcNumber, sessionPartcode);
    
    console.log('Database save result:', result);
    
    if (result === true) {
      return {
        success: true,
        data: true
      };
    } else {
      return {
        success: false,
        error: 'Failed to save data to database'
      };
    }

  } catch (error) {
    console.error('Error saving consolidated data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to get consolidated data entries
export async function getConsolidatedDataEntries() {
  try {
    const { getAllConsolidatedDataEntries } = await import('@/lib/pg-db');
    const entries = await getAllConsolidatedDataEntries();
    return {
      success: true,
      data: entries
    };
  } catch (error) {
    console.error('Error fetching consolidated data entries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to search consolidated data entries by product serial number
export async function searchConsolidatedDataEntries(dcNo?: string, partCode?: string, productSrNo?: string) {
  try {
    const { searchConsolidatedDataEntries: searchFunction } = await import('@/lib/pg-db');
    const entries = await searchFunction(dcNo, partCode, productSrNo);
    return {
      success: true,
      data: entries
    };
  } catch (error) {
    console.error('Error searching consolidated data entries:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to search consolidated data entries by PCB serial number
export async function searchConsolidatedDataEntriesByPcb(dcNo?: string, partCode?: string, pcbSrNo?: string) {
  try {
    const { searchConsolidatedDataEntriesByPcb: searchFunction } = await import('@/lib/pg-db');
    const entries = await searchFunction(dcNo, partCode, pcbSrNo);
    return {
      success: true,
      data: entries
    };
  } catch (error) {
    console.error('Error searching consolidated data entries by PCB:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to update consolidated data entry
export async function updateConsolidatedDataEntryAction(id: string, entry: any) {
  try {
    const { updateConsolidatedDataEntry } = await import('@/lib/pg-db');
    // Pass entry directly as pg-db expects camelCase keys
    const result = await updateConsolidatedDataEntry(id.toString(), entry);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error updating consolidated data entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to find consolidated data entry by product_sr_no
export async function findConsolidatedDataEntryByProductSrNoAction(productSrNo: string) {
  try {
    const { findConsolidatedDataEntryByProductSrNo } = await import('@/lib/pg-db');
    const entry = await findConsolidatedDataEntryByProductSrNo(productSrNo);
    return {
      success: true,
      data: entry
    };
  } catch (error) {
    console.error('Error finding consolidated data entry by product_sr_no:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to update consolidated data entry by product_sr_no
export async function updateConsolidatedDataEntryByProductSrNoAction(productSrNo: string, entry: any) {
  try {
    console.log('Server action called with productSrNo:', productSrNo);
    console.log('Server action entry data:', entry);

    const { updateConsolidatedDataEntryByProductSrNo } = await import('@/lib/pg-db');
    // Pass entry directly as pg-db expects camelCase keys
    const result = await updateConsolidatedDataEntryByProductSrNo(productSrNo, entry);
    return {
      success: result,
      data: result
    };
  } catch (error) {
    console.error('Error updating consolidated data entry by product_sr_no:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to get consolidated data entries by DC number
export async function getConsolidatedDataEntriesByDcNoAction(dcNo: string) {
  try {
    const { getConsolidatedDataEntriesByDcNo } = await import('@/lib/pg-db');
    const entries = await getConsolidatedDataEntriesByDcNo(dcNo);
    return {
      success: true,
      data: entries
    };
  } catch (error) {
    console.error('Error getting consolidated data entries by DC number:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to get the next SR No for a given Partcode
export async function getNextSrNoForPartcodeAction(partcode: string) {
  try {
    console.log('getNextSrNoForPartcodeAction called with Partcode:', partcode);
    const { getNextSrNoForPartcode } = await import('@/lib/pg-db');
    const nextSrNo = await getNextSrNoForPartcode(partcode);
    console.log('getNextSrNoForPartcodeAction returning:', nextSrNo);
    return {
      success: true,
      data: nextSrNo
    };
  } catch (error) {
    console.error('Error getting next SR No for Partcode:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to delete consolidated data entry
export async function deleteConsolidatedDataEntryAction(id: string) {
  try {
    const { deleteConsolidatedDataEntry } = await import('@/lib/pg-db');
    const result = await deleteConsolidatedDataEntry(id);
    return {
      success: result,
      data: result
    };
  } catch (error) {
    console.error('Error deleting consolidated data entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}