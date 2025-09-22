'use server';

import { suggestQuestionTags } from '@/ai/flows/suggest-question-tags';
import { z } from 'zod';

const schema = z.object({
  questionText: z.string().min(10, 'Question text must be at least 10 characters long.'),
});

type FormState = {
    message: string;
    suggestions?: {
        tags: string[];
        difficulty: 'Easy' | 'Medium' | 'Hard';
    };
    errors?: {
        questionText?: string[];
    };
}

export async function getAiSuggestions(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = schema.safeParse({
    questionText: formData.get('questionText'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid question text.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await suggestQuestionTags({ questionText: validatedFields.data.questionText });
    return {
      message: 'success',
      suggestions: result,
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'Failed to get AI suggestions. Please try again later.',
    };
  }
}
