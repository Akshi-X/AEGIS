
'use server';

import { suggestQuestionTags } from '@/ai/flows/suggest-question-tags';
import { suggestFullQuestion, SuggestFullQuestionOutput } from '@/ai/flows/suggest-full-question';
import { z } from 'zod';
import { getAdminsCollection, getAdminLogsCollection, getExamsCollection, getPcsCollection, getQuestionsCollection, getStudentsCollection } from './mongodb';
import { revalidatePath } from 'next/cache';
import { WithId, Document, ObjectId } from 'mongodb';
import type { Question, Student, PC, Exam, Admin, AdminLog } from './types';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const questionSchema = z.object({
  questionText: z.string().min(10, {
    message: "Question text must be at least 10 characters.",
  }),
  options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2, "At least two options are required."),
  correctOptions: z.array(z.coerce.number()).min(1, "At least one correct option must be selected."),
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

type FullQuestionSuggestionState = {
    message: string;
    suggestion?: SuggestFullQuestionOutput;
    errors?: {
        topic?: string[];
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


export async function getAiSuggestions(input: {questionText: string}): Promise<FormState> {
  const validatedFields = z.object({ questionText: z.string() }).safeParse(input);

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

export async function getAiFullQuestionSuggestion(input: { topic: string }): Promise<FullQuestionSuggestionState> {
    const validatedFields = z.object({ topic: z.string().min(3, "Topic must be at least 3 characters.") }).safeParse(input);

    if (!validatedFields.success) {
        return {
            message: 'Invalid topic.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const result = await suggestFullQuestion({ topic: validatedFields.data.topic });
        return {
            message: 'success',
            suggestion: result,
        };
    } catch (error) {
        console.error(error);
        return {
            message: 'Failed to get AI suggestion. Please try again later.',
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

    const { questionText, ...rest } = validatedFields.data;

    try {
        const questionsCollection = await getQuestionsCollection();
        const questionData = {
            text: questionText,
            ...rest
        };
        await questionsCollection.insertOne(questionData);
        await logAdminAction('Created Question', { questionText: questionData.text });
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
    const pcsCollection = await getPcsCollection();
    const pcs = await pcsCollection.aggregate([
        {
            $lookup: {
                from: 'students',
                let: { studentId: '$assignedStudentId' },
                pipeline: [
                    { 
                        $match: { 
                            $expr: { 
                                $eq: [ 
                                    '$_id', 
                                    { 
                                        $cond: {
                                            if: { $ne: ['$$studentId', null] },
                                            then: { $toObjectId: '$$studentId' },
                                            else: null
                                        }
                                    } 
                                ] 
                            } 
                        } 
                    },
                    { $project: { name: 1, rollNumber: 1, _id: 0 } }
                ],
                as: 'assignedStudent'
            }
        },
        {
            $unwind: {
                path: '$assignedStudent',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                assignedStudentName: '$assignedStudent.name',
                assignedStudentRollNumber: '$assignedStudent.rollNumber'
            }
        },
        {
            $project: {
                assignedStudent: 0
            }
        }
    ]).sort({ name: 1 }).toArray();
    
    return pcs.map(pc => ({
        ...(pc as WithId<PC>),
        _id: pc._id.toString(),
    }));
}


export async function getQuestions(): Promise<WithId<Question>[]> {
    try {
        const questionsCollection = await getQuestionsCollection();
        const questions = await questionsCollection.find({}).toArray();
        
        // This mapping is crucial to handle both `text` and `questionText` fields
        return questions.map(q => ({
            ...(q as any),
            _id: q._id.toString(),
            text: q.text || (q as any).questionText,
        }));
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

export async function getAdminLogs(): Promise<WithId<AdminLog>[]> {
  try {
    const logs = await fetchAndMapDocuments<AdminLog>('admin_logs');
    return logs.map(log => ({...log, timestamp: new Date(log.timestamp)}));
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return [];
  }
}

// Authentication Actions

export async function authenticate(prevState: any, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    const adminsCollection = await getAdminsCollection();
    
    const admin = await adminsCollection.findOne({ username });

    if (admin && admin.password === password) {
        const adminUser = { username: admin.username, role: admin.role };
        cookies().set('auth', 'true', { path: '/' });
        cookies().set('admin_user', JSON.stringify(adminUser), { path: '/' });
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

export async function scheduleExam(data: Omit<Exam, '_id' | 'status' | 'questionIds'>) {
    const examSchema = z.object({
        title: z.string().min(1, "Title is required"),
        description: z.string().min(1, "Description is required"),
        startTime: z.date(),
        duration: z.number().min(1, "Duration must be positive"),
    });

    const validatedFields = examSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            error: 'One or more fields are invalid.',
        }
    }

    try {
        const examsCollection = await getExamsCollection();
        const newExam: Omit<Exam, '_id'> = {
            ...validatedFields.data,
            status: 'Scheduled',
            questionIds: [],
        }
        await examsCollection.insertOne(newExam);
        await logAdminAction('Scheduled Exam', { examTitle: validatedFields.data.title });
        revalidatePath('/dashboard/exams');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error scheduling exam:', error);
        return { error: 'Failed to schedule exam.' };
    }
}


export async function startExamNow(examId: string) {
    try {
        const examsCollection = await getExamsCollection();
        const exam = await examsCollection.findOne({ _id: new ObjectId(examId) });

        if (!exam) return { error: 'Exam not found.' };

        await examsCollection.updateOne(
            { _id: new ObjectId(examId) },
            { $set: { status: 'In Progress', startTime: new Date() } }
        );

        await logAdminAction('Started Exam Manually', { examTitle: exam.title });
        revalidatePath('/dashboard/exams');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error starting exam:', error);
        return { error: 'Failed to start exam.' };
    }
}

export async function deleteExam(examId: string) {
    try {
        const examsCollection = await getExamsCollection();
        const exam = await examsCollection.findOne({ _id: new ObjectId(examId) });

        if (!exam) return { error: 'Exam not found.' };

        await examsCollection.deleteOne({ _id: new ObjectId(examId) });
        await logAdminAction('Deleted Exam', { examTitle: exam.title });

        revalidatePath('/dashboard/exams');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error deleting exam:', error);
        return { error: 'Failed to delete exam.' };
    }
}


export async function assignStudentToPc(pcId: string, studentId: string | null) {
  try {
    const pcsCollection = await getPcsCollection();
    const studentsCollection = await getStudentsCollection();
    
    // If we're assigning a student
    if (studentId) {
        const studentObjectId = new ObjectId(studentId);
      // Check if this student is already assigned to another PC
      const existingAssignment = await pcsCollection.findOne({ assignedStudentId: studentId, _id: { $ne: new ObjectId(pcId) } });
      if (existingAssignment) {
        return { error: 'This student is already assigned to another PC.' };
      }
    }

    // Update the PC with the new assignment (or null to unassign)
    await pcsCollection.updateOne(
      { _id: new ObjectId(pcId) },
      { $set: { assignedStudentId: studentId } }
    );
    
    const pc = await pcsCollection.findOne({ _id: new ObjectId(pcId) });
    const student = studentId ? await studentsCollection.findOne({ _id: new ObjectId(studentId) }) : null;

    await logAdminAction('Assigned Student to PC', {
      pcName: pc?.name,
      studentName: student ? student.name : 'None'
    });

    revalidatePath('/dashboard/pcs');
    return { success: true };
  } catch (error) {
    console.error('Error assigning student to PC:', error);
    return { error: 'Failed to assign student.' };
  }
}


    
