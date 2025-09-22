
import { getAdminLogs } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default async function LogsPage() {
    const logs = await getAdminLogs();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Administrator Logs</CardTitle>
                <CardDescription>A record of all actions performed by admins.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Admin</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map(log => (
                            <TableRow key={log._id as string}>
                                <TableCell className="font-medium">{log.adminUsername}</TableCell>
                                <TableCell>{log.action}</TableCell>
                                <TableCell>
                                    <pre className="text-xs bg-muted p-2 rounded-md font-mono">{JSON.stringify(log.details, null, 2)}</pre>
                                </TableCell>
                                <TableCell>{format(new Date(log.timestamp), 'MMM d, yyyy, h:mm a')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
