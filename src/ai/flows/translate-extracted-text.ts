// src/ai/flows/translate-extracted-text.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow to translate the extracted form data into a specified language.
 *
 * The flow takes a JSON object with the extracted data and a target language as input. It then uses an LLM to translate the
 * text content of each field in the JSON object to the target language. The translated data is then returned as the output.
 *
 * @exports `translateData` - The main function to trigger the translation flow.
 */

import {ai} from '@/ai/genkit';
import {
  ExtractDataOutputSchema,
  TranslateDataInputSchema,
  type TranslateDataInput,
  type TranslateDataOutput,
} from '@/ai/schemas/form-extraction-schemas';

// Define the main function to trigger the translation flow
export async function translateData(
  input: TranslateDataInput
): Promise<TranslateDataOutput> {
  return translateDataFlow(input);
}

// Define the prompt for the LLM
const translateDataPrompt = ai.definePrompt({
  name: 'translateDataPrompt',
  input: {schema: TranslateDataInputSchema},
  output: {schema: ExtractDataOutputSchema},
  prompt: `You are an expert translator. Your task is to translate every value of the following JSON object into {{{targetLanguage}}}.
  
  Do not translate the JSON keys (e.g., "branch", "productSrNo").
  For every key, you MUST translate all content, including all text, characters, and numbers into the script and format of the target language. This applies to all fields, including the 'others' field.
  Preserve the original JSON structure. Do not omit any fields, even if they are empty.

  JSON data to translate:
  {{{json data}}}

  Return the translated data in the same JSON format.
  `,
});

// Define the Genkit flow
const translateDataFlow = ai.defineFlow(
  {
    name: 'translateDataFlow',
    inputSchema: TranslateDataInputSchema,
    outputSchema: ExtractDataOutputSchema,
  },
  async ({data, targetLanguage}) => {
    if (!data) {
      return {};
    }
    const {output} = await translateDataPrompt({data, targetLanguage});
    return output!;
  }
);
