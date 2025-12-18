
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
  
  {{#if sparePartCode}}
  The user has pre-selected the following information. You can use this as helpful context to improve your accuracy for other fields.
  - Spare Part Code: {{{sparePartCode}}}
  - Product Description: {{{productDescription}}}
  {{/if}}

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
    const {output} = await extractDataPrompt(input);
    
    // If a spare part code was passed in from the form *before* upload,
    // let's trust that as the ground truth and overwrite whatever the AI extracted.
    // Note: This is a workaround for type checking since these properties are not in the schema
    const inputWithExtraProps = input as ExtractDataInput & { sparePartCode?: string; productDescription?: string };
    if (inputWithExtraProps.sparePartCode && output) {
      output.sparePartCode = inputWithExtraProps.sparePartCode;
    }
    if (inputWithExtraProps.productDescription && output) {
      output.productDescription = inputWithExtraProps.productDescription;
    }    return output!;
  }
);
