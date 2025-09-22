
'use server';

import { suggestQuestionTags } from '@/ai/flows/suggest-question-tags';
import { z } from 'zod';
import { getAdminsCollection, getAdminLogsCollection, getExamsCollection, getPcsCollection, getQuestionsCollection, getStudentsCollection } from './mongodb';
import { revalidatePath } from 'next/cache';
import { WithId, Document } from 'mongodb';
import type { Question, Student, PC, Exam, Admin } from './types';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

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

async function logAdminAction(action: string, details: Record<string, any> = {}) {
    try {
        const adminLogsCollection = await getAdminLogsCollection();
        const adminCookie = cookies().get('admin_user');
        const admin = adminCookie ? JSON.parse(adminCookie.value) : { username: 'System' };
        
        await adminLogsCollection.insertOne({
            adminUsername: admin.username,
            action,
            details,
            timestamp: new Date(),
        });
        revalidatePath('/dashboard/logs');
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
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
        await logAdminAction('Created Question', { questionText: validatedFields.data.questionText });
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
    await logAdminAction('Added Student', { studentName: validatedFields.data.name, rollNumber: validatedFields.data.rollNumber });
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

async function fetchAndMapDocuments<T extends Document>(collectionName: 'students' | 'pcs' | 'questions' | 'exams' | 'admins' | 'admin_logs'): Promise<WithId<T>[]> {
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
    case 'admins':
      collection = await getAdminsCollection();
      break;
    case 'admin_logs':
      collection = await getAdminLogsCollection();
      break;
    default:
      throw new Error('Invalid collection name');
  }

  const documents = await collection.find({}).sort({ timestamp: -1 }).toArray();
  return documents.map(doc => ({
    ...doc,
    _id: doc._id.toString(),
  })) as WithId<T>[];
}


export async function getStudents(): Promise<WithId<Student>[]> {
  try {
    return fetchAndMapDocuments<Student>('students');
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

export async function getPcs(): Promise<WithId<PC>[]> {
    try {
        return fetchAndMapDocuments<PC>('pcs');
    } catch (error) {
        console.error('Error fetching PCs:', error);
        return [];
    }
}

export async function getQuestions(): Promise<WithId<Question>[]> {
    try {
        return fetchAndMapDocuments<Question>('questions');
    } catch (error) {
        console.error('Error fetching questions:', error);
        return [];
    }
}

export async function getExams(): Promise<WithId<Exam>[]> {
    try {
        const exams = await fetchAndMapDocuments<Exam>('exams');
        return exams.map(exam => ({...exam, startTime: new Date(exam.startTime) }));
    } catch (error) {
        console.error('Error fetching exams:', error);
        return [];
    }
}

export async function getAdmins(): Promise<WithId<Admin>[]> {
  try {
    return fetchAndMapDocuments<Admin>('admins');
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
}

export async function getAdminLogs() {
  try {
    const logs = await fetchAndMapDocuments<any>('admin_logs');
    return logs;
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return [];
  }
}

// Authentication Actions
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

export async function authenticate(prevState: any, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const adminsCollection = await getAdminsCollection();
    const adminCount = await adminsCollection.countDocuments();

    // Special case: If no admins exist, create the first one from .env password
    if (adminCount === 0 && username === 'admin' && password === ADMIN_PASSWORD) {
        const newAdmin: Omit<Admin, '_id'> = { username: 'admin', password: ADMIN_PASSWORD, role: 'superadmin' };
        await adminsCollection.insertOne(newAdmin);
        
        const adminUser = { username: newAdmin.username, role: newAdmin.role };
        cookies().set('auth', 'true', { httpOnly: true, path: '/' });
        cookies().set('admin_user', JSON.stringify(adminUser), { httpOnly: true, path: '/' });
        await logAdminAction('Initial Admin Created');
        redirect('/dashboard');
    }

    const admin = await adminsCollection.findOne({ username });

    if (admin && admin.password === password) {
        const adminUser = { username: admin.username, role: admin.role };
        cookies().set('auth', 'true', { httpOnly: true, path: '/' });
        cookies().set('admin_user', JSON.stringify(adminUser), { httpOnly: true, path: '/' });
        await logAdminAction('Admin Logged In');
        redirect('/dashboard');
    }

    return {
        message: 'Invalid username or password.',
    };
}


export async function logout() {
  const adminCookie = cookies().get('admin_user');
  if (adminCookie) {
    await logAdminAction('Admin Logged Out');
  }
  cookies().delete('auth');
  cookies().delete('admin_user');
  redirect('/login');
}


// PC Registration
function generateRandomString(length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function registerPc(prevState: any, formData: FormData) {
    const pcName = formData.get('pcName') as string;
    
    if (!pcName || pcName.trim().length < 3) {
        return { message: "PC name must be at least 3 characters.", status: "error" };
    }

    try {
        const pcsCollection = await getPcsCollection();
        
        const newPc: Omit<PC, '_id'> = {
            name: pcName,
            ipAddress: 'N/A',
            status: 'Pending',
            uniqueIdentifier: `pc-id-${generateRandomString(8)}`
        };

        await pcsCollection.insertOne(newPc);
        revalidatePath('/dashboard/pcs');

        return { message: "Your PC registration request has been submitted.", status: "success" };
    } catch (error) {
        console.error('PC Registration Error:', error);
        return { message: "An error occurred while registering your PC. Please try again.", status: "error" };
    }
}

export async function updatePcStatus(pcId: string, status: 'Approved' | 'Rejected') {
  try {
    const pcsCollection = await getPcsCollection();
    const { ObjectId } = await import('mongodb');
    const pc = await pcsCollection.findOne({ _id: new ObjectId(pcId) });

    await pcsCollection.updateOne({ _id: new ObjectId(pcId) }, { $set: { status } });
    await logAdminAction(`PC Status Updated`, { pcName: pc?.name, newStatus: status });
    revalidatePath('/dashboard/pcs');
    return { success: true };
  } catch (error) {
    console.error('Error updating PC status:', error);
    return { error: 'Failed to update PC status.' };
  }
}

export async function deletePc(pcId: string) {
    try {
        const pcsCollection = await getPcsCollection();
        const { ObjectId } = await import('mongodb');
        const pc = await pcsCollection.findOne({ _id: new ObjectId(pcId) });

        await pcsCollection.deleteOne({ _id: new ObjectId(pcId) });
        await logAdminAction(`PC Deleted`, { pcName: pc?.name });
        revalidatePath('/dashboard/pcs');
        return { success: true };
    } catch (error) {
        console.error('Error deleting PC:', error);
        return { error: 'Failed to delete PC.' };
    }
}

export async function addAdmin(data: unknown) {
  const adminSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    role: z.enum(['admin', 'superadmin']),
  });

  const validatedFields = adminSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    const adminsCollection = await getAdminsCollection();
    const existingAdmin = await adminsCollection.findOne({ username: validatedFields.data.username });
    if (existingAdmin) {
      return { error: 'An admin with this username already exists.' };
    }

    await adminsCollection.insertOne(validatedFields.data);
    await logAdminAction('Admin Created', { newAdminUsername: validatedFields.data.username, role: validatedFields.data.role });
    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      error: 'Failed to add new admin.',
    };
  }
}

export async function deleteAdmin(adminId: string) {
    try {
        const adminCookie = cookies().get('admin_user');
        if (!adminCookie) return { error: 'Authentication required.' };
        
        const currentUser = JSON.parse(adminCookie.value);

        const { ObjectId } = await import('mongodb');
        const adminToDeleteId = new ObjectId(adminId);

        const adminsCollection = await getAdminsCollection();
        const adminToDelete = await adminsCollection.findOne({ _id: adminToDeleteId });

        if (!adminToDelete) {
            return { error: 'Admin not found.' };
        }
        
        if (adminToDelete.username === currentUser.username) {
            return { error: 'You cannot delete your own account.' };
        }

        await adminsCollection.deleteOne({ _id: adminToDeleteId });
        await logAdminAction(`Admin Deleted`, { deletedAdminUsername: adminToDelete.username });
        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (error) {
        console.error('Error deleting admin:', error);
        return { error: 'Failed to delete admin.' };
    }
}
