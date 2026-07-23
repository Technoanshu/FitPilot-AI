import { useState } from "react";
import { useListClasses, useCreateClass } from "@/services/supabase";
import { Calendar, Plus, Clock, Users, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

const classSchema = z.object({
  name: z.string().min(1),
  coach: z.string().min(1),
  date: z.string(),
  startTime: z.string(),
  durationMinutes: z.coerce.number().min(15),
  capacity: z.coerce.number().min(1),
  category: z.string().min(1),
});

export function Schedule() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: classes, isLoading, refetch } = useListClasses();
  const createClass = useCreateClass();

  const form = useForm<z.infer<typeof classSchema>>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "", coach: "", date: format(new Date(), 'yyyy-MM-dd'), startTime: "12:00", durationMinutes: 60, capacity: 20, category: "Strength"
    }
  });

  function onSubmit(values: z.infer<typeof classSchema>) {
    createClass.mutate({ data: values }, {
      onSuccess: () => {
        setOpen(false); form.reset(); refetch();
        toast({ title: "Class scheduled" });
      },
      onError: () => toast({ title: "Error", variant: "destructive" })
    });
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Schedule</h1>
          <p className="text-muted-foreground mt-1">Manage upcoming classes and capacity.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Schedule Class</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Class</DialogTitle>
              <DialogDescription>Add a session to the calendar.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Class Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Strength">Strength</SelectItem>
                          <SelectItem value="Cardio">Cardio</SelectItem>
                          <SelectItem value="Yoga">Yoga</SelectItem>
                          <SelectItem value="Mobility">Mobility</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="coach" render={({ field }) => (
                  <FormItem><FormLabel>Coach</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="durationMinutes" render={({ field }) => (
                    <FormItem><FormLabel>Duration (min)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="capacity" render={({ field }) => (
                    <FormItem><FormLabel>Capacity</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createClass.isPending}>Save Class</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : classes?.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-16 border rounded-lg bg-card/50 border-dashed">
             <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
             <h3 className="text-lg font-medium text-foreground">No upcoming classes</h3>
           </div>
        ) : (
          classes?.map((cls) => {
            const isFull = cls.attendees >= cls.capacity;
            const percentFull = Math.min(100, Math.round((cls.attendees / cls.capacity) * 100));
            
            return (
              <Card key={cls.id} className="overflow-hidden border-border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex flex-col md:flex-row">
                  <div className="flex flex-col justify-center px-6 py-4 md:w-48 bg-secondary/30 border-r border-border shrink-0">
                    <div className="text-sm font-semibold text-primary mb-1 uppercase tracking-wider">{cls.date}</div>
                    <div className="text-2xl font-bold font-mono tracking-tight">{cls.startTime}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {cls.durationMinutes} min
                    </div>
                  </div>
                  
                  <div className="flex-1 p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{cls.name}</h3>
                        <Badge variant="outline" className="text-xs font-normal bg-card" style={{ borderColor: cls.color, color: cls.color }}>
                          {cls.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserRound className="h-4 w-4" /> Coach: {cls.coach}
                      </div>
                    </div>
                    
                    <div className="w-full md:w-64 shrink-0 flex flex-col items-end gap-2">
                      <div className="flex justify-between w-full text-sm font-medium">
                        <span>{cls.attendees} / {cls.capacity}</span>
                        <span className={isFull ? "text-destructive" : "text-muted-foreground"}>
                          {isFull ? "Full" : "Available"}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isFull ? 'bg-destructive' : 'bg-primary'}`}
                          style={{ width: `${percentFull}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
