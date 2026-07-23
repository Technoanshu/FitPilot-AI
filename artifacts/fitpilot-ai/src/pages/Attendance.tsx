import { useState } from "react";
import { useListCheckins, useCreateCheckin, useListMembers } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { CheckCircle2, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const checkinSchema = z.object({
  memberId: z.coerce.number().min(1, "Select a member"),
  className: z.string().optional(),
});

export function Attendance() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: checkins, isLoading, refetch } = useListCheckins();
  const { data: members, isLoading: membersLoading } = useListMembers({ status: 'active' });
  const createCheckin = useCreateCheckin();

  const form = useForm<z.infer<typeof checkinSchema>>({
    resolver: zodResolver(checkinSchema),
  });

  function onSubmit(values: z.infer<typeof checkinSchema>) {
    createCheckin.mutate({ data: values }, {
      onSuccess: () => {
        setOpen(false); form.reset(); refetch();
        toast({ title: "Checked in successfully" });
      },
      onError: () => toast({ title: "Check-in failed", variant: "destructive" })
    });
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1">Track live gym entries and class check-ins.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Manual Check-in
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Check-in</DialogTitle>
              <DialogDescription>Manually log a member entry.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="memberId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member</FormLabel>
                    <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={membersLoading ? "Loading..." : "Select active member"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members?.map(m => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="className" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="General Entry" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">General Entry</SelectItem>
                        <SelectItem value="Morning Strength">Morning Strength</SelectItem>
                        <SelectItem value="HIIT Bootcamp">HIIT Bootcamp</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createCheckin.isPending}>Check In</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border bg-card/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-muted-foreground" /> Recent Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : checkins?.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
               No recent check-ins today.
             </div>
          ) : (
            <div className="divide-y divide-border">
              {checkins?.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 sm:px-6 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{entry.memberName}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(parseISO(entry.checkedInAt), "h:mm a")}
                      </div>
                    </div>
                  </div>
                  <div>
                    {entry.className ? (
                      <Badge variant="secondary" className="font-normal">{entry.className}</Badge>
                    ) : (
                      <Badge variant="outline" className="font-normal text-muted-foreground border-dashed">General</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
