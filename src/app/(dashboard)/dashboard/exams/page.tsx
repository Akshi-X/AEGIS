import { mockExams } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ExamsPage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Exam Management</h1>
                <p className="text-muted-foreground">
                    Schedule, configure, and monitor all exams.
                </p>
            </div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Schedule Exam</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Schedule New Exam</DialogTitle>
                        <DialogDescription>
                            Configure the details for the new exam.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title</Label>
                            <Input id="title" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Description</Label>
                            <Textarea id="description" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="startTime" className="text-right">Start Time</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-[280px] justify-start text-left font-normal",
                                    !Date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(new Date(), "PPP HH:mm")}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" />
                                    <div className="p-2 border-t border-border">
                                        <Input type="time" />
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="duration" className="text-right">Duration (mins)</Label>
                            <Input id="duration" type="number" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="questions" className="text-right">Questions</Label>
                            <Select>
                                <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select question mode" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="auto">Auto-select (e.g. 10 Easy, 5 Medium)</SelectItem>
                                <SelectItem value="manual">Manual selection</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Schedule Exam</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockExams.map((exam) => (
                <Card key={exam.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                           <CardTitle>{exam.title}</CardTitle>
                           <Badge variant={
                               exam.status === 'Scheduled' ? 'secondary' :
                               exam.status === 'In Progress' ? 'default' : 'outline'
                            }
                            className={cn(
                                exam.status === 'In Progress' && 'bg-blue-500 text-white'
                            )}
                           >{exam.status}</Badge>
                        </div>
                        <CardDescription>{exam.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                           <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                           <span>{format(exam.startTime, 'MMM d, yyyy, h:mm a')}</span>
                        </div>
                         <div className="flex items-center gap-2">
                           <Clock className="h-4 w-4 text-muted-foreground" />
                           <span>{exam.duration} minutes</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}
