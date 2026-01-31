'use server';

import fs from 'fs';
import path from 'path';

// Get the image save path from environment variable
const getImageSavePath = (): string => {
  const savePath = process.env.NEXT_PUBLIC_IMAGE_SAVE_PATH;
  
  if (!savePath) {
    throw new Error('NEXT_PUBLIC_IMAGE_SAVE_PATH environment variable is not set');
  }
  
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

// Server action to save captured image
export async function saveCapturedImageAction(dataUrl: string, source: 'camera' | 'upload' = 'camera') {
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
}