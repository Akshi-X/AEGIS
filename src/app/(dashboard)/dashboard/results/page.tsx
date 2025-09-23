
import { getExamResults } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default async function ResultsPage() {
    const results = await getExamResults();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Exam Results</CardTitle>
                <CardDescription>A summary of all completed student exams.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Exam</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Date Completed</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.map(result => (
                            <TableRow key={result._id as string}>
                                <TableCell className="font-medium">{result.studentName}</TableCell>
                                <TableCell>{result.examTitle}</TableCell>
                                <TableCell>{result.score} / {result.totalQuestions}</TableCell>
                                <TableCell>{format(new Date(result.completedAt), 'MMM d, yyyy, h:mm a')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
