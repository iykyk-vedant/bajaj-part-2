'use server';

/**
 * @fileOverview This file defines a Genkit flow that improves OCR extraction accuracy using an LLM.
 *
 * It takes raw OCR output and an image as input, and returns a corrected, structured data object.
 * The file exports:
 *   - improveExtractionAccuracy - The main function to call for improving extraction accuracy.
 *   - ImproveExtractionAccuracyInput - The input type for the improveExtractionAccuracy function.
 *   - ImproveExtractionAccuracyOutput - The output type for the improveExtractionAccuracy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveExtractionAccuracyInputSchema = z.object({
  ocrText: z.string().describe('The raw text extracted from the OCR process.'),
  formDataImage: z
    .string()
    .describe(
      'The image of the form, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
  branch: z.string().optional().describe('The branch name.'),
  bccdName: z.string().optional().describe('The BCCD name.'),
  productDescription: z.string().optional().describe('The product description.'),
  productSrNo: z.string().optional().describe('The product serial number.'),
  dateOfPurchase: z.string().optional().describe('The date of purchase.'),
  complaintNo: z.string().optional().describe('The complaint number.'),
  sparePartCode: z.string().optional().describe('The spare part code.'),
  natureOfDefect: z.string().optional().describe('The nature of the defect.'),
  defect: z.string().optional().describe('The defect.'),
  visitingTechName: z.string().optional().describe('The visiting technician name.'),
  technicianName: z.string().optional().describe('The technician name.'),
});

export type ImproveExtractionAccuracyInput = z.infer<
  typeof ImproveExtractionAccuracyInputSchema
>;

const ImproveExtractionAccuracyOutputSchema = z.object({
  branch: z.string().describe('The corrected branch name.'),
  bccdName: z.string().describe('The corrected BCCD name.'),
  productDescription: z.string().describe('The corrected product description.'),
  productSrNo: z.string().describe('The corrected product serial number.'),
  dateOfPurchase: z.string().describe('The corrected date of purchase.'),
  complaintNo: z.string().describe('The corrected complaint number.'),
  sparePartCode: z.string().describe('The corrected spare part code.'),
  natureOfDefect: z.string().describe('The corrected nature of defect.'),
  defect: z.string().describe('The corrected defect.'),
  visitingTechName: z.string().describe('The corrected visiting technician name.'),
  technicianName: z.string().describe('The corrected technician name.'),
});

export type ImproveExtractionAccuracyOutput = z.infer<
  typeof ImproveExtractionAccuracyOutputSchema
>;

export async function improveExtractionAccuracy(
  input: ImproveExtractionAccuracyInput
): Promise<ImproveExtractionAccuracyOutput> {
  return improveExtractionAccuracyFlow(input);
}

const improveExtractionAccuracyPrompt = ai.definePrompt({
  name: 'improveExtractionAccuracyPrompt',
  input: {schema: ImproveExtractionAccuracyInputSchema},
  output: {schema: ImproveExtractionAccuracyOutputSchema},
  prompt: `You are an expert in correcting OCR text from handwritten forms.  
  Based on the raw OCR text and the image of the form, identify and correct any errors in the following fields.  
  Return the corrected, structured data.

Raw OCR Text: {{{ocrText}}}
Image: {{media url=formDataImage}}

Corrected Data:
{
  "branch": "{{branch}}",
  "bccdName": "{{bccdName}}",
  "productDescription": "{{productDescription}}",
  "productSrNo": "{{productSrNo}}",
  "dateOfPurchase": "{{dateOfPurchase}}",
  "complaintNo": "{{complaintNo}}",
  "sparePartCode": "{{sparePartCode}}",
  "natureOfDefect": "{{natureOfDefect}}",
  "defect": "{{defect}}",
  "visitingTechName": "{{visitingTechName}}",
  "technicianName": "{{technicianName}}"
}
`,
});

const improveExtractionAccuracyFlow = ai.defineFlow(
  {
    name: 'improveExtractionAccuracyFlow',
    inputSchema: ImproveExtractionAccuracyInputSchema,
    outputSchema: ImproveExtractionAccuracyOutputSchema,
  },
  async input => {
    const {output} = await improveExtractionAccuracyPrompt(input);
    return output!;
  }
);
