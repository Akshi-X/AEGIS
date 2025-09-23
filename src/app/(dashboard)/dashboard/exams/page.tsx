
'use client';

import { useEffect, useState, useTransition } from 'react';
import { getExams, scheduleExam, startExamNow, deleteExam, updateExam, endExam } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, Clock, MoreHorizontal, Edit, Ban, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { Exam } from '@/lib/types';
import type { WithId } from 'mongodb';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


export default function ExamsPage() {
  const [exams, setExams] = useState<WithId<Exam>[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState<WithId<Exam> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Add state for new exam form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [duration, setDuration] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState('');

  // Add state for edit exam form
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState<Date | undefined>();
  const [editTime, setEditTime] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editNumberOfQuestions, setEditNumberOfQuestions] = useState('');
  
  const { toast } = useToast();

  const fetchExams = async () => {
    const examsData = await getExams();
    setExams(examsData);
  }

  useEffect(() => {
    fetchExams();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(new Date());
    setTime(format(new Date(), 'HH:mm'));
    setDuration('');
    setNumberOfQuestions('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!date) {
        toast({ title: "Error", description: "Please select a start date.", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes);

    const examData = {
        title,
        description,
        startTime,
        duration: Number(duration),
        numberOfQuestions: Number(numberOfQuestions)
    };

    const result = await scheduleExam(examData);

    if (result.success) {
        toast({ title: 'Success', description: 'Exam scheduled successfully.' });
        fetchExams();
        setOpen(false);
        resetForm();
    } else {
        toast({ title: 'Error', description: result.error || 'Failed to schedule exam.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!examToEdit || !editDate) {
        toast({ title: "Error", description: "Invalid exam data.", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }
    
    const [hours, minutes] = editTime.split(':').map(Number);
    const startTime = new Date(editDate);
    startTime.setHours(hours, minutes);

    const examData = {
        id: examToEdit._id.toString(),
        title: editTitle,
        description: editDescription,
        startTime,
        duration: Number(editDuration),
        numberOfQuestions: Number(editNumberOfQuestions),
    };

    const result = await updateExam(examData);

    if (result.success) {
        toast({ title: 'Success', description: 'Exam updated successfully.' });
        fetchExams();
        setEditOpen(false);
    } else {
        toast({ title: 'Error', description: result.error || 'Failed to update exam.', variant: 'destructive' });
    }
    setIsSubmitting(false);
  }

  const handleOpenEditDialog = (exam: WithId<Exam>) => {
    setExamToEdit(exam);
    const examDate = new Date(exam.startTime);
    setEditTitle(exam.title);
    setEditDescription(exam.description);
    setEditDate(examDate);
    setEditTime(format(examDate, 'HH:mm'));
    setEditDuration(exam.duration.toString());
    setEditNumberOfQuestions(exam.numberOfQuestions.toString());
    setEditOpen(true);
  }

  const handleStartNow = (examId: string) => {
    startTransition(async () => {
        const result = await startExamNow(examId);
        if (result.success) {
            toast({ title: 'Success', description: 'Exam has been started.' });
            fetchExams();
        } else {
            toast({ title: 'Error', description: result.error || 'Failed to start exam.', variant: 'destructive' });
        }
    });
  }

    const handleEndNow = (examId: string) => {
        startTransition(async () => {
            const result = await endExam(examId);
            if (result.success) {
                toast({ title: 'Success', description: 'Exam has been ended.' });
                fetchExams();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to end exam.', variant: 'destructive' });
            }
        });
    }

  const handleDelete = (examId: string) => {
    startTransition(async () => {
        const result = await deleteExam(examId);
        if (result.success) {
            toast({ title: 'Success', description: 'Exam has been deleted.' });
            fetchExams();
        } else {
            toast({ title: 'Error', description: result.error || 'Failed to delete exam.', variant: 'destructive' });
        }
    });
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Exam Management</h1>
                <p className="text-muted-foreground">
                    Schedule, configure, and monitor all exams.
                </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Schedule Exam</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Schedule New Exam</DialogTitle>
                            <DialogDescription>
                                Configure the details for the new exam.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">Title</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" required/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="startTime" className="text-right">Start Time</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "col-span-3 justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="startTime" className="text-right sr-only">Start Time</Label>
                                <div className="col-start-2 col-span-3">
                                  <Input type="time" value={time} onChange={e => setTime(e.target.value)} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="duration" className="text-right">Duration (mins)</Label>
                                <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="col-span-3" required />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="numberOfQuestions" className="text-right">No. of Questions</Label>
                                <Input id="numberOfQuestions" type="number" value={numberOfQuestions} onChange={(e) => setNumberOfQuestions(e.target.value)} className="col-span-3" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Scheduling...' : 'Schedule Exam'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
                <Card key={exam._id as string}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                           <div>
                                <CardTitle>{exam.title}</CardTitle>
                                <CardDescription>{exam.description}</CardDescription>
                           </div>
                           <Badge variant={
                               exam.status === 'Scheduled' ? 'secondary' :
                               exam.status === 'In Progress' ? 'default' : 'outline'
                            }
                            className={cn(
                                exam.status === 'In Progress' && 'bg-blue-500 text-white'
                            )}
                           >{exam.status}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                           <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                           <span>{format(new Date(exam.startTime), 'MMM d, yyyy, h:mm a')}</span>
                        </div>
                         <div className="flex items-center gap-2">
                           <Clock className="h-4 w-4 text-muted-foreground" />
                           <span>{exam.duration} minutes</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <FileQuestion className="h-4 w-4 text-muted-foreground" />
                            <span>{exam.numberOfQuestions} questions</span>
                        </div>
                    </CardContent>
                    <div className="flex items-center p-6 pt-2">
                         <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 ml-auto" disabled={isPending}>
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                     {exam.status === 'Scheduled' && (
                                        <DropdownMenuItem onClick={() => handleStartNow(exam._id.toString())}>Start Now</DropdownMenuItem>
                                     )}
                                     {exam.status === 'In Progress' && (
                                        <DropdownMenuItem onClick={() => handleEndNow(exam._id.toString())}><Ban className="mr-2 h-4 w-4" />End Exam</DropdownMenuItem>
                                     )}
                                     {exam.status !== 'Completed' && (
                                        <DropdownMenuItem onClick={() => handleOpenEditDialog(exam)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                     )}
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the exam titled "<span className="font-bold">{exam.title}</span>".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(exam._id.toString())} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </Card>
            ))}
        </div>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-[625px]">
                <form onSubmit={handleEditSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Exam</DialogTitle>
                        <DialogDescription>
                            Update the details for the exam.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-title" className="text-right">Title</Label>
                            <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-description" className="text-right">Description</Label>
                            <Textarea id="edit-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="col-span-3" required/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-startTime" className="text-right">Start Time</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "col-span-3 justify-start text-left font-normal",
                                    !editDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {editDate ? format(editDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={editDate} onSelect={setEditDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-startTime" className="text-right sr-only">Start Time</Label>
                            <div className="col-start-2 col-span-3">
                                <Input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-duration" className="text-right">Duration (mins)</Label>
                            <Input id="edit-duration" type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-numberOfQuestions" className="text-right">No. of Questions</Label>
                            <Input id="edit-numberOfQuestions" type="number" value={editNumberOfQuestions} onChange={(e) => setEditNumberOfQuestions(e.target.value)} className="col-span-3" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    

    