import Link from 'next/link';
import { mockQuestions } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function QuestionsPage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
                <p className="text-muted-foreground">
                    Browse, create, and manage all questions for your exams.
                </p>
            </div>
            <Link href="/dashboard/questions/new" passHref>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> New Question</Button>
            </Link>
        </div>
        <div className="grid gap-4">
            {mockQuestions.map((q) => (
                <Card key={q.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                           <CardTitle className="text-base font-medium leading-relaxed pr-8">{q.text.replace(/\$/g, '')}</CardTitle>
                           <Badge variant={q.category === 'Easy' ? 'secondary' : q.category === 'Medium' ? 'outline' : 'default'}
                            className={
                                q.category === 'Easy' ? 'bg-green-100 text-green-800 border-green-200' :
                                q.category === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                'bg-red-100 text-red-800 border-red-200'
                            }>{q.category}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-2 text-sm">
                            {q.options.map((opt, index) => (
                                <div key={index} className={`flex items-center gap-2 p-2 rounded-md ${q.correctOptions.includes(index) ? 'bg-green-50 border border-green-200' : 'bg-card'}`}>
                                    <span className={`font-mono text-xs ${q.correctOptions.includes(index) ? 'text-green-700' : 'text-muted-foreground'}`}>{String.fromCharCode(65 + index)}.</span>
                                    <span>{opt.text}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="flex items-center gap-2 p-6 pt-2">
                        {q.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                    </div>
                </Card>
            ))}
        </div>
    </div>
  );
}
