
import { getAdmins } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddAdminForm } from '@/components/add-admin-form';
import { Badge } from '@/components/ui/badge';

export default async function SettingsPage() {
    const admins = await getAdmins();

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
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <div>
                <AddAdminForm />
            </div>
        </div>
    )
}
