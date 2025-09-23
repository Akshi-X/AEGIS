
'use client';

import { useState, useTransition } from 'react';
import { registerPc } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Logo } from '@/components/icons';

type ActionState = {
  message: string;
  status: 'error' | 'success' | '';
};

const initialState: ActionState = {
  message: '',
  status: '',
};

export default function Home() {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [pcName, setPcName] = useState('');

  const handleFormAction = (formData: FormData) => {
    startTransition(async () => {
      const result = await registerPc(undefined, formData);
      setState(result);
      if (result.status === 'success') {
        // Clear form for next registration
        setPcName('');
        // Optional: auto-hide the success message after a few seconds
        setTimeout(() => setState(initialState), 5000);
      }
    });
  };

  const handleRegisterAnother = () => {
    setState(initialState);
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
          <form action={handleFormAction}>
            <CardContent>
               {state.status === 'error' && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {state.message}
                    </AlertDescription>
                </Alert>
              )}
               {state.status === 'success' && (
                 <Alert variant="default" className="mb-4 bg-blue-50 border border-blue-200 text-blue-800">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Request Submitted!</AlertTitle>
                    <AlertDescription>
                        {state.message} An administrator will review it shortly.
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
                  disabled={isPending || state.status === 'success'}
                />
              </div>
            </CardContent>
            <CardFooter>
              {state.status === 'success' ? (
                 <Button onClick={handleRegisterAnother} className="w-full" type="button">
                    Register Another PC
                </Button>
              ) : (
                <Button type="submit" className="w-full" disabled={!pcName || isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isPending ? 'Submitting...' : 'Request Access'}
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
