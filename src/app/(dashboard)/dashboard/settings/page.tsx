
'use client';

import { useEffect, useState } from 'react';
import { getAdmins, deleteAdmin } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddAdminForm } from '@/components/add-admin-form';
import { Badge } from '@/components/ui/badge';
import type { Admin } from '@/lib/types';
import type { WithId } from 'mongodb';
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
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';


export default function SettingsPage() {
    const [admins, setAdmins] = useState<WithId<Admin>[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const { toast } = useToast();

    const fetchAdmins = () => {
        getAdmins().then(setAdmins);
    };

    useEffect(() => {
        const userCookie = Cookies.get('admin_user');
        if (userCookie) {
            try {
                setCurrentUser(JSON.parse(userCookie));
            } catch (e) {
                console.error("Failed to parse user cookie", e);
            }
        }
        fetchAdmins();
    }, []);

    const handleDelete = async (adminId: string) => {
        const result = await deleteAdmin(adminId);
        if (result?.success) {
            toast({ title: 'Success', description: 'Admin has been deleted.' });
            fetchAdmins(); // Refresh the list
        } else {
            toast({ title: 'Error', description: result?.error || 'An error occurred.', variant: 'destructive' });
        }
    };

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
                                    <TableRow key={admin._id.toString()}>
                                        <TableCell className="font-medium">{admin.username}</TableCell>
                                        <TableCell>
                                            <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>
                                                {admin.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {currentUser?.username !== admin.username ? (
                                                 <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive">
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the admin account for <span className="font-bold">{admin.username}</span>.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(admin._id.toString())} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : (
                                                <div className="h-9 w-9" /> 
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
