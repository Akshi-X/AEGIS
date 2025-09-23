
'use client';

import { useEffect, useState } from 'react';
import { getLivePcStatuses } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PC } from '@/lib/types';
import type { WithId } from 'mongodb';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StatusBadge = ({ status }: { status: PC['liveStatus'] }) => {
    const statusStyles: Record<NonNullable<PC['liveStatus']>, string> = {
        Online: 'bg-gray-500',
        Ready: 'bg-blue-500',
        Waiting: 'bg-yellow-500 text-black',
        Attempting: 'bg-green-500',
        Finished: 'bg-purple-500',
    };

    return (
        <Badge className={cn('text-white', statusStyles[status || 'Online'])}>
            {status}
        </Badge>
    );
};

export default function LiveStatusPage() {
    const [pcs, setPcs] = useState<WithId<PC>[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStatuses = async () => {
        setIsLoading(true);
        const statuses = await getLivePcStatuses();
        setPcs(statuses);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchStatuses();
        const interval = setInterval(fetchStatuses, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Live Exam Status</h1>
                    <p className="text-muted-foreground">
                        Real-time monitoring of all active student sessions.
                    </p>
                </div>
                {isLoading && <Loader2 className="h-6 w-6 animate-spin" />}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pcs.map(pc => (
                    <Card key={pc._id as string} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{pc.name}</CardTitle>
                                    <CardDescription>{(pc as any).student?.name} ({(pc as any).student?.rollNumber})</CardDescription>
                                </div>
                                <StatusBadge status={pc.liveStatus} />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2 text-sm">
                             <div>
                                <p className="font-semibold">Assigned Exam:</p>
                                <p className="text-muted-foreground">{(pc as any).exam?.title || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-semibold">Exam Status:</p>
                                <p className="text-muted-foreground">{(pc as any).exam?.status || 'N/A'}</p>
                            </div>
                        </CardContent>
                         <div className="flex items-center justify-end p-4 pt-0 text-xs text-muted-foreground">
                            Last seen: {pc.lastSeen ? formatDistanceToNow(new Date(pc.lastSeen), { addSuffix: true }) : 'never'}
                        </div>
                    </Card>
                ))}
            </div>
             {pcs.length === 0 && !isLoading && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No students are currently assigned to any active exams.</p>
                </div>
            )}
        </div>
    );
}
