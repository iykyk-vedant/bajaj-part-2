import { z } from 'zod';

// Define the schema for the input image
export const ExtractDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a handwritten form, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractDataInput = z.infer<typeof ExtractDataInputSchema>;

// Define the schema for the extracted data
export const ExtractDataOutputSchema = z.object({
  branch: z.string().describe('The branch name.').optional(),
  bccdName: z.string().describe('The BCCD name.').optional(),
  productDescription: z.string().describe('The product description.').optional(),
  productSrNo: z.string().describe('The product serial number.').optional(),
  dateOfPurchase: z.string().describe('The date of purchase.').optional(),
  complaintNo: z.string().describe('The complaint number.').optional(),
  sparePartCode: z.string().describe('The spare part code.').optional(),
  natureOfDefect: z.string().describe('The nature of the defect.').optional(),
  technicianName: z.string().describe('The technician name.').optional(),
  others: z.string().describe("Any other text extracted from the form that doesn't fit into the other fields.").optional(),
});
export type ExtractDataOutput = z.infer<typeof ExtractDataOutputSchema>;


// Define the schema for the translation input
export const TranslateDataInputSchema = z.object({
  data: ExtractDataOutputSchema.describe('The extracted data object to be translated.'),
  targetLanguage: z.string().describe('The target language for translation (e.g., "Marathi", "Hindi", "English").'),
});
export type TranslateDataInput = z.infer<typeof TranslateDataInputSchema>;

export type TranslateDataOutput = z.infer<typeof ExtractDataOutputSchema>;
