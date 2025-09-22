import type { Student, PC, Question, Exam } from './types';

export const mockStudents: Student[] = [
  { id: '1', name: 'Alice Johnson', rollNumber: 'S001', classBatch: 'Class 12A' },
  { id: '2', name: 'Bob Williams', rollNumber: 'S002', classBatch: 'Class 12B' },
  { id: '3', name: 'Charlie Brown', rollNumber: 'S003', classBatch: 'Class 11A' },
  { id: '4', name: 'Diana Miller', rollNumber: 'S004', classBatch: 'Class 12A' },
  { id: '5', name: 'Ethan Davis', rollNumber: 'S005', classBatch: 'Class 11C' },
];

export const mockPcs: PC[] = [
  { id: '1', name: 'LabPC-01', ipAddress: '192.168.1.101', status: 'Approved', uniqueIdentifier: 'pc-uuid-01' },
  { id: '2', name: 'LabPC-02', ipAddress: '192.168.1.102', status: 'Approved', uniqueIdentifier: 'pc-uuid-02' },
  { id: '3', name: 'LibraryPC-05', ipAddress: '192.168.2.55', status: 'Pending', uniqueIdentifier: 'pc-uuid-03' },
  { id: '4', name: 'LabPC-04', ipAddress: '192.168.1.104', status: 'Rejected', uniqueIdentifier: 'pc-uuid-04' },
];

export const mockQuestions: Question[] = [
  {
    id: '1',
    text: 'What is the powerhouse of the cell?',
    options: [{ text: 'Nucleus' }, { text: 'Mitochondrion' }, { text: 'Ribosome' }, { text: 'Cell Wall' }],
    correctOptions: [1],
    category: 'Easy',
    tags: ['Biology', 'Cell Biology'],
    weight: 1,
    negativeMarking: false,
  },
  {
    id: '2',
    text: 'Solve for x: $2x + 5 = 15$',
    options: [{ text: 'x = 3' }, { text: 'x = 5' }, { text: 'x = 7.5' }, { text: 'x = 10' }],
    correctOptions: [1],
    category: 'Easy',
    tags: ['Mathematics', 'Algebra'],
    weight: 2,
    negativeMarking: true,
  },
  {
    id: '3',
    text: 'Which of these are a principle of SOLID design?',
    options: [{ text: 'Single Responsibility' }, { text: 'Open/Closed' }, { text: 'Low Coupling' }, { text: 'High Cohesion' }],
    correctOptions: [0, 1],
    category: 'Medium',
    tags: ['Programming', 'Software Design'],
    weight: 5,
    negativeMarking: true,
  },
  {
    id: '4',
    text: 'Explain the significance of the Heisenberg Uncertainty Principle in quantum mechanics.',
    options: [
        {text: 'It defines the exact position of an electron.'},
        {text: 'It states that one cannot simultaneously know the exact position and momentum of a particle.'},
        {text: 'It is related to the gravitational pull of black holes.'},
        {text: 'It is a law of classical physics.'}
    ],
    correctOptions: [1],
    category: 'Hard',
    tags: ['Physics', 'Quantum Mechanics'],
    weight: 10,
    negativeMarking: false,
  },
];

export const mockExams: Exam[] = [
  { id: '1', title: 'Mid-Term Physics', description: 'Exam covering chapters 1-5.', startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), duration: 60, status: 'Scheduled' },
  { id: '2', title: 'Final Chemistry Exam', description: 'Comprehensive final exam.', startTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), duration: 120, status: 'Scheduled' },
  { id: '3', title: 'Weekly Math Quiz', description: 'Quiz on Algebra.', startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), duration: 30, status: 'Completed' },
];
