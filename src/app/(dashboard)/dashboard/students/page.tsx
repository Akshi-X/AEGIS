
'use client';
import { getStudents, addStudent, deleteStudent, getExams } from '@/lib/actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useTransition } from 'react';
import type { Student, Exam } from '@/lib/types';
import type { WithId } from 'mongodb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const studentSchema = z.object({
  name: z.string().min(1, "Name is required."),
  rollNumber: z.string().min(1, "Roll number is required."),
  classBatch: z.string().min(1, "Class/Batch is required."),
  examId: z.string().optional(),
});

export default function StudentsPage() {
    const [students, setStudents] = useState<WithId<Student>[]>([]);
    const [scheduledExams, setScheduledExams] = useState<WithId<Exam>[]>([]);
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const fetchStudentsAndExams = () => {
        getStudents().then(setStudents);
        getExams({ status: 'Scheduled' }).then(setScheduledExams as any);
    };

    useEffect(() => {
        fetchStudentsAndExams();
    }, []);

  const form = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      rollNumber: '',
      classBatch: '',
      examId: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof studentSchema>) => {
    const result = await addStudent(data);
    if (result?.success) {
      toast({ title: "Student Added", description: "The new student has been saved." });
      setOpen(false);
      form.reset();
      fetchStudentsAndExams();
    } else {
      toast({ title: "Error", description: result?.error || "An unknown error occurred.", variant: "destructive" });
    }
  };

  const handleDelete = (studentId: string) => {
    startTransition(async () => {
        const result = await deleteStudent(studentId);
        if (result.success) {
            toast({ title: 'Success', description: 'Student has been deleted.' });
            fetchStudentsAndExams();
        } else {
            toast({ title: 'Error', description: result.error || 'Failed to delete student.', variant: 'destructive' });
        }
    });
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>
                Add, edit, and manage all student records in the system.
                </CardDescription>
            </div>
            <div className="flex gap-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import CSV</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Import Students via CSV</DialogTitle>
                            <DialogDescription>
                                Upload a CSV file with columns: Name, RollNumber, ClassBatch. The roll number must be unique.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Input id="csv-file" type="file" accept=".csv" />
                        </div>
                        <Button type="submit">Upload and Validate</Button>
                    </DialogContent>
                </Dialog>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Student</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Student</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name="rollNumber"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Roll Number</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name="classBatch"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Class/Batch</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="examId"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Assign to Exam (Optional)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a scheduled exam" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {scheduledExams.map(exam => (
                                                    <SelectItem key={exam._id as string} value={exam._id as string}>
                                                        {exam.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? 'Saving...' : 'Save Student'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Roll Number</TableHead>
              <TableHead>Class / Batch</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student._id as string}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.rollNumber}</TableCell>
                <TableCell>{student.classBatch}</TableCell>
                <TableCell className="text-right">
                   <AlertDialog>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                             <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the student record for <span className="font-bold">{student.name}</span>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(student._id.toString())} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
