
import type { ObjectId } from 'mongodb';

export type Student = {
  _id?: string | ObjectId;
  name: string;
  rollNumber: string;
  classBatch: string;
  assignedExamId?: string | ObjectId;
};

export type PC = {
  _id?: string | ObjectId;
  name: string;
  ipAddress: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  uniqueIdentifier: string;
  assignedStudentId?: string | ObjectId;
  assignedStudentName?: string;
  assignedStudentRollNumber?: string;
};

export type Question = {
  _id?: string | ObjectId;
  text: string;
  options: { text: string }[];
  correctOptions: number[];
  category: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  weight: number;
  negativeMarking: boolean;
};

export type Exam = {
  _id?: string | ObjectId;
  title: string;
  description: string;
  startTime: Date;
  duration: number; // in minutes
  status: 'Scheduled' | 'In Progress' | 'Completed';
  questionIds: (string | ObjectId)[];
  assignedStudentIds?: (string | ObjectId)[];
};

export type Admin = {
    _id?: string | ObjectId;
    username: string;
    password: string; // In a real app, this should be a hashed password
    role: 'admin' | 'superadmin';
};

export type AdminLog = {
    _id?: string | ObjectId;
    adminUsername:string;
    action: string;
    details?: Record<string, any>;
    timestamp: Date;
}
