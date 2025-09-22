import type { ObjectId } from 'mongodb';

export type Student = {
  _id?: string | ObjectId;
  name: string;
  rollNumber: string;
  classBatch: string;
};

export type PC = {
  _id?: string | ObjectId;
  name: string;
  ipAddress: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  uniqueIdentifier: string;
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
};
