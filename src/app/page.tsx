
'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { registerPc } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/icons';

const initialState = {
  message: '',
  status: '',
};

export default function Home() {
  const [state, formAction] = useFormState(registerPc, initialState);
  const [pcName, setPcName] = useState('');

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
              {state?.status === 'success' && (
                <Alert variant="default" className="bg-green-50 border border-green-200 text-green-800 mb-4">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Registration Pending</AlertTitle>
                    <AlertDescription>
                        {state.message} An administrator will review your request shortly.
                    </AlertDescription>
                </Alert>
              )}
               {state?.status === 'error' && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {state.message}
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
                  disabled={state?.status === 'success'}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={!pcName || state?.status === 'success'}>
                Request Access
              </Button>
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
