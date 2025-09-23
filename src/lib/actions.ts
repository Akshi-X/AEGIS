
'use server';

import { suggestQuestionTags } from '@/ai/flows/suggest-question-tags';
import { suggestFullQuestion, SuggestFullQuestionOutput } from '@/ai/flows/suggest-full-question';
import { z } from 'zod';
import { getAdminsCollection, getAdminLogsCollection, getExamResultsCollection, getExamsCollection, getPcsCollection, getQuestionsCollection, getStudentsCollection } from './mongodb';
import { revalidatePath } from 'next/cache';
import { WithId, Document, ObjectId } from 'mongodb';
import type { Question, Student, PC, Exam, Admin, AdminLog, ExamResult } from './types';
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
    examId: z.string().optional(),
  });

  const validatedFields = studentSchema.safeParse(data);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    const studentsCollection = await getStudentsCollection();
    const { examId, ...studentData } = validatedFields.data;

    const studentToInsert: Omit<Student, "_id"> = {
        ...studentData
    };

    if (examId) {
        studentToInsert.assignedExamId = new ObjectId(examId);
    }
    
    await studentsCollection.insertOne(studentToInsert);
    
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
    const studentsCollection = await getStudentsCollection();
    const students = await studentsCollection.aggregate([
        {
            $lookup: {
                from: 'exams',
                localField: 'assignedExamId',
                foreignField: '_id',
                as: 'assignedExam'
            }
        },
        {
            $unwind: {
                path: '$assignedExam',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                examTitle: '$assignedExam.title'
            }
        },
        {
            $project: {
                assignedExam: 0
            }
        }
    ]).toArray();
    return students.map(student => {
      const { _id, assignedExamId, ...rest } = student;
      const plainStudent: any = {
        _id: _id.toString(),
        ...rest,
      };
      if (assignedExamId) {
        plainStudent.assignedExamId = assignedExamId.toString();
      }
      return plainStudent as WithId<Student>;
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

export async function deleteStudent(studentId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const studentObjectId = new ObjectId(studentId);
        const studentsCollection = await getStudentsCollection();
        const pcsCollection = await getPcsCollection();
        
        const studentToDelete = await studentsCollection.findOne({ _id: studentObjectId });
        if (!studentToDelete) {
            return { success: false, error: 'Student not found.' };
        }

        // Unassign student from any PC
        await pcsCollection.updateMany({ assignedStudentId: studentObjectId }, { $set: { assignedStudentId: null, assignedStudentName: null, assignedStudentRollNumber: null } });

        await studentsCollection.deleteOne({ _id: studentObjectId });
        await logAdminAction('Deleted Student', { studentName: studentToDelete.name, rollNumber: studentToDelete.rollNumber });
        
        revalidatePath('/dashboard/students');
        revalidatePath('/dashboard/pcs');
        revalidatePath('/dashboard/exams');
        return { success: true };
    } catch (error) {
        console.error('Error deleting student:', error);
        return { success: false, error: 'Failed to delete student.' };
    }
}


export async function getPcs(): Promise<WithId<PC>[]> {
    const pcsCollection = await getPcsCollection();
    const pcs = await pcsCollection.aggregate([
        {
            $lookup: {
                from: 'students',
                localField: 'assignedStudentId',
                foreignField: '_id',
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
    
    return pcs.map(pc => {
        const { _id, assignedStudentId, assignedExamId, ...rest } = pc;
        const plainPc: any = {
          _id: _id.toString(),
          ...rest,
        };
        if (assignedStudentId) {
          plainPc.assignedStudentId = assignedStudentId.toString();
        }
        if (assignedExamId) {
          plainPc.assignedExamId = assignedExamId.toString();
        }
        return plainPc as WithId<PC>;
      });
}


export async function getQuestions(questionIds?: ObjectId[]): Promise<WithId<Question>[]> {
    try {
        const questionsCollection = await getQuestionsCollection();
        const query = questionIds ? { _id: { $in: questionIds } } : {};
        const questions = await questionsCollection.find(query).toArray();
        
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


export async function getExams(filter: { status?: 'Scheduled' | 'In Progress' | 'Completed' } = {}): Promise<WithId<Exam>[]> {
    try {
        const examsCollection = await getExamsCollection();
        const query = filter.status ? { status: filter.status } : {};
        const exams = await examsCollection.find(query).toArray();
        return exams.map(exam => {
            const plainExam: any = { ...exam, _id: exam._id.toString() };
            if (exam.startTime) {
                plainExam.startTime = exam.startTime.toISOString();
            }
            if (exam.assignedStudentIds) {
                plainExam.assignedStudentIds = exam.assignedStudentIds.map(id => id.toString());
            }
             if (exam.questionIds) {
                plainExam.questionIds = exam.questionIds.map(id => id.toString());
            }
            return plainExam as WithId<Exam>;
        });
    } catch (error) {
        console.error('Error fetching exams:', error);
        return [];
    }
}


export async function getAdmins(): Promise<WithId<Admin>[]> {
  try {
    const adminsCollection = await getAdminsCollection();
    const admins = await adminsCollection.find({}).toArray();
     return admins.map(admin => ({
        ...admin,
        _id: admin._id.toString(),
    })) as WithId<Admin>[];
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
}

export async function getAdminLogs(): Promise<WithId<AdminLog>[]> {
  try {
    const logsCollection = await getAdminLogsCollection();
    const logs = await logsCollection.find({}).sort({ timestamp: -1 }).toArray();
    return logs.map(log => ({
        ...log,
        _id: log._id.toString(),
        timestamp: new Date(log.timestamp),
    })) as WithId<AdminLog>[];
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
        return { message: "PC name must be at least 3 characters.", status: "error", pcIdentifier: null };
    }

    try {
        const pcsCollection = await getPcsCollection();
        const uniqueIdentifier = `pc-id-${generateRandomString(8)}`;
        
        const newPc: Omit<PC, '_id'> = {
            name: pcName,
            ipAddress: 'N/A', // IP address can be captured later
            status: 'Pending',
            uniqueIdentifier: uniqueIdentifier
        };

        await pcsCollection.insertOne(newPc);
        revalidatePath('/dashboard/pcs');

        return { message: "Your PC registration request has been submitted.", status: "pending", pcIdentifier: uniqueIdentifier };
    } catch (error) {
        console.error('PC Registration Error:', error);
        return { message: "An error occurred while registering your PC. Please try again.", status: "error", pcIdentifier: null };
    }
}


export async function getPcStatus(identifier: string) {
    try {
        const pcsCollection = await getPcsCollection();
        const pc = await pcsCollection.findOne({ uniqueIdentifier: identifier });

        if (!pc) {
            return { status: null, pcDetails: null };
        }

        let pcDetails: any = { 
            ...pc, 
            _id: pc._id.toString(),
            assignedStudentId: pc.assignedStudentId?.toString() || null,
        };
        
        let examIdToLookup: ObjectId | string | undefined;

        if (pc.assignedStudentId) {
            const studentsCollection = await getStudentsCollection();
            const student = await studentsCollection.findOne({ _id: pc.assignedStudentId as ObjectId });
            
            if (student) {
                pcDetails.assignedStudentName = student.name;
                pcDetails.assignedStudentRollNumber = student.rollNumber;
                if (student.assignedExamId) {
                    examIdToLookup = student.assignedExamId;
                }
            }
        }
        
        if (!examIdToLookup && pc.assignedExamId) {
            examIdToLookup = pc.assignedExamId;
        }

        if (examIdToLookup) {
            const examsCollection = await getExamsCollection();
            const exam = await examsCollection.findOne({ _id: new ObjectId(examIdToLookup) });
            if (exam) {
                pcDetails.exam = {
                    _id: exam._id.toString(),
                    title: exam.title,
                    startTime: exam.startTime.toISOString(),
                    duration: exam.duration,
                    status: exam.status,
                };
            }
        }
        
        return { status: pc.status, pcDetails };

    } catch (error) {
        console.error('Error fetching PC status:', error);
        return { status: null, pcDetails: null };
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
        const questionsCollection = await getQuestionsCollection();
        const exam = await examsCollection.findOne({ _id: new ObjectId(examId) });

        if (!exam) return { error: 'Exam not found.' };

        // Get 10 random questions
        const randomQuestions = await questionsCollection.aggregate([
            { $sample: { size: 10 } }
        ]).toArray();

        const questionIds = randomQuestions.map(q => q._id);

        await examsCollection.updateOne(
            { _id: new ObjectId(examId) },
            { $set: { status: 'In Progress', startTime: new Date(), questionIds: questionIds } }
        );

        await logAdminAction('Started Exam Manually', { examTitle: exam.title });
        revalidatePath('/dashboard/exams');
        revalidatePath('/dashboard');
        revalidatePath('/');
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
    const pcObjectId = new ObjectId(pcId);
    
    let studentToAssign = null;
    let studentExamId: ObjectId | null = null;
    let studentObjectId: ObjectId | null = null;

    if (studentId) {
        studentObjectId = new ObjectId(studentId);
        
        const existingAssignment = await pcsCollection.findOne({ assignedStudentId: studentObjectId, _id: { $ne: pcObjectId } });
        if (existingAssignment) {
            return { error: 'This student is already assigned to another PC.' };
        }

        studentToAssign = await studentsCollection.findOne({_id: studentObjectId});
        if (studentToAssign && studentToAssign.assignedExamId) {
            studentExamId = studentToAssign.assignedExamId as ObjectId;
        }
    }

    await pcsCollection.updateOne(
      { _id: pcObjectId },
      { $set: { 
          assignedStudentId: studentObjectId,
          assignedExamId: studentExamId,
      } }
    );
    
    const pc = await pcsCollection.findOne({ _id: pcObjectId });

    await logAdminAction('Assigned Student to PC', {
      pcName: pc?.name,
      studentName: studentToAssign ? studentToAssign.name : 'None'
    });

    revalidatePath('/dashboard/pcs');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error assigning student to PC:', error);
    return { error: 'Failed to assign student.' };
  }
}


export async function getExamDetails(examId: string) {
    try {
        const examsCollection = await getExamsCollection();
        const exam = await examsCollection.findOne({ _id: new ObjectId(examId) });
        
        if (!exam || !exam.questionIds || exam.questionIds.length === 0) {
            return null;
        }

        const questions = await getQuestions(exam.questionIds as ObjectId[]);
        
        // Ensure that the exam object passed to the client is serializable
        const serializableExam = {
             ...exam,
            _id: exam._id.toString(),
            startTime: exam.startTime.toISOString(),
            questionIds: exam.questionIds.map(id => id.toString())
        };

        const serializableQuestions = questions.map(q => ({
            ...q,
            _id: q._id.toString()
        }));

        return {
            exam: serializableExam,
            questions: serializableQuestions
        };

    } catch (error) {
        console.error('Error fetching exam details:', error);
        return null;
    }
}

export async function submitExam(examId: string, studentId: string, answers: { questionId: string; selectedOption: number | null }[]) {
    try {
        const examsCollection = await getExamsCollection();
        const studentsCollection = await getStudentsCollection();
        const resultsCollection = await getExamResultsCollection();

        const exam = await examsCollection.findOne({ _id: new ObjectId(examId) });
        const student = await studentsCollection.findOne({ _id: new ObjectId(studentId) });

        if (!exam || !student) {
            throw new Error('Exam or student not found.');
        }

        const questions = await getQuestions(exam.questionIds as ObjectId[]);
        let score = 0;

        for (const question of questions) {
            const studentAnswer = answers.find(a => a.questionId === question._id.toString());
            if (studentAnswer && studentAnswer.selectedOption !== null && question.correctOptions.includes(studentAnswer.selectedOption)) {
                score += question.weight;
            } else if (studentAnswer && studentAnswer.selectedOption !== null && question.negativeMarking) {
                // Assuming negative marking deducts 1 point, can be more complex
                score -= 1;
            }
        }
        
        const result: Omit<ExamResult, '_id'> = {
            studentId: student._id,
            examId: exam._id,
            studentName: student.name,
            examTitle: exam.title,
            answers,
            score: Math.max(0, score), // Ensure score is not negative
            totalQuestions: questions.length,
            completedAt: new Date(),
        };

        const insertedResult = await resultsCollection.insertOne(result);
        
        await studentsCollection.updateOne({ _id: student._id }, { $set: { examResultId: insertedResult.insertedId }});
        // Do not mark exam as completed here, as other students might be taking it.
        // This should be handled by a separate process that checks if all assigned students have finished.

        await logAdminAction('Exam Submitted', { studentName: student.name, examTitle: exam.title, score });
        revalidatePath('/dashboard/results');
        
        return { success: true, resultId: insertedResult.insertedId.toString() };
    } catch(error) {
        console.error('Error submitting exam:', error);
        return { success: false, error: 'Failed to submit exam.' };
    }
}


export async function getExamResults(): Promise<WithId<ExamResult>[]> {
    try {
        const resultsCollection = await getExamResultsCollection();
        const results = await resultsCollection.find({}).sort({ completedAt: -1 }).toArray();

        return results.map(r => ({
            ...r,
            _id: r._id.toString(),
            studentId: r.studentId.toString(),
            examId: r.examId.toString(),
            completedAt: r.completedAt,
        })) as WithId<ExamResult>[];

    } catch (error) {
        console.error('Error fetching exam results:', error);
        return [];
    }
}

    