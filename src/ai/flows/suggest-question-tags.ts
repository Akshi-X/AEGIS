'use server';

/**
 * @fileOverview An AI agent that suggests tags for questions.
 *
 * - suggestQuestionTags - A function that suggests tags for a given question.
 * - SuggestQuestionTagsInput - The input type for the suggestQuestionTags function.
 * - SuggestQuestionTagsOutput - The return type for the suggestQuestionTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestQuestionTagsInputSchema = z.object({
  questionText: z.string().describe('The text of the question.'),
});
export type SuggestQuestionTagsInput = z.infer<typeof SuggestQuestionTagsInputSchema>;

const SuggestQuestionTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('Suggested tags for the question.'),
  difficulty: z
    .enum(['Easy', 'Medium', 'Hard'])
    .describe('Suggested difficulty level for the question.'),
});
export type SuggestQuestionTagsOutput = z.infer<typeof SuggestQuestionTagsOutputSchema>;

export async function suggestQuestionTags(input: SuggestQuestionTagsInput): Promise<SuggestQuestionTagsOutput> {
  return suggestQuestionTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestQuestionTagsPrompt',
  input: {schema: SuggestQuestionTagsInputSchema},
  output: {schema: SuggestQuestionTagsOutputSchema},
  prompt: `You are an AI assistant helping admins categorize questions for an exam. Given the question text, suggest relevant tags and a difficulty level (Easy, Medium, or Hard).

Question Text: {{{questionText}}}

Output a JSON object containing a 'tags' field (an array of strings) and a 'difficulty' field (one of "Easy", "Medium", or "Hard").`,
});

const suggestQuestionTagsFlow = ai.defineFlow(
  {
    name: 'suggestQuestionTagsFlow',
    inputSchema: SuggestQuestionTagsInputSchema,
    outputSchema: SuggestQuestionTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
