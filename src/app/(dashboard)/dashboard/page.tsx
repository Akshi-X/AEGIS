

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getExams, getPcs, getQuestions, getStudents } from '@/lib/actions';
import { Monitor, Users, FileQuestion, ClipboardList } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { QuestionDistributionChart } from '@/components/question-distribution-chart';

export default async function DashboardPage() {
  const students = await getStudents();
  const questions = await getQuestions();
  const pcs = await getPcs();
  const exams = await getExams();

  const activePcs = pcs.filter(pc => pc.status === 'Approved').length;
  const upcomingExams = exams.filter(exam => exam.status === 'Scheduled');

  const questionDifficultyData = [
    { level: 'Easy', count: questions.filter(q => q.category === 'Easy').length, fill: 'hsl(var(--chart-2))' },
    { level: 'Medium', count: questions.filter(q => q.category === 'Medium').length, fill: 'hsl(var(--chart-4))' },
    { level: 'Hard', count: questions.filter(q => q.category === 'Hard').length, fill: 'hsl(var(--chart-1))' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">+2 since last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
            <p className="text-xs text-muted-foreground">+10 since last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active PCs</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePcs}</div>
            <p className="text-xs text-muted-foreground">out of {pcs.length} total PCs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingExams.length}</div>
            <p className="text-xs text-muted-foreground">in the next 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
            <CardDescription>A list of exams scheduled soon.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Exam Title</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>Duration</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {upcomingExams.slice(0, 5).map(exam => (
                        <TableRow key={exam._id as string}>
                            <TableCell className="font-medium">{exam.title}</TableCell>
                            <TableCell>{format(new Date(exam.startTime), 'MMM d, yyyy, h:mm a')}</TableCell>
                            <TableCell>{exam.duration} mins</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Question Distribution</CardTitle>
            <CardDescription>Breakdown of questions by difficulty level.</CardDescription>
          </CardHeader>
          <CardContent>
             <QuestionDistributionChart data={questionDifficultyData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
