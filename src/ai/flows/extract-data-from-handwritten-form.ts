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

// Retry utility with exponential backoff
async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Check if this is a retryable error (503 or model overload)
      const isRetryable = 
        (error.message && 
         (error.message.includes('503 Service Unavailable') || 
          error.message.includes('model is overloaded'))) ||
        (error.cause && 
         (error.cause.message?.includes('503 Service Unavailable') || 
          error.cause.message?.includes('model is overloaded')));
      
      // If not retryable, throw immediately
      if (!isRetryable) {
        throw error;
      }
      
      // Calculate delay with exponential backoff (baseDelay * 2^attempt)
      const delay = baseDelay * Math.pow(2, attempt);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay;
      const totalDelay = delay + jitter;
      
      console.log(`Attempt ${attempt + 1} failed. Retrying in ${Math.round(totalDelay)}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError!;
}

// Define the Genkit flow
const extractDataFlow = ai.defineFlow(
  {
    name: 'extractDataFlow',
    inputSchema: ExtractDataInputSchema,
    outputSchema: ExtractDataOutputSchema,
  },
  async input => {
    const {output} = await retryWithExponentialBackoff(
      () => extractDataPrompt(input),
      3, // max retries
      1000 // base delay in ms
    );
    
    // If a spare part code was passed in from the form *before* upload,
    // let's trust that as the ground truth and overwrite whatever the AI extracted.
    if (input.sparePartCode && output) {
      output.sparePartCode = input.sparePartCode;
      output.productDescription = input.productDescription || '';
    }
    
    return output!;
  }
);