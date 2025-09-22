import { QuestionForm } from "@/components/question-form";

export default function NewQuestionPage() {
    return (
        <div>
            <div className="mb-6">
                 <h1 className="text-2xl font-bold tracking-tight">Create New Question</h1>
                <p className="text-muted-foreground">
                    Fill out the details below to add a new question to the bank.
                </p>
            </div>
            <QuestionForm />
        </div>
    );
}
