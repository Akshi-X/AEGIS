
'use client';
import { getPcs, updatePcStatus, deletePc, getStudents, assignStudentToPc, getPcRequests, approvePcRequest, rejectPcRequest } from '@/lib/actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, User, ChevronsUpDown, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEffect, useState, useTransition } from 'react';
import type { PC, Student } from '@/lib/types';
import type { WithId } from 'mongodb';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


export default function PCsPage() {
  const [pcs, setPcs] = useState<WithId<PC>[]>([]);
  const [pcRequests, setPcRequests] = useState<WithId<any>[]>([]);
  const [students, setStudents] = useState<WithId<Student>[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPc, setSelectedPc] = useState<WithId<PC> | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);


  const fetchPcsAndStudents = () => {
    getPcs().then(setPcs);
    getStudents().then(setStudents);
    getPcRequests().then(setPcRequests);
  };

  useEffect(() => {
    fetchPcsAndStudents();
    const interval = setInterval(fetchPcsAndStudents, 5000); // Poll every 5 seconds
    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  const handleAction = (pcId: string, action: 'approve' | 'reject' | 'delete') => {
    startTransition(async () => {
        let result;
        if (action === 'approve') {
            result = await updatePcStatus(pcId, 'Approved');
        } else if (action === 'reject') {
            result = await updatePcStatus(pcId, 'Rejected');
        } else if (action === 'delete') {
            result = await deletePc(pcId);
        }

        if(result?.success) {
            toast({ title: 'Success', description: `PC has been ${action}d.` });
            fetchPcsAndStudents();
        } else {
            toast({ title: 'Error', description: result?.error || 'An error occurred.', variant: 'destructive' });
        }
    });
  }

  const handleRequestAction = (requestId: string, action: 'approve' | 'reject') => {
    startTransition(async () => {
        let result;
        if (action === 'approve') {
            result = await approvePcRequest(requestId);
        } else {
            result = await rejectPcRequest(requestId);
        }

        if (result?.success) {
            toast({ title: 'Success', description: `PC request has been ${action}d.` });
            fetchPcsAndStudents();
        } else {
            toast({ title: 'Error', description: result?.error || `Failed to ${action} PC request.`, variant: 'destructive' });
        }
    });
  }

  const handleOpenAssignDialog = (pc: WithId<PC>) => {
    setSelectedPc(pc);
    setSelectedStudentId(pc.assignedStudentId?.toString() || null);
    setAssignDialogOpen(true);
  }

  const handleAssignStudent = () => {
    if (!selectedPc) return;

    startTransition(async () => {
      const result = await assignStudentToPc(selectedPc._id.toString(), selectedStudentId);
      if (result.success) {
        toast({ title: 'Success', description: 'Student assignment updated.' });
        fetchPcsAndStudents();
        setAssignDialogOpen(false);
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to assign student.', variant: 'destructive' });
      }
    });
  }
  
  const selectedStudentName = selectedStudentId ? students.find(s => s._id.toString() === selectedStudentId)?.name : 'Unassigned';

  return (
    <div className="flex flex-col gap-8">
    <Card>
      <CardHeader>
        <CardTitle>Pending PC Requests</CardTitle>
        <CardDescription>
          Approve or reject new PCs requesting to join the exam network.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PC Name</TableHead>
              <TableHead>Request Time</TableHead>
              <TableHead>Identifier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pcRequests.map((req) => (
              <TableRow key={req._id as string}>
                <TableCell className="font-medium">{req.name}</TableCell>
                <TableCell>{new Date(req.requestedAt).toLocaleString()}</TableCell>
                <TableCell className="font-mono text-xs">{req.uniqueIdentifier}</TableCell>
                <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleRequestAction(req._id.toString(), 'approve')} disabled={isPending}>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRequestAction(req._id.toString(), 'reject')} disabled={isPending}>
                        <XCircle className="h-5 w-5 text-red-500" />
                    </Button>
                </TableCell>
              </TableRow>
            ))}
             {pcRequests.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No pending PC requests.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader>
        <CardTitle>Approved PCs</CardTitle>
        <CardDescription>
          View, assign, and manage all approved PCs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PC Name</TableHead>
              <TableHead>Assigned Student</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Identifier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pcs.map((pc) => (
              <TableRow key={pc._id as string}>
                <TableCell className="font-medium">{pc.name}</TableCell>
                <TableCell>
                    {pc.assignedStudentName ? (
                        <div className="flex items-center gap-2">
                           <User className="h-4 w-4 text-muted-foreground" />
                           <span>{pc.assignedStudentName} ({pc.assignedStudentRollNumber})</span>
                        </div>
                    ) : (
                         pc.status === 'Approved' ? (
                            <span className="text-muted-foreground italic">Approved (Awaiting Assignment)</span>
                        ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                        )
                    )}
                </TableCell>
                <TableCell>{pc.ipAddress}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      pc.status === 'Approved'
                        ? 'default'
                        : pc.status === 'Pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className={cn(
                        pc.status === 'Approved' && 'bg-green-500/80 text-white',
                        pc.status === 'Pending' && 'bg-amber-500/80 text-white'
                    )}
                  >
                    {pc.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{pc.uniqueIdentifier}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       {pc.status === 'Approved' && (
                        <DropdownMenuItem onClick={() => handleOpenAssignDialog(pc)}>Assign Student</DropdownMenuItem>
                      )}
                      {pc.status !== 'Rejected' && (
                        <DropdownMenuItem onClick={() => handleAction(pc._id as string, 'reject')}>Reject</DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => handleAction(pc._id as string, 'delete')}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
             {pcs.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No approved PCs found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

     <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Assign Student to {selectedPc?.name}</DialogTitle>
                <DialogDescription>
                    Select a student to assign to this PC. A student can only be assigned to one PC at a time.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
               <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between">
                        {selectedStudentName}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Search students..." />
                        <CommandList>
                            <CommandEmpty>No students found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem onSelect={() => setSelectedStudentId(null)}>Unassigned</CommandItem>
                                {students.map((student) => (
                                    <CommandItem
                                        key={student._id.toString()}
                                        value={student.name}
                                        onSelect={() => {
                                            setSelectedStudentId(student._id.toString());
                                            setPopoverOpen(false);
                                        }}
                                    >
                                        {student.name} ({student.rollNumber})
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAssignStudent} disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save Assignment'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </div>
  );
}

    