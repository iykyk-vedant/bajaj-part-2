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
    let errorMessage = 'An unknown error occurred during data extraction.';
    
    if (e instanceof Error) {
      // Check if it's a service unavailable error
      if (e.message.includes('503') || e.message.includes('Service Unavailable') || e.message.includes('overloaded')) {
        errorMessage = 'The AI service is currently overloaded. Please try again in a few minutes.';
      } else if (e.message.includes('429') || e.message.includes('quota') || e.message.includes('exceeded')) {
        console.warn('Gemini API quota exceeded. Returning empty data as fallback.');
        // Return empty data as fallback when quota is exceeded
        return { data: {
          branch: '',
          bccdName: '',
          productDescription: '',
          sparePartCode: '',
          productSrNo: '',
          dateOfPurchase: '',
          complaintNo: '',
          natureOfDefect: '',
          technicianName: '',
          others: '',
        }, error: null };
      } else {
        errorMessage = e.message;
      }
    }
    
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
    let errorMessage = 'An unknown error occurred during translation.';
    
    if (e instanceof Error) {
      // Check if it's a service unavailable error
      if (e.message.includes('503') || e.message.includes('Service Unavailable') || e.message.includes('overloaded')) {
        errorMessage = 'The translation service is currently overloaded. Please try again in a few minutes.';
      } else {
        errorMessage = e.message;
      }
    }
    
    return { data: null, error: errorMessage };
  }
}