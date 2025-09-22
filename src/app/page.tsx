
'use client';

import { useState, useEffect, useActionState } from 'react';
import { registerPc, getPcStatus } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Logo } from '@/components/icons';

const initialState = {
  message: '',
  status: '',
  pcIdentifier: null as string | null,
};

type ActionState = typeof initialState;

export default function Home() {
  const [state, formAction] = useActionState(registerPc, initialState);
  const [pcName, setPcName] = useState('');
  const [currentStatus, setCurrentStatus] = useState(state.status);
  const [pcIdentifier, setPcIdentifier] = useState<string | null>(state.pcIdentifier);

  useEffect(() => {
    if (state.status) {
      setCurrentStatus(state.status);
    }
    if (state.pcIdentifier) {
      setPcIdentifier(state.pcIdentifier);
    }
  }, [state]);

  useEffect(() => {
    if (currentStatus === 'pending' && pcIdentifier) {
      const interval = setInterval(async () => {
        const result = await getPcStatus(pcIdentifier);
        if (result.status && result.status !== 'Pending') {
          setCurrentStatus(result.status.toLowerCase());
          clearInterval(interval);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval); // Cleanup on component unmount
    }
  }, [currentStatus, pcIdentifier]);
  
  const handleTryAgain = () => {
    setCurrentStatus('');
    setPcIdentifier(null);
    setPcName(''); 
  };

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
              {currentStatus === 'success' && (
                <Alert variant="default" className="bg-green-50 border border-green-200 text-green-800 mb-4">
                    <CheckCircle className="h-4 w-4 text-green-600" />
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
              {currentStatus === 'approved' && (
                  <Alert variant="default" className="bg-green-50 border border-green-200 text-green-800 mb-4">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle>Registration Approved!</AlertTitle>
                      <AlertDescription>
                          Your PC has been approved by an administrator. You can now proceed.
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
                  disabled={currentStatus === 'success' || currentStatus === 'approved' || currentStatus === 'pending'}
                />
              </div>
            </CardContent>
            <CardFooter>
             {currentStatus !== 'rejected' ? (
                <Button type="submit" className="w-full" disabled={!pcName || currentStatus === 'success' || currentStatus === 'approved' || currentStatus === 'pending'}>
                    {currentStatus === 'success' || currentStatus === 'pending' ? 'Request Submitted' : 'Request Access'}
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
