'use server';

import { 
  getAllSheets as getAllSheetsService,
  createSheet as createSheetService,
  updateSheetName as updateSheetNameService,
  deleteSheet as deleteSheetService,
  addDataToSheet as addDataToSheetService,
  updateSheetData as updateSheetDataService,
  clearSheetData as clearSheetDataService,
  getSheetById as getSheetByIdService,
  Sheet
} from '@/lib/sheet-service';

import { ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';

// Server action to get all sheets
export async function getAllSheetsAction(): Promise<{ sheets: Sheet[]; error?: string }> {
  try {
    const sheets = await getAllSheetsService();
    return { sheets };
  } catch (error) {
    console.error('Error in getAllSheetsAction:', error);
    return { sheets: [], error: 'Failed to fetch sheets' };
  }
}

// Server action to get a specific sheet by ID
export async function getSheetByIdAction(sheetId: string): Promise<{ sheet?: Sheet; error?: string }> {
  try {
    const sheet = await getSheetByIdService(sheetId);
    return { sheet: sheet || undefined };
  } catch (error) {
    console.error('Error in getSheetByIdAction:', error);
    return { error: 'Failed to fetch sheet' };
  }
}

// Server action to create a new sheet
export async function createSheetAction(sheet: Omit<Sheet, 'data'>): Promise<{ sheet?: Sheet; error?: string }> {
  try {
    const createdSheet = await createSheetService(sheet);
    return { sheet: createdSheet };
  } catch (error) {
    console.error('Error in createSheetAction:', error);
    return { error: 'Failed to create sheet' };
  }
}

// Server action to update sheet name
export async function updateSheetNameAction(sheetId: string, name: string): Promise<{ error?: string }> {
  try {
    await updateSheetNameService(sheetId, name);
    return {};
  } catch (error) {
    console.error('Error in updateSheetNameAction:', error);
    return { error: 'Failed to update sheet name' };
  }
}

// Server action to delete a sheet
export async function deleteSheetAction(sheetId: string): Promise<{ error?: string }> {
  try {
    await deleteSheetService(sheetId);
    return {};
  } catch (error) {
    console.error('Error in deleteSheetAction:', error);
    return { error: 'Failed to delete sheet' };
  }
}

// Server action to add data to a sheet
export async function addDataToSheetAction(sheetId: string, data: ExtractDataOutput): Promise<{ error?: string }> {
  try {
    await addDataToSheetService(sheetId, data);
    return {};
  } catch (error) {
    console.error('Error in addDataToSheetAction:', error);
    return { error: 'Failed to add data to sheet' };
  }
}

// Server action to update sheet data
export async function updateSheetDataAction(sheetId: string, data: ExtractDataOutput[]): Promise<{ error?: string }> {
  try {
    await updateSheetDataService(sheetId, data);
    return {};
  } catch (error) {
    console.error('Error in updateSheetDataAction:', error);
    return { error: 'Failed to update sheet data' };
  }
}

// Server action to clear sheet data
export async function clearSheetDataAction(sheetId: string): Promise<{ error?: string }> {
  try {
    await clearSheetDataService(sheetId);
    return {};
  } catch (error) {
    console.error('Error in clearSheetDataAction:', error);
    return { error: 'Failed to clear sheet data' };
  }
}