'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { mockExams, mockPcs, mockQuestions, mockStudents } from '@/lib/data';
import { Monitor, Users, FileQuestion, ClipboardList, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const questionDifficultyData = [
  { level: 'Easy', count: mockQuestions.filter(q => q.category === 'Easy').length, fill: 'hsl(var(--chart-2))' },
  { level: 'Medium', count: mockQuestions.filter(q => q.category === 'Medium').length, fill: 'hsl(var(--chart-4))' },
  { level: 'Hard', count: mockQuestions.filter(q => q.category === 'Hard').length, fill: 'hsl(var(--chart-1))' },
];

const chartConfig = {
  count: {
    label: "Questions",
  },
  easy: {
    label: "Easy",
    color: "hsl(var(--chart-2))",
  },
  medium: {
    label: "Medium",
    color: "hsl(var(--chart-4))",
  },
  hard: {
    label: "Hard",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const activePcs = mockPcs.filter(pc => pc.status === 'Approved').length;
  const upcomingExams = mockExams.filter(exam => exam.status === 'Scheduled');

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStudents.length}</div>
            <p className="text-xs text-muted-foreground">+2 since last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockQuestions.length}</div>
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
            <p className="text-xs text-muted-foreground">out of {mockPcs.length} total PCs</p>
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
                        <TableRow key={exam.id}>
                            <TableCell className="font-medium">{exam.title}</TableCell>
                            <TableCell>{format(exam.startTime, 'MMM d, yyyy, h:mm a')}</TableCell>
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
             <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={questionDifficultyData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="level" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
