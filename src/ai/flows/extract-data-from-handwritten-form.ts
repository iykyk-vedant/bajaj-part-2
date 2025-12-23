// src/ai/flows/extract-data-from-handwritten-form.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow to extract data from handwritten forms using OCR and LLM models.
 *
 * The flow takes an image of a handwritten form as input, extracts the text using OCR, and then uses an LLM to parse the extracted text
 * into a structured format. The structured data is then returned as the output of the flow.
 *
 * @exports `extractData` - The main function to trigger the data extraction flow.
 */

import {ai} from '@/ai/genkit';
import { ExtractDataInputSchema, ExtractDataOutputSchema, type ExtractDataInput, type ExtractDataOutput } from '@/ai/schemas/form-extraction-schemas';

// Define the main function to trigger the data extraction flow
export async function extractData(
  input: ExtractDataInput
): Promise<ExtractDataOutput> {
  return extractDataFlow(input);
}

// Define the prompt for the LLM
const extractDataPrompt = ai.definePrompt({
  name: 'extractDataPrompt',
  input: {schema: ExtractDataInputSchema},
  output: {schema: ExtractDataOutputSchema},
  prompt: `You are an expert data extraction specialist. Your task is to extract data from a handwritten form image.
  
  Analyze the image and extract the following fields. You must attempt to extract every field.
  - Branch
  - BCCD Name
  - Product Description
  - Spare Part Code
  - Product Sr No
  - Date of Purchase
  - Complaint No.
  - Nature of Defect
  - Technician Name
  - Others (for any text that does not fit in the above fields)

  Image: {{media url=photoDataUri}}

  Return the extracted data in JSON format.
  If a value for a field is not found, it should be left empty.
  Make sure to return a valid JSON even if some fields are missing. Missing fields should be represented as empty strings or be omitted.
  `,
});

// Define the Genkit flow
const extractDataFlow = ai.defineFlow(
  {
    name: 'extractDataFlow',
    inputSchema: ExtractDataInputSchema,
    outputSchema: ExtractDataOutputSchema,
  },
  async input => {
    try {
      const {output} = await extractDataPrompt(input);
      return output!;
    } catch (error) {
      // Re-throw the error with additional context
      if (error instanceof Error) {
        // Check if it's a service unavailable error
        if (error.message.includes('503') || error.message.includes('Service Unavailable') || error.message.includes('overloaded')) {
          throw new Error('The AI service is currently overloaded. Please try again in a few minutes.');
        }
        // Check if it's a quota exceeded error
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('exceeded')) {
          console.warn('Gemini API quota exceeded. Returning empty data as fallback.');
          // Return default empty data as a fallback
          return {
            branch: '',
            bccdName: '',
            productDescription: '',
            sparePartCode: '',
            productSrNo: '',
            dateOfPurchase: '',
            complaintNo: '',
            defect: '',
            visitingTechName: '',
            others: '',
          };
        }
        throw error;
      }
      throw new Error('An unknown error occurred during data extraction.');
    }
  }
);