'use server';

import fs from 'fs';
import path from 'path';

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
        return {
          data: {
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
          }, error: null
        };
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

// Get the image save path from environment variable
const getImageSavePath = (): string => {
  const savePath = process.env.NEXT_PUBLIC_IMAGE_SAVE_PATH || 'public/uploads';

  // Ensure the directory exists
  if (!fs.existsSync(savePath)) {
    fs.mkdirSync(savePath, { recursive: true });
  }

  return savePath;
};

// Generate a unique filename with timestamp
const generateFileName = (prefix: string = 'photo'): string => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-mm-ss
  return `${prefix}_${timestamp}.jpg`;
};

// Save base64 data URL to file
const saveImageToFile = async (dataUrl: string, fileName: string): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    // Validate data URL format
    if (!dataUrl.startsWith('data:image/')) {
      return { success: false, error: 'Invalid image data URL format' };
    }

    // Extract base64 data
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');

    // Validate base64 data
    if (!base64Data) {
      return { success: false, error: 'No image data found in data URL' };
    }

    // Get save path and create full file path
    const savePath = getImageSavePath();
    const filePath = path.join(savePath, fileName);

    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, imageBuffer);

    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred while saving image'
    };
  }
};

// Save image and return result with metadata
export const saveCapturedImage = async (dataUrl: string, source: 'camera' | 'upload' = 'camera'): Promise<{
  success: boolean;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  timestamp?: string;
  source?: string;
  error?: string;
}> => {
  try {
    const prefix = source === 'camera' ? 'camera_photo' : 'uploaded_photo';
    const fileName = generateFileName(prefix);
    const timestamp = new Date().toISOString();

    const saveResult = await saveImageToFile(dataUrl, fileName);

    if (saveResult.success && saveResult.filePath) {
      // Get file stats for size information
      const stats = fs.statSync(saveResult.filePath);

      return {
        success: true,
        fileName,
        filePath: saveResult.filePath,
        fileSize: stats.size,
        timestamp,
        source
      };
    } else {
      return {
        success: false,
        error: saveResult.error || 'Failed to save image'
      };
    }
  } catch (error) {
    console.error('Error in saveCapturedImage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};