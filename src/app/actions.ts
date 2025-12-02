
'use server';

import { extractData } from '@/ai/flows/extract-data-from-handwritten-form';
import { translateData } from '@/ai/flows/translate-extracted-text';
import type { ExtractDataInput, ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';

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
