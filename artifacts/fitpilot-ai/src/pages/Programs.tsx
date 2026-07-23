import { useState } from "react";
import { useListPrograms, useCreateProgram } from "@workspace/api-client-react";
import { Plus, Dumbbell, BarChart, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const programSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  weeks: z.coerce.number().min(1),
  sessionsPerWeek: z.coerce.number().min(1),
});

export function Programs() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: programs, isLoading, refetch } = useListPrograms();
  const createProgram = useCreateProgram();

  const form = useForm<z.infer<typeof programSchema>>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      description: "",
      level: "beginner",
      weeks: 4,
      sessionsPerWeek: 3,
    },
  });

  function onSubmit(values: z.infer<typeof programSchema>) {
    createProgram.mutate({ data: values }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        refetch();
        toast({ title: "Program created", description: "The new training program is live." });
      },
      onError: () => toast({ title: "Error", description: "Could not create program.", variant: "destructive" })
    });
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Programs</h1>
          <p className="text-muted-foreground mt-1">Design and assign structured training.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Program</DialogTitle>
              <DialogDescription>Define a structured training routine.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name</FormLabel>
                    <FormControl><Input placeholder="e.g. 5x5 Strength Base" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="A core strength building block..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="level" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="weeks" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (Weeks)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sessionsPerWeek" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sessions / Week</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createProgram.isPending}>
                    {createProgram.isPending ? "Creating..." : "Create Program"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <Card key={i}><CardContent className="h-48 p-6 flex flex-col justify-between"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : programs?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-card/50 border-dashed">
          <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No programs yet</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">Create your first training program to offer to members.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs?.map((program) => (
            <Card key={program.id} className="flex flex-col overflow-hidden border-border group hover:border-primary/50 transition-colors">
              <div className="h-2 w-full" style={{ backgroundColor: program.color }} />
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold truncate pr-4">{program.name}</CardTitle>
                  <Badge variant={program.level === 'beginner' ? 'secondary' : program.level === 'advanced' ? 'destructive' : 'default'} className="capitalize shrink-0">
                    {program.level}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-2 text-sm">{program.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pb-6">
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                  <div className="flex flex-col items-center justify-center p-2 rounded bg-secondary/50">
                    <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-xs font-semibold">{program.weeks} Wks</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded bg-secondary/50">
                    <BarChart className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-xs font-semibold">{program.sessionsPerWeek}/Wk</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded bg-secondary/50 text-primary">
                    <Users className="h-4 w-4 mb-1" />
                    <span className="text-xs font-bold">{program.activeMembers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
