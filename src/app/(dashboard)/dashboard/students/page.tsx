import { mockStudents } from '@/lib/data';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function StudentsPage() {
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
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Student</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Student</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="rollNumber" className="text-right">Roll Number</Label>
                                <Input id="rollNumber" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="classBatch" className="text-right">Class/Batch</Label>
                                <Input id="classBatch" className="col-span-3" />
                            </div>
                        </div>
                        <Button type="submit">Save Student</Button>
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
            {mockStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.rollNumber}</TableCell>
                <TableCell>{student.classBatch}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
