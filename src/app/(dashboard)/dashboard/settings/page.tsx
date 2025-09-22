

'use server';

import { getAdmins } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddAdminForm } from '@/components/add-admin-form';
import { Badge } from '@/components/ui/badge';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { AdminDeleteButton } from '@/components/admin-delete-button';


export default async function SettingsPage() {
    const admins = await getAdmins();
    const cookieStore = cookies();
    const userCookie = await cookieStore.get('admin_user');
    const currentUser = userCookie ? JSON.parse(userCookie.value) : null;

    const onAdminAdded = async () => {
        'use server';
        revalidatePath('/dashboard/settings');
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
                                             {currentUser?.username !== admin.username ? (
                                                <AdminDeleteButton adminId={admin._id.toString()} adminUsername={admin.username} />
                                            ) : (
                                                <div className="h-8 w-8" /> 
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
                <AddAdminForm onAdminAdded={onAdminAdded} />
            </div>
        </div>
    )
}
