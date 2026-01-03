'use server';

import { 
  validateConsumption as validateConsumptionService, 
  formatValidatedComponents,
  formatComponentConsumption,
  saveConsumptionEntry as saveConsumptionEntryService,
  getConsumptionEntries as getConsumptionEntriesService
} from '@/lib/consumption-validation-service';
import { saveConsolidatedDataEntry } from '@/lib/pg-db';

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

// Server action to search consolidated data entries
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

// Server action to update consolidated data entry
export async function updateConsolidatedDataEntryAction(id: string, entry: any) {
  try {
    const { updateConsolidatedDataEntry } = await import('@/lib/pg-db');
    // Convert field names to match database column names if needed
    const entryForDb = {
      dc_date: typeof entry.dcDate === 'string' ? entry.dcDate : (typeof entry.dc_date === 'string' ? entry.dc_date : null),
      date_of_purchase: typeof entry.dateOfPurchase === 'string' ? entry.dateOfPurchase : (typeof entry.date_of_purchase === 'string' ? entry.date_of_purchase : null),
      repair_date: typeof entry.repairDate === 'string' ? entry.repairDate : (typeof entry.repair_date === 'string' ? entry.repair_date : null),
      dispatch_date: typeof entry.dispatchDate === 'string' ? entry.dispatchDate : (typeof entry.dispatch_date === 'string' ? entry.dispatch_date : null),
      sr_no: entry.srNo || entry.sr_no,
      dc_no: entry.dcNo || entry.dc_no,
      bccd_name: entry.bccdName || entry.bccd_name,
      product_description: entry.productDescription || entry.product_description,
      product_sr_no: entry.productSrNo || entry.product_sr_no,
      complaint_no: entry.complaintNo || entry.complaint_no,
      part_code: entry.partCode || entry.part_code,
      nature_of_defect: entry.natureOfDefect || entry.nature_of_defect,
      visiting_tech_name: entry.visitingTechName || entry.visiting_tech_name,
      mfg_month_year: entry.mfgMonthYear || entry.mfg_month_year,
      pcb_sr_no: entry.pcbSrNo || entry.pcb_sr_no,
      rf_observation: entry.rfObservation || entry.rf_observation,
      analysis: entry.analysis || null,
      testing: entry.testing || null,
      failure: entry.failure || null,
      status: entry.status || null,
      validation_result: entry.validationResult || entry.validation_result,
      component_change: entry.componentChange || entry.component_change,
      engg_name: entry.enggName || entry.engg_name,
    };
    const result = await updateConsolidatedDataEntry(id.toString(), entryForDb);
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