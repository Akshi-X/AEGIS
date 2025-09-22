'use server';

/**
 * @fileOverview An AI agent that suggests a full question (text, options, correct answer, and difficulty) based on a topic.
 *
 * - suggestFullQuestion - A function that suggests a full question.
 * - SuggestFullQuestionInput - The input type for the suggestFullQuestion function.
 * - SuggestFullQuestionOutput - The return type for the suggestFullQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFullQuestionInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate a question.'),
});
export type SuggestFullQuestionInput = z.infer<typeof SuggestFullQuestionInputSchema>;

const SuggestFullQuestionOutputSchema = z.object({
  questionText: z.string().describe('The suggested text for the question.'),
  options: z.array(z.object({ text: z.string() })).describe('An array of suggested multiple-choice options.'),
  correctOptions: z.array(z.number()).describe('An array containing the index of the correct option(s).'),
  difficulty: z
    .enum(['Easy', 'Medium', 'Hard'])
    .describe('Suggested difficulty level for the question.'),
});
export type SuggestFullQuestionOutput = z.infer<typeof SuggestFullQuestionOutputSchema>;

export async function suggestFullQuestion(input: SuggestFullQuestionInput): Promise<SuggestFullQuestionOutput> {
  return suggestFullQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFullQuestionPrompt',
  input: {schema: SuggestFullQuestionInputSchema},
  output: {schema: SuggestFullQuestionOutputSchema},
  prompt: `You are an AI assistant designed to create exam questions. Given a topic, generate a multiple-choice question with at least four options.
  
  Topic: {{{topic}}}

  IMPORTANT: Ensure the position of the correct answer within the 'options' array is randomized and not always in the same place.

  Your response must be a JSON object containing:
  - "questionText": The question itself.
  - "options": An array of objects, where each object has a "text" key with the option string (e.g., [{ "text": "Option A" }, ...]).
  - "correctOptions": An array containing the 0-based index of the correct answer(s).
  - "difficulty": The difficulty level, which must be one of "Easy", "Medium", or "Hard".`,
});

const suggestFullQuestionFlow = ai.defineFlow(
  {
    name: 'suggestFullQuestionFlow',
    inputSchema: SuggestFullQuestionInputSchema,
    outputSchema: SuggestFullQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
