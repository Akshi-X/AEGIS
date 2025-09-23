
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getExamDetails, submitExam, getPcStatus } from '@/lib/actions';
import type { Question, Exam } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ExamPage() {
    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ questionId: string; selectedOption: number | null }[]>([]);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, startTransition] = useTransition();

    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const examId = params.examId as string;

    useEffect(() => {
        if (!examId) return;

        getExamDetails(examId).then(data => {
            if (data) {
                setExam(data.exam as Exam);
                setQuestions(data.questions as Question[]);
                setAnswers(data.questions.map(q => ({ questionId: q._id as string, selectedOption: null })));
                setTimeLeft(data.exam.duration * 60);
            }
            setIsLoading(false);
        });
    }, [examId]);
    
    useEffect(() => {
        if (timeLeft > 0 && !isLoading) {
            const timer = setInterval(() => {
                setTimeLeft(prevTime => prevTime - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && !isLoading && exam) {
            handleExamSubmit();
        }
    }, [timeLeft, isLoading, exam]);

    const handleAnswerChange = (questionId: string, optionIndex: number) => {
        setAnswers(prev => prev.map(a => a.questionId === questionId ? { ...a, selectedOption: optionIndex } : a));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleExamSubmit = async () => {
        startTransition(async () => {
            const pcIdentifier = localStorage.getItem('pcIdentifier');
            if (!pcIdentifier) {
                 toast({ title: 'Error', description: 'PC identifier not found.', variant: 'destructive' });
                 return;
            }
            const pcStatus = await getPcStatus(pcIdentifier);
            const studentId = pcStatus.pcDetails?.assignedStudentId;

            if (!studentId) {
                toast({ title: 'Error', description: 'Student not assigned.', variant: 'destructive' });
                return;
            }
            
            const result = await submitExam(examId, studentId, answers);

            if (result.success) {
                toast({ title: 'Success', description: 'Exam submitted successfully.' });
                router.push('/'); // Redirect to home/portal page
            } else {
                 toast({ title: 'Error', description: result.error || 'Failed to submit exam.', variant: 'destructive' });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        );
    }
    
    if (!exam || questions.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Could not load exam details. Please try again later.</p>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const currentAnswer = answers.find(a => a.questionId === currentQuestion._id)?.selectedOption;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 sm:p-8">
            <div className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold">{exam.title}</h1>
                    <div className="text-lg font-mono bg-card px-4 py-2 rounded-md shadow-sm">
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </div>
                </div>
                <Progress value={progress} className="mb-6" />
                <Card>
                    <CardHeader>
                        <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
                        <CardDescription className="pt-4 text-base text-foreground">{currentQuestion.text.replace(/\$/g, '')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup 
                            value={currentAnswer !== null && currentAnswer !== undefined ? currentAnswer.toString() : ''}
                            onValueChange={(value) => handleAnswerChange(currentQuestion._id as string, parseInt(value))}
                            className="space-y-4"
                        >
                            {currentQuestion.options.map((opt, index) => (
                                <div key={index} className="flex items-center space-x-3 rounded-md border p-4 has-[:checked]:border-primary">
                                    <RadioGroupItem value={index.toString()} id={`q${currentQuestionIndex}-opt${index}`} />
                                    <Label htmlFor={`q${currentQuestionIndex}-opt${index}`} className="flex-1 cursor-pointer">{opt.text}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </CardContent>
                </Card>
                <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                        Previous
                    </Button>
                    {currentQuestionIndex === questions.length - 1 ? (
                        <Button onClick={handleExamSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Exam'}
                        </Button>
                    ) : (
                        <Button onClick={handleNext}>
                            Next
                        </Button>
                    )}
                </div>
            </div>
        </main>
    );
}
