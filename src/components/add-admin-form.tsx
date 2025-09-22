
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addAdmin } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const adminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(['admin', 'superadmin']),
});

export function AddAdminForm() {
    const { toast } = useToast();
    const form = useForm({
        resolver: zodResolver(adminSchema),
        defaultValues: {
            username: '',
            password: '',
            role: 'admin' as 'admin' | 'superadmin',
        },
    });

    const onSubmit = async (data: z.infer<typeof adminSchema>) => {
        const result = await addAdmin(data);
        if (result?.success) {
            toast({ title: "Admin Added", description: "The new admin has been created." });
            form.reset();
        } else {
            toast({ title: "Error", description: result?.error || "An unknown error occurred.", variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Admin</CardTitle>
                <CardDescription>Add a new administrator account.</CardDescription>
            </CardHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="superadmin">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Creating...' : 'Create Admin'}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
