import React, { useState } from 'react';
import { useListClasses, useCreateClass, getListClassesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Plus, Clock, Users, MapPin, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const classSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  coach: z.string().min(1, 'Coach is required'),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid date/time is required' }),
  durationMinutes: z.coerce.number().min(15, 'Duration must be at least 15 mins'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  category: z.string().min(1, 'Category is required'),
});

function CreateClassDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createClass = useCreateClass();
  
  const form = useForm<z.infer<typeof classSchema>>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: '',
      coach: '',
      startTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      durationMinutes: 60,
      capacity: 20,
      category: 'HIIT',
    },
  });

  const onSubmit = (values: z.infer<typeof classSchema>) => {
    // Add seconds and Z to make it a valid ISO string
    const formattedData = { ...values, startTime: new Date(values.startTime).toISOString() };
    createClass.mutate({ data: formattedData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
        toast({ title: "Class created", description: `${values.name} with ${values.coach} added.` });
        onOpenChange(false);
        form.reset();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to create class.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Schedule a new gym class.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Morning HIIT" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coach"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coach</FormLabel>
                  <FormControl>
                    <Input placeholder="Sarah M." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="HIIT, Yoga, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="pt-4 flex justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
                Cancel
              </Button>
              <Button type="submit" disabled={createClass.isPending}>
                {createClass.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Class
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function Schedule() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: classes, isLoading } = useListClasses();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground mt-1">Manage upcoming classes and capacity.</p>
        </div>
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm hover:shadow"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Class
        </Button>
      </div>

      <CreateClassDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse shadow-sm">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
                <div className="h-2 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))
        ) : classes?.map((gymClass) => (
          <Card key={gymClass.id} className="group shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: gymClass.color || 'var(--primary)' }} />
            <CardContent className="p-6 pl-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{gymClass.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 font-medium">{gymClass.coach}</p>
                </div>
                <div className="bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider">
                  {gymClass.category}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm mb-6 text-foreground/80">
                <div className="flex items-center gap-1.5 font-mono">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {format(parseISO(gymClass.startTime), 'h:mm a')} ({gymClass.durationMinutes}m)
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-4 h-4" /> Capacity
                  </span>
                  <span className="font-mono">{gymClass.attendees} / {gymClass.capacity}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${(gymClass.attendees / gymClass.capacity) * 100}%`,
                      backgroundColor: gymClass.color || 'var(--primary)'
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!classes || classes.length === 0) && !isLoading && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-border border-dashed rounded-xl">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium">No classes scheduled.</p>
          </div>
        )}
      </div>
    </div>
  );
}
