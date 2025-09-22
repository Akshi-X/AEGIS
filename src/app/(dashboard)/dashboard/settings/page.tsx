
'use client';

import { getAdmins, deleteAdmin } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddAdminForm } from '@/components/add-admin-form';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useTransition } from 'react';
import type { Admin } from '@/lib/types';
import type { WithId } from 'mongodb';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';


export default function SettingsPage() {
    const [admins, setAdmins] = useState<WithId<Admin>[]>([]);
    const [currentUser, setCurrentUser] = useState<Admin | null>(null);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const fetchAdmins = () => {
        getAdmins().then(setAdmins);
    };

    useEffect(() => {
        const userCookie = Cookies.get('admin_user');
        if (userCookie) {
            try {
                setCurrentUser(JSON.parse(userCookie));
            } catch(e) {
                console.error("Failed to parse admin_user cookie", e);
                setCurrentUser(null);
            }
        }
        fetchAdmins();
    }, []);

    const handleDelete = (adminId: string) => {
        startTransition(async () => {
            const result = await deleteAdmin(adminId);
            if(result?.success) {
                toast({ title: 'Success', description: 'Admin has been deleted.' });
                fetchAdmins();
            } else {
                toast({ title: 'Error', description: result?.error || 'An error occurred.', variant: 'destructive' });
            }
        });
    }

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Admin Management</CardTitle>
                        <CardDescription>View and manage administrator accounts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {admins.map(admin => (
                                    <TableRow key={admin._id as string}>
                                        <TableCell className="font-medium">{admin.username}</TableCell>
                                        <TableCell>
                                            <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>
                                                {admin.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {currentUser?.role === 'superadmin' && admin.username !== currentUser.username ? (
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                     <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the admin account for {admin.username}.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(admin._id as string)} disabled={isPending}>
                                                            Continue
                                                        </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : (
                                                 <span className="text-xs text-muted-foreground">
                                                    {currentUser?.role === 'superadmin' ? 'Cannot delete self' : '-'}
                                                 </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div>
                <AddAdminForm onAdminAdded={fetchAdmins} />
            </div>
        </div>
    )
}
