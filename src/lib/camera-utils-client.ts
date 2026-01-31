// Client-side utility functions for camera operations
// These functions don't require fs/path modules and can run in the browser

// Generate a unique filename with timestamp (client-side version)
export const generateFileName = (prefix: string = 'photo'): string => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-mm-ss
  return `${prefix}_${timestamp}.jpg`;
};

// Validate data URL format
export const isValidDataUrl = (dataUrl: string): boolean => {
  return dataUrl.startsWith('data:image/');
};

// Extract base64 data from data URL
export const extractBase64Data = (dataUrl: string): string => {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '');
};

// Convert data URL to Blob
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const base64Data = extractBase64Data(dataUrl);
  const byteString = atob(base64Data);
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: mimeString });
};