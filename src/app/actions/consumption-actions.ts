'use server';

import { 
  validateConsumption as validateConsumptionService, 
  formatValidatedComponents,
  formatComponentConsumption,
  saveConsumptionEntry as saveConsumptionEntryService,
  getConsumptionEntries as getConsumptionEntriesService
} from '@/lib/consumption-validation-service';
import { saveConsolidatedDataEntry } from '@/lib/db';

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
    const result = await saveConsumptionEntryService(entry);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error saving consumption entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to get consumption entries
export async function getConsumptionEntries() {
  try {
    const entries = await getConsumptionEntriesService();
    return {
      success: true,
      data: entries
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
export async function saveConsolidatedData(data: any) {
  try {
    const result = await saveConsolidatedDataEntry(data);
    return {
      success: true,
      data: result
    };
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
    const { getAllConsolidatedDataEntries } = await import('@/lib/db');
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

// Server action to search consolidated data entries
export async function searchConsolidatedDataEntries(dcNo?: string, partCode?: string, productSrNo?: string) {
  try {
    const { searchConsolidatedDataEntries: searchFunction } = await import('@/lib/db');
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

// Server action to delete consolidated data entry
export async function deleteConsolidatedDataEntryAction(id: string) {
  try {
    const { deleteConsolidatedDataEntry } = await import('@/lib/db');
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