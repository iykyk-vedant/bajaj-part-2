
'use server';

import { extractData } from '@/ai/flows/extract-data-from-handwritten-form';
import { translateData } from '@/ai/flows/translate-extracted-text';
import type { ExtractDataInput, ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';
import { 
  getAllSheets, 
  createSheet, 
  updateSheetName, 
  deleteSheet, 
  addDataToSheet, 
  updateSheetData,
  clearSheetData,
  getSheetById
} from '@/lib/sheet-service';
import { Sheet } from '@/lib/sheet-service';

export type FormState = {
  data: ExtractDataOutput | null;
  error: string | null;
};

export async function extractDataFromImage(
  extractionInput: ExtractDataInput,
): Promise<FormState> {
  if (!extractionInput.photoDataUri) {
    return { data: null, error: 'No image data provided.' };
  }

  try {
    const extractedData = await extractData(extractionInput);
    return { data: extractedData, error: null };
  } catch (e) {
    console.error('Error extracting data from image:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during data extraction.';
    return { data: null, error: errorMessage };
  }
}

export async function translateExtractedData(
  data: ExtractDataOutput,
  targetLanguage: string
): Promise<FormState> {
  if (!data) {
    return { data: null, error: 'No data provided for translation.' };
  }

  try {
    const translatedData = await translateData({ data, targetLanguage });
    return { data: translatedData, error: null };
  } catch (e) {
    console.error('Error translating data:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during translation.';
    return { data: null, error: errorMessage };
  }
}

// Sheet operations
export async function getAllSheetsAction(): Promise<{ sheets: Sheet[]; error: string | null }> {
  try {
    const sheets = await getAllSheets();
    return { sheets, error: null };
  } catch (error) {
    console.error('Error fetching sheets:', error);
    return { sheets: [], error: 'Failed to load sheets from database' };
  }
}

export async function createSheetAction(sheet: Omit<Sheet, 'data'>): Promise<{ sheet: Sheet | null; error: string | null }> {
  try {
    const newSheet = await createSheet(sheet);
    return { sheet: newSheet, error: null };
  } catch (error) {
    console.error('Error creating sheet:', error);
    return { sheet: null, error: 'Failed to create sheet in database' };
  }
}

export async function updateSheetNameAction(sheetId: string, name: string): Promise<{ error: string | null }> {
  try {
    await updateSheetName(sheetId, name);
    return { error: null };
  } catch (error) {
    console.error('Error updating sheet name:', error);
    return { error: 'Failed to update sheet name in database' };
  }
}

export async function deleteSheetAction(sheetId: string): Promise<{ error: string | null }> {
  try {
    await deleteSheet(sheetId);
    return { error: null };
  } catch (error) {
    console.error('Error deleting sheet:', error);
    return { error: 'Failed to delete sheet from database' };
  }
}

export async function addDataToSheetAction(sheetId: string, data: ExtractDataOutput): Promise<{ error: string | null }> {
  try {
    await addDataToSheet(sheetId, data);
    return { error: null };
  } catch (error) {
    console.error('Error adding data to sheet:', error);
    return { error: 'Failed to add data to sheet in database' };
  }
}

export async function updateSheetDataAction(sheetId: string, data: ExtractDataOutput[]): Promise<{ error: string | null }> {
  try {
    await updateSheetData(sheetId, data);
    return { error: null };
  } catch (error) {
    console.error('Error updating sheet data:', error);
    return { error: 'Failed to update sheet data in database' };
  }
}

export async function clearSheetDataAction(sheetId: string): Promise<{ error: string | null }> {
  try {
    await clearSheetData(sheetId);
    return { error: null };
  } catch (error) {
    console.error('Error clearing sheet data:', error);
    return { error: 'Failed to clear sheet data in database' };
  }
}