
import { getPcs } from '@/lib/actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default async function PCsPage() {
  const pcs = await getPcs();

  return (
    <Card>
      <CardHeader>
        <CardTitle>PC Management</CardTitle>
        <CardDescription>
          View, approve, and manage all registered PCs connecting to the exam network.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PC Name</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Identifier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pcs.map((pc) => (
              <TableRow key={pc._id as string}>
                <TableCell className="font-medium">{pc.name}</TableCell>
                <TableCell>{pc.ipAddress}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      pc.status === 'Approved'
                        ? 'default'
                        : pc.status === 'Pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className={cn(
                        pc.status === 'Approved' && 'bg-green-500/80 text-white',
                        pc.status === 'Pending' && 'bg-amber-500/80 text-white'
                    )}
                  >
                    {pc.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{pc.uniqueIdentifier}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {pc.status !== 'Approved' && (
                        <DropdownMenuItem>Approve</DropdownMenuItem>
                      )}
                      {pc.status !== 'Rejected' && (
                        <DropdownMenuItem>Reject</DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
