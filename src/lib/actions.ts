'use server';

import { suggestQuestionTags } from '@/ai/flows/suggest-question-tags';
import { z } from 'zod';
import { getQuestionsCollection, getStudentsCollection } from './mongodb';
import { revalidatePath } from 'next/cache';
import { WithId, Document } from 'mongodb';
import type { Question, Student } from './types';
import { redirect } from 'next/navigation';

const questionSchema = z.object({
  questionText: z.string().min(10, 'Question text must be at least 10 characters long.'),
  options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2, "At least two options are required."),
  correctOptions: z.array(z.string().or(z.number())).min(1, "At least one correct option must be selected.").transform(arr => arr.map(Number)),
  category: z.enum(['Easy', 'Medium', 'Hard']),
  tags: z.array(z.string()),
  weight: z.coerce.number().min(0),
  negativeMarking: z.boolean(),
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
  const validatedFields = z.object({ questionText: z.string() }).safeParse({
    questionText: formData.get('questionText'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid question text.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  if (validatedFields.data.questionText.length < 10) {
      return {
          message: 'Question text must be at least 10 characters.'
      }
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

export async function saveQuestion(data: unknown) {
    const validatedFields = questionSchema.safeParse(data);

    if (!validatedFields.success) {
        console.error('Validation failed', validatedFields.error.flatten().fieldErrors);
        return {
            error: 'Invalid data provided.'
        }
    }

    try {
        const questionsCollection = await getQuestionsCollection();
        await questionsCollection.insertOne(validatedFields.data);
        revalidatePath('/dashboard/questions');
        revalidatePath('/dashboard');
    } catch(e) {
        console.error(e);
        return {
            error: 'Failed to save question to the database.'
        }
    }
    redirect('/dashboard/questions');
}

export async function addStudent(data: unknown) {
  const studentSchema = z.object({
    name: z.string().min(1, "Name is required."),
    rollNumber: z.string().min(1, "Roll number is required."),
    classBatch: z.string().min(1, "Class/Batch is required."),
  });

  const validatedFields = studentSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    const studentsCollection = await getStudentsCollection();
    await studentsCollection.insertOne(validatedFields.data);
    revalidatePath('/dashboard/students');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      error: 'Failed to add student.',
    };
  }
}

// Generic function to fetch documents and map them
async function fetchAndMapDocuments<T extends Document>(collectionName: 'students' | 'pcs' | 'questions' | 'exams'): Promise<WithId<T>[]> {
  let collection;
  switch (collectionName) {
    case 'students':
      collection = await getStudentsCollection();
      break;
    case 'pcs':
      collection = await getPcsCollection();
      break;
    case 'questions':
      collection = await getQuestionsCollection();
      break;
    case 'exams':
      collection = await getExamsCollection();
      break;
    default:
      throw new Error('Invalid collection name');
  }

  const documents = await collection.find({}).toArray();
  return documents.map(doc => ({
    ...doc,
    _id: doc._id.toString(),
  })) as WithId<T>[];
}

export async function getStudents(): Promise<WithId<Student>[]> {
  return fetchAndMapDocuments<Student>('students');
}

export async function getPcs(): Promise<WithId<PC>[]> {
  return fetchAndMapDocuments<PC>('pcs');
}

export async function getQuestions(): Promise<WithId<Question>[]> {
  return fetchAndMapDocuments<Question>('questions');
}

export async function getExams(): Promise<WithId<Exam>[]> {
  const exams = await fetchAndMapDocuments<Exam>('exams');
  return exams.map(exam => ({...exam, startTime: new Date(exam.startTime) }));
}
