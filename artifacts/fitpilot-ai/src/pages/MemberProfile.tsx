import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetMember, useUpdateMember } from "@/services/supabase";
import { ArrowLeft, Edit2, Clock, CalendarDays, Target, Mail, Phone, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

const editSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  plan: z.enum(["Core", "Pro", "Elite"]),
  status: z.enum(["active", "paused", "at_risk"]),
  goal: z.string().min(2),
});

export function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);

  const { data: member, isLoading } = useGetMember(id);
  const updateMember = useUpdateMember();

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "", email: "", phone: "", plan: "Core", status: "active", goal: ""
    }
  });

  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        email: member.email,
        phone: member.phone || "",
        plan: member.plan as "Core" | "Pro" | "Elite",
        status: member.status as "active" | "paused" | "at_risk",
        goal: member.goal
      });
    }
  }, [member, form]);

  function onSubmit(values: z.infer<typeof editSchema>) {
    updateMember.mutate({ id: id ?? "", data: values }, {
      onSuccess: (data) => {
        setEditOpen(false);
        toast({ title: "Profile updated" });
      },
      onError: () => {
        toast({ title: "Failed to update", variant: "destructive" });
      }
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card><CardContent className="h-64"></CardContent></Card>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold">Member not found</h2>
        <Button variant="link" onClick={() => navigate('/members')} className="mt-4">Back to Members</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/members')} className="gap-2 -ml-3">
          <ArrowLeft className="h-4 w-4" /> Back to Members
        </Button>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit2 className="h-4 w-4" /> Edit Profile
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Member Profile</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="plan" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Core">Core</SelectItem>
                          <SelectItem value="Pro">Pro</SelectItem>
                          <SelectItem value="Elite">Elite</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="at_risk">At Risk</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="goal" render={({ field }) => (
                  <FormItem><FormLabel>Goal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={updateMember.isPending}>Save Changes</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-border shadow-sm">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div 
              className="h-24 w-24 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-md ring-4 ring-background"
              style={{ backgroundColor: member.avatarColor }}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-foreground">{member.name}</h2>
            <div className="flex gap-2 mt-2">
              <Badge variant={member.status === 'active' ? 'default' : member.status === 'paused' ? 'secondary' : 'destructive'} className="capitalize">
                {member.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline">{member.plan}</Badge>
            </div>
            
            <div className="w-full mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground bg-secondary/50 p-2.5 rounded-md">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{member.email}</span>
              </div>
              {member.phone && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground bg-secondary/50 p-2.5 rounded-md">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{member.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Fitness Profile</CardTitle>
            <CardDescription>Overview of training and attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/30 rounded-lg border border-border flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Goal</div>
                  <div className="font-medium text-foreground mt-1">{member.goal}</div>
                </div>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg border border-border flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visits This Month</div>
                  <div className="font-mono text-xl font-bold text-foreground mt-1">{member.visitsThisMonth}</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-4 text-foreground">Timeline</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Last Visit</div>
                    <div className="text-xs text-muted-foreground">
                      {member.lastVisit ?? "No visits recorded"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Joined Gym</div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(member.joinedAt), "MMMM d, yyyy")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
