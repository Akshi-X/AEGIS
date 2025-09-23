
'use client';

import { useState, useEffect, useActionState, useTransition } from 'react';
import Link from 'next/link';
import { registerPc, getPcStatus } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, User, ClipboardList, Calendar, Clock, Loader2 } from 'lucide-react';
import { Logo } from '@/components/icons';
import type { PC } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';


type ActionState = {
  message: string;
  status: string;
  pcIdentifier: string | null;
  pcDetails?: PC & { exam?: { _id: string; title: string; startTime: string; duration: number; status: string } };
};

const initialState: ActionState = {
  message: '',
  status: '',
  pcIdentifier: null,
};


export default function Home() {
  const [state, formAction] = useActionState(registerPc, initialState);
  const [pcName, setPcName] = useState('');
  const [currentStatus, setCurrentStatus] = useState(state.status);
  const [pcIdentifier, setPcIdentifier] = useState<string | null>(state.pcIdentifier);
  const [pcDetails, setPcDetails] = useState<ActionState['pcDetails'] | undefined>(undefined);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    const savedPcIdentifier = localStorage.getItem('pcIdentifier');
    if (savedPcIdentifier) {
        setPcIdentifier(savedPcIdentifier);
        checkStatus(savedPcIdentifier);
    }
  }, []);

  useEffect(() => {
    if (state.status) {
      setCurrentStatus(state.status);
    }
    if (state.pcIdentifier) {
      setPcIdentifier(state.pcIdentifier);
      localStorage.setItem('pcIdentifier', state.pcIdentifier);
      // Immediately check status after registration
      checkStatus(state.pcIdentifier);
    }
  }, [state]);

  const checkStatus = async (identifier: string) => {
    setIsCheckingStatus(true);
    const result = await getPcStatus(identifier);
    if (result.status) {
        setCurrentStatus(result.status.toLowerCase());
    }
    if (result.pcDetails) {
        setPcDetails(result.pcDetails);
    }
    setIsCheckingStatus(false);
    return result.status;
  }

  useEffect(() => {
    if ((currentStatus === 'pending' || currentStatus === 'approved') && pcIdentifier) {
      const interval = setInterval(async () => {
        const newStatus = await checkStatus(pcIdentifier);
        if (newStatus && newStatus !== 'Pending' && newStatus !== 'Approved') {
          clearInterval(interval);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval); // Cleanup on component unmount
    }
  }, [currentStatus, pcIdentifier]);
  
  const handleTryAgain = () => {
    localStorage.removeItem('pcIdentifier');
    setCurrentStatus('');
    setPcIdentifier(null);
    setPcName(''); 
    setPcDetails(undefined);
  };

  if (pcDetails?.assignedStudentId) {
    return (
       <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                 <div className="flex justify-center mb-6">
                    <Logo className="size-12 text-primary" />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Exam Portal</CardTitle>
                        <CardDescription>Welcome! Here are your exam details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg border bg-card text-card-foreground">
                            <div className="flex items-center gap-3 mb-4">
                                <User className="h-8 w-8 text-muted-foreground" />
                                <div>
                                    <p className="font-bold text-lg">{pcDetails.assignedStudentName}</p>
                                    <p className="text-sm text-muted-foreground">{pcDetails.assignedStudentRollNumber}</p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                {pcDetails.exam ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold text-base flex items-center gap-2">
                                                <ClipboardList className="h-4 w-4" /> 
                                                {pcDetails.exam.title}
                                            </h3>
                                             <Badge variant={
                                                pcDetails.exam.status === 'Scheduled' ? 'secondary' :
                                                pcDetails.exam.status === 'In Progress' ? 'default' : 'outline'
                                            }
                                            className={
                                                pcDetails.exam.status === 'In Progress' ? 'bg-blue-500 text-white' : ''
                                            }
                                           >{pcDetails.exam.status}</Badge>
                                        </div>
                                       
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{format(new Date(pcDetails.exam.startTime), 'MMM d, yyyy, h:mm a')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>{pcDetails.exam.duration} minutes</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center">No exam assigned yet.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                         {pcDetails.exam?.status === 'In Progress' ? (
                            <Link href={`/exam/${pcDetails.exam._id}`} className="w-full">
                                <Button className="w-full">Start Exam</Button>
                            </Link>
                         ) : (
                            <p className="text-center text-xs text-muted-foreground w-full">Please wait for the exam to begin.</p>
                         )}
                         <Button variant="link" size="sm" onClick={handleTryAgain} className="text-muted-foreground">Register a different PC</Button>
                    </CardFooter>
                </Card>
            </div>
       </main>
    );
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
            <Logo className="size-12 text-primary" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Register Your PC</CardTitle>
            <CardDescription>
              Enter a name for this PC to request access to the exam network.
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent>
              {currentStatus === 'pending' && (
                <Alert variant="default" className="bg-blue-50 border border-blue-200 text-blue-800 mb-4">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    <AlertTitle>Registration Pending</AlertTitle>
                    <AlertDescription>
                        Your PC registration request has been submitted. An administrator will review your request shortly.
                    </AlertDescription>
                </Alert>
              )}
               {currentStatus === 'error' && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {state.message}
                    </AlertDescription>
                </Alert>
              )}
              {(currentStatus === 'approved' && !pcDetails?.assignedStudentId) && (
                  <Alert variant="default" className="bg-green-50 border border-green-200 text-green-800 mb-4">
                      <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                      <AlertTitle>Registration Approved!</AlertTitle>
                      <AlertDescription>
                          Your PC has been approved. Waiting for an admin to assign a student.
                      </AlertDescription>
                  </Alert>
              )}
               {currentStatus === 'rejected' && (
                  <Alert variant="destructive" className="mb-4">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Registration Rejected</AlertTitle>
                      <AlertDescription>
                          Your PC registration request was rejected. Please try again with a different name if needed.
                      </AlertDescription>
                  </Alert>
              )}
               <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="pcName">PC Name</Label>
                <Input
                  id="pcName"
                  name="pcName"
                  placeholder="e.g., Lab-PC-01"
                  required
                  value={pcName}
                  onChange={(e) => setPcName(e.target.value)}
                  disabled={!!pcIdentifier && currentStatus !== 'rejected'}
                />
              </div>
            </CardContent>
            <CardFooter>
             {currentStatus !== 'rejected' ? (
                <Button type="submit" className="w-full" disabled={!pcName || (!!pcIdentifier && currentStatus !== 'rejected')}>
                    {isCheckingStatus || (pcIdentifier && currentStatus !== 'rejected') ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {pcIdentifier && currentStatus !== 'rejected' ? 'Request Submitted' : 'Request Access'}
                </Button>
             ) : (
                <Button type="button" className="w-full" onClick={handleTryAgain}>
                    Try Again
                </Button>
             )}
            </CardFooter>
          </form>
        </Card>
         <p className="text-center text-sm text-muted-foreground mt-6">
            Are you an admin? <a href="/login" className="font-semibold text-primary hover:underline">Login here</a>
        </p>
      </div>
    </main>
  );
}
