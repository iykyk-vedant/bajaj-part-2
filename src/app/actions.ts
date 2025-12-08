'use server';

import { extractData } from '@/ai/flows/extract-data-from-handwritten-form';
import { translateData } from '@/ai/flows/translate-extracted-text';
import type { ExtractDataInput, ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';

export type FormState = {
  data: ExtractDataOutput | null;
  error: string | null;
};

// Add a delay function for retry attempts
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Enhanced extraction function with retry logic
async function extractDataWithRetry(
  extractionInput: ExtractDataInput,
  maxRetries: number = 3,
  retryDelay: number = 2000
): Promise<ExtractDataOutput> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await extractData(extractionInput);
      return result;
    } catch (error: any) {
      lastError = error;
      
      // If it's not a 503 error, don't retry
      if (!error.message?.includes('503 Service Unavailable') && !error.message?.includes('model is overloaded')) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw new Error(`Service temporarily unavailable after ${maxRetries} attempts. Please try again later.`);
      }
      
      // Wait before retrying
      await delay(retryDelay * attempt); // Exponential backoff
    }
  }
  
  throw lastError || new Error('Unknown error occurred during data extraction.');
}

// Enhanced translation function with retry logic
async function translateDataWithRetry(
  inputData: { data: ExtractDataOutput; targetLanguage: string },
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<ExtractDataOutput> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await translateData(inputData);
      return result;
    } catch (error: any) {
      lastError = error;
      
      // If it's not a 503 error, don't retry
      if (!error.message?.includes('503 Service Unavailable') && !error.message?.includes('model is overloaded')) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw new Error(`Translation service temporarily unavailable after ${maxRetries} attempts. Please try again later.`);
      }
      
      // Wait before retrying
      await delay(retryDelay * attempt); // Exponential backoff
    }
  }
  
  throw lastError || new Error('Unknown error occurred during translation.');
}

export async function extractDataFromImage(
  extractionInput: ExtractDataInput,
): Promise<FormState> {
  if (!extractionInput.photoDataUri) {
    return { data: null, error: 'No image data provided.' };
  }

  try {
    const extractedData = await extractDataWithRetry(extractionInput);
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
    const translatedData = await translateDataWithRetry({ data, targetLanguage });
    return { data: translatedData, error: null };
  } catch (e) {
    console.error('Error translating data:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during translation.';
    return { data: null, error: errorMessage };
  }
}