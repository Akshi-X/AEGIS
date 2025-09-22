export type Student = {
  id: string;
  name: string;
  rollNumber: string;
  classBatch: string;
};

export type PC = {
  id:string;
  name: string;
  ipAddress: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  uniqueIdentifier: string;
};

export type Question = {
  id: string;
  text: string;
  options: { text: string }[];
  correctOptions: number[];
  category: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  weight: number;
  negativeMarking: boolean;
};

export type Exam = {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  duration: number; // in minutes
  status: 'Scheduled' | 'In Progress' | 'Completed';
};
