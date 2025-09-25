'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerPc, getPcStatus, updatePcLiveStatus } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, User, ClipboardList } from 'lucide-react';
import { Logo } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import type { PC } from '@/lib/types';


type PageStatus = 'REGISTER' | 'PENDING_APPROVAL' | 'APPROVED_UNASSIGNED' | 'READY' | 'ERROR';

export default function Home() {
  const [pcIdentifier, setPcIdentifier] = useState<string | null>(null);
  const [status, setStatus] = useState<PageStatus>('REGISTER');
  const [pcDetails, setPcDetails] = useState<PC | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, startSubmitting] = useTransition();
  const [isPolling, setIsPolling] = useState(false);
  const [pcName, setPcName] = useState('');
  
  const router = useRouter();

  const fetchStatus = useCallback(async (identifier: string) => {
    if (isPolling) return;
    setIsPolling(true);
    try {
        const result = await getPcStatus(identifier);
        
        if (result.status === 'Approved' && result.pcDetails) {
            setPcDetails(result.pcDetails);
            const typedPcDetails = result.pcDetails as any;
            if (typedPcDetails.assignedStudentId && typedPcDetails.exam?.title) {
                setStatus('READY');
                 if (typedPcDetails.exam.status === 'In Progress') {
                    updatePcLiveStatus(identifier, 'Ready');
                }
            } else {
                setStatus('APPROVED_UNASSIGNED');
                updatePcLiveStatus(identifier, 'Online');
            }
        } else if (result.status === 'Pending') {
            setStatus('PENDING_APPROVAL');
        } else if (result.status === 'Rejected') {
            setErrorMessage('Your PC registration request has been rejected. Please contact an administrator.');
            setStatus('ERROR');
            localStorage.removeItem('pcIdentifier');
            setPcIdentifier(null);
        } else if (result.status === null) {
            // This case handles when an admin rejects a request, so it no longer exists.
            localStorage.removeItem('pcIdentifier');
            setPcIdentifier(null);
            setStatus('REGISTER');
            setErrorMessage('Your PC registration request was not found. It may have been rejected. Please register again or contact an admin.');
        }

    } catch (e) {
      console.error(e);
    } finally {
        setIsPolling(false);
    }
  }, [isPolling]);


  useEffect(() => {
    const storedIdentifier = localStorage.getItem('pcIdentifier');
    if (storedIdentifier) {
      setPcIdentifier(storedIdentifier);
      fetchStatus(storedIdentifier); 
    }
  }, [fetchStatus]);


  useEffect(() => {
    if (pcIdentifier && !isPolling) {
      const interval = setInterval(() => {
        fetchStatus(pcIdentifier);
      }, 5000); 
      return () => clearInterval(interval);
    }
  }, [pcIdentifier, fetchStatus, isPolling]);


  const handleRegister = async (formData: FormData) => {
    startSubmitting(async () => {
      setErrorMessage('');
      try {
        const result = await registerPc(undefined, formData);
        if (result.status === 'success' && result.identifier) {
          localStorage.setItem('pcIdentifier', result.identifier);
          setPcIdentifier(result.identifier);
          setStatus('PENDING_APPROVAL');
        } else {
          setErrorMessage(result.message || 'An unknown error occurred.');
          setStatus('ERROR');
        }
      } catch (e) {
        setErrorMessage('Failed to submit registration. Please try again.');
        setStatus('ERROR');
      }
    });
  };

  const renderContent = () => {
    switch (status) {
        case 'READY':
            const exam = (pcDetails as any)?.exam;
            return (
                <div className="w-full max-w-lg">
                    <div className="flex justify-center mb-6">
                        <Logo className="size-12 text-primary" />
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Welcome, {pcDetails!.assignedStudentName}</CardTitle>
                            <CardDescription>Your PC is approved and you are assigned to an exam. Please review the details below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center justify-between rounded-md border p-3">
                            <span className="font-medium text-muted-foreground">Roll Number</span>
                            <span className="font-mono text-foreground">{pcDetails!.assignedStudentRollNumber}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md border p-3">
                            <span className="font-medium text-muted-foreground">PC Name</span>
                            <span className="font-mono text-foreground">{pcDetails!.name}</span>
                            </div>
                            <div className="space-y-2 rounded-md border p-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-muted-foreground">Assigned Exam</span>
                                    <span className="font-semibold text-foreground">{exam?.title}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-muted-foreground">Exam Status</span>
                                    <Badge variant={exam?.status === 'In Progress' ? 'default' : 'secondary'} className={exam?.status === 'In Progress' ? 'bg-green-500 text-white' : ''}>{exam?.status}</Badge>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            {exam?.status === 'In Progress' ? (
                                <Button className="w-full" onClick={() => router.push(`/exam/${exam._id}`)}>
                                    Start Exam
                                </Button>
                            ) : (
                                <div className="w-full text-center text-sm text-muted-foreground p-2 rounded-md bg-muted">
                                    Please wait for the administrator to start the exam.
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            );
        case 'PENDING_APPROVAL':
        case 'APPROVED_UNASSIGNED':
            const messages = {
                'PENDING_APPROVAL': {
                    title: "Request Sent!",
                    description: "Your PC registration request has been sent. Waiting for administrator approval."
                },
                'APPROVED_UNASSIGNED': {
                    title: "PC Approved!",
                    description: "Your PC has been approved. Waiting for the administrator to assign you to an exam."
                }
            }
            const currentMessage = messages[status];
            return (
                <div className="w-full max-w-md">
                    <Card className="text-center">
                        <CardHeader>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                            </div>
                            <CardTitle>{currentMessage.title}</CardTitle>
                            <CardDescription>{currentMessage.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">This screen will update automatically. Please do not close this window.</p>
                        </CardContent>
                    </Card>
                </div>
            );
        case 'REGISTER':
        case 'ERROR':
        default:
             return (
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
                    <form action={handleRegister}>
                        <CardContent>
                        {(status === 'ERROR' || errorMessage) && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>
                                    {errorMessage || 'An unknown error occurred.'}
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
                            disabled={isSubmitting}
                            />
                        </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={!pcName || isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isSubmitting ? 'Submitting...' : 'Request Access'}
                            </Button>
                        </CardFooter>
                    </form>
                    </Card>
                    <p className="text-center text-sm text-muted-foreground mt-6">
                        Are you an admin? <Link href="/login" className="font-semibold text-primary hover:underline">Login here</Link>
                    </p>
                </div>
             );
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        {renderContent()}
    </main>
  );
}
