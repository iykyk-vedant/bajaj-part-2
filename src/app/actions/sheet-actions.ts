'use server';

import { 
  getAllSheets as getAllSheetsService,
  createSheet as createSheetService,
  updateSheetName as updateSheetNameService,
  deleteSheet as deleteSheetService,
  addDataToSheet as addDataToSheetService,
  updateSheetData as updateSheetDataService
} from '@/lib/sheet-service';
import { addDcNumber as addDcNumberService, getAllDcNumbers as getAllDcNumbersService } from '@/lib/db';
import { Sheet } from '@/lib/sheet-service';
import { ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';

// Server action to get all sheets
export async function getAllSheetsAction() {
  try {
    const sheets = await getAllSheetsService();
    return {
      sheets,
      error: null
    };
  } catch (error) {
    console.error('Error in getAllSheetsAction:', error);
    return {
      sheets: [],
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to create a new sheet
export async function createSheetAction(sheet: Omit<Sheet, 'data'>) {
  try {
    const createdSheet = await createSheetService(sheet);
    return {
      sheet: createdSheet,
      error: null
    };
  } catch (error) {
    console.error('Error in createSheetAction:', error);
    return {
      sheet: null,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to update sheet name
export async function updateSheetNameAction(sheetId: string, name: string) {
  try {
    await updateSheetNameService(sheetId, name);
    return {
      error: null
    };
  } catch (error) {
    console.error('Error in updateSheetNameAction:', error);
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to delete a sheet
export async function deleteSheetAction(sheetId: string) {
  try {
    await deleteSheetService(sheetId);
    return {
      error: null
    };
  } catch (error) {
    console.error('Error in deleteSheetAction:', error);
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to add data to a sheet
export async function addDataToSheetAction(sheetId: string, data: ExtractDataOutput) {
  try {
    await addDataToSheetService(sheetId, data);
    return {
      error: null
    };
  } catch (error) {
    console.error('Error in addDataToSheetAction:', error);
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to update sheet data
export async function updateSheetDataAction(sheetId: string, data: ExtractDataOutput[]) {
  try {
    await updateSheetDataService(sheetId, data);
    return {
      error: null
    };
  } catch (error) {
    console.error('Error in updateSheetDataAction:', error);
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to get all DC numbers
export async function getAllDcNumbersAction() {
  try {
    const dcNumbers = await getAllDcNumbersService();
    return {
      dcNumbers,
      error: null
    };
  } catch (error) {
    console.error('Error in getAllDcNumbersAction:', error);
    return {
      dcNumbers: [],
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

// Server action to add a DC number with part codes
export async function addDcNumberAction(dcNumber: string, partCodes: string[] = []) {
  try {
    const success = await addDcNumberService(dcNumber, partCodes);
    if (success) {
      return {
        success: true,
        error: null
      };
    } else {
      return {
        success: false,
        error: 'Failed to add DC number'
      };
    }
  } catch (error) {
    console.error('Error in addDcNumberAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}