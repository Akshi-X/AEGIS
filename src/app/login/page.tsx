
'use client';

import { useActionState } from 'react';
import { authenticate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/icons';

const initialState = {
  message: '',
};

export default function LoginPage() {
  const [state, formAction] = useActionState(authenticate, initialState);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
            <Logo className="size-12 text-primary" />
        </div>
        <Card>
            <form action={formAction}>
            <CardHeader>
                <CardTitle className="text-2xl">Admin Login</CardTitle>
                <CardDescription>
                Enter the administrator password to access the dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {state?.message && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Login Failed</AlertTitle>
                        <AlertDescription>{state.message}</AlertDescription>
                    </Alert>
                )}
                <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full">
                Login
                </Button>
            </CardFooter>
            </form>
        </Card>
        </div>
    </main>
  );
}
