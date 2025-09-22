
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
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
            setCurrentUser(JSON.parse(userCookie.value));
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
                                    {currentUser?.role === 'superadmin' && <TableHead className="text-right">Actions</TableHead>}
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
                                        {currentUser?.role === 'superadmin' && (
                                             <TableCell className="text-right">
                                                {admin.username !== currentUser.username ? (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm" disabled={isPending}>Delete</Button>
                                                        </AlertDialogTrigger>
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
                                                     <span className="text-xs text-muted-foreground">Cannot delete self</span>
                                                )}
                                            </TableCell>
                                        )}
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
