'use server';

import { 
  validateConsumption as validateConsumptionService, 
  formatValidatedComponents,
  saveConsumptionEntry as saveConsumptionEntryService,
  getConsumptionEntries as getConsumptionEntriesService
} from '@/lib/consumption-validation-service';

// Server action to validate consumption
export async function validateConsumption(analysisText: string) {
  try {
    const result = await validateConsumptionService(analysisText);
    return {
      success: true,
      data: {
        validatedComponents: result.validatedComponents,
        isValid: result.isValid,
        errorMessage: result.errorMessage,
        formattedComponents: formatValidatedComponents(result.validatedComponents)
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