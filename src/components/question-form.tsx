
'use client';

import { useState, useActionState, useTransition } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wand2, X } from 'lucide-react';

import { getAiSuggestions, saveQuestion, getAiFullQuestionSuggestion } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';

const questionFormSchema = z.object({
  questionText: z.string().min(10, {
    message: "Question text must be at least 10 characters.",
  }),
  options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).min(2, "At least two options are required."),
  correctOptions: z.array(z.coerce.number()).min(1, "At least one correct option must be selected."),
  category: z.enum(['Easy', 'Medium', 'Hard']),
  tags: z.array(z.string()),
  weight: z.coerce.number().min(0),
  negativeMarking: z.boolean(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export function QuestionForm() {
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSuggestingFullQuestion, setIsSuggestingFullQuestion] = useState(false);
  const [suggestionTopic, setSuggestionTopic] = useState('');

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionText: '',
      options: [{ text: '' }, { text: '' }],
      correctOptions: [],
      category: 'Medium',
      tags: [],
      weight: 1,
      negativeMarking: false,
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "options",
  });
  
  const handleAiSuggest = async () => {
    const questionText = form.getValues('questionText');
    if(questionText.length < 10) {
        toast({ title: 'Error', description: 'Question text must be at least 10 characters.', variant: 'destructive' });
        return;
    }

    setIsSuggesting(true);
    try {
        const result = await getAiSuggestions({ questionText });
        if (result.suggestions) {
            form.setValue('category', result.suggestions.difficulty);
            setTags(result.suggestions.tags);
            form.setValue('tags', result.suggestions.tags);
            toast({ title: 'AI Suggestions Applied', description: 'Difficulty and tags have been populated.' });
        } else if (result.message) {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    } catch (error) {
         toast({ title: 'Error', description: 'Failed to get AI suggestions. Please try again later.', variant: 'destructive' });
    } finally {
        setIsSuggesting(false);
    }
  }

  const handleSuggestFullQuestion = async () => {
    if (!suggestionTopic) {
      toast({ title: 'Error', description: 'Please enter a topic to get suggestions.', variant: 'destructive' });
      return;
    }
    setIsSuggestingFullQuestion(true);
    try {
      const result = await getAiFullQuestionSuggestion({ topic: suggestionTopic });
      if (result.suggestion) {
        const { questionText, options, correctOptions, difficulty } = result.suggestion;
        
        // Use setValue for more reliable state updates with react-hook-form
        form.setValue('questionText', questionText);
        replace(options); // replace the entire options array
        form.setValue('correctOptions', correctOptions);
        form.setValue('category', difficulty);
        form.setValue('tags', [suggestionTopic]);
        form.setValue('weight', 1);
        form.setValue('negativeMarking', false);

        setTags([suggestionTopic]);
        toast({ title: 'AI Question Generated', description: 'The form has been populated with the suggested question.' });
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to generate question.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsSuggestingFullQuestion(false);
    }
  }

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      const newTags = [...tags, newTag];
      setTags(newTags);
      form.setValue('tags', newTags);
      setNewTag('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags);
  };
  
  async function onSubmit(data: QuestionFormValues) {
    const result = await saveQuestion(data);
    if(result?.error) {
       toast({
        title: "Error Saving Question",
        description: result.error,
        variant: 'destructive',
      })
    } else {
       toast({
        title: "Question Submitted",
        description: "The new question has been saved.",
      })
      form.reset();
      setTags([]);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Generate with AI</CardTitle>
                    <CardDescription>Enter a topic to generate a full question with options and answers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input 
                            value={suggestionTopic}
                            onChange={(e) => setSuggestionTopic(e.target.value)}
                            placeholder="e.g., 'Quantum Physics' or 'React Hooks'"
                        />
                        <Button type="button" onClick={handleSuggestFullQuestion} disabled={isSuggestingFullQuestion}>
                            {isSuggestingFullQuestion ? 'Generating...' : <><Wand2 className="mr-2 h-4 w-4" /> Suggest Full Question</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Question Details</CardTitle>
                <CardDescription>Enter the main text of the question. You can use LaTeX for formulas (e.g., $E=mc^2$).</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="questionText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Text</FormLabel>
                      <FormControl>
                        <Textarea rows={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                 <Button type="button" onClick={handleAiSuggest} disabled={isSuggesting}>
                    {isSuggesting ? 'Thinking...' : <><Wand2 className="mr-2 h-4 w-4" /> Suggest Tags & Difficulty</>}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Options</CardTitle>
                <CardDescription>Provide the choices for the question and select the correct one(s).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`options.${index}.text`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                           <FormField
                              control={form.control}
                              name="correctOptions"
                              render={({ field: checkField }) => (
                                <FormControl>
                                  <Switch
                                    checked={checkField.value.includes(index)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        checkField.onChange([...checkField.value, index]);
                                      } else {
                                        checkField.onChange(checkField.value.filter(v => v !== index));
                                      }
                                    }}
                                  />
                                </FormControl>
                              )}
                            />
                            <FormLabel className="sr-only">Option {index + 1}</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder={`Option ${index + 1}`} />
                            </FormControl>
                          
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                 <FormField
                    control={form.control}
                    name="options"
                    render={() => (
                        <FormItem>
                            <FormMessage />
                        </FormItem>
                    )}
                 />
                <Button type="button" variant="outline" size="sm" onClick={() => append({ text: '' })} disabled={fields.length >= 6}>
                  Add Option
                </Button>
                 <FormField
                    control={form.control}
                    name="correctOptions"
                    render={() => (
                        <FormItem>
                            <FormMessage />
                        </FormItem>
                    )}
                 />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (Marks)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="negativeMarking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Negative Marking</FormLabel>
                        <FormDescription>
                          Enable to deduct marks for wrong answers.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <Input 
                            value={newTag} 
                            onChange={(e) => setNewTag(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            placeholder="Add a tag..."
                        />
                        <Button type="button" onClick={addTag}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
                                {tag}
                                <button type="button" onClick={() => removeTag(tag)}>
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Question'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
