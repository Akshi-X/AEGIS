'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest the difficulty level (Easy/Medium/Hard) of a question using AI.
 *
 * - suggestQuestionDifficulty - A function that takes a question text as input and returns a suggested difficulty level.
 * - SuggestQuestionDifficultyInput - The input type for the suggestQuestionDifficulty function.
 * - SuggestQuestionDifficultyOutput - The return type for the suggestQuestionDifficulty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestQuestionDifficultyInputSchema = z.object({
  questionText: z.string().describe('The text of the question for which to suggest a difficulty level.'),
});
export type SuggestQuestionDifficultyInput = z.infer<
  typeof SuggestQuestionDifficultyInputSchema
>;

const SuggestQuestionDifficultyOutputSchema = z.object({
  suggestedDifficulty: z
    .enum(['Easy', 'Medium', 'Hard'])
    .describe('The AI-suggested difficulty level for the question.'),
});

export type SuggestQuestionDifficultyOutput = z.infer<
  typeof SuggestQuestionDifficultyOutputSchema
>;

export async function suggestQuestionDifficulty(
  input: SuggestQuestionDifficultyInput
): Promise<SuggestQuestionDifficultyOutput> {
  return suggestQuestionDifficultyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestQuestionDifficultyPrompt',
  input: {schema: SuggestQuestionDifficultyInputSchema},
  output: {schema: SuggestQuestionDifficultyOutputSchema},
  prompt: `You are an AI assistant designed to suggest the difficulty level of a question.

  Based on the question text provided, determine whether the question is Easy, Medium, or Hard.

  Question Text: {{{questionText}}}

  Consider these factors when determining difficulty:
  - Easy: Requires basic recall of facts or simple application of concepts.
  - Medium: Requires some analysis, interpretation, or application of concepts in a new context.
  - Hard: Requires in-depth analysis, critical thinking, or complex problem-solving skills.

  Return the difficulty level.`,
});

const suggestQuestionDifficultyFlow = ai.defineFlow(
  {
    name: 'suggestQuestionDifficultyFlow',
    inputSchema: SuggestQuestionDifficultyInputSchema,
    outputSchema: SuggestQuestionDifficultyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
