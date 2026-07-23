import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useListMembers, useCreateMember, ListMembersStatus } from "@workspace/api-client-react";
import { Search, Plus, User, MoreHorizontal, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

const memberFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  plan: z.enum(["Core", "Pro", "Elite"]),
  goal: z.string().min(2, "Goal is required"),
});

export function Members() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ListMembersStatus>("all");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: members, isLoading, refetch } = useListMembers({ search: search || undefined, status: status !== "all" ? status : undefined });
  const createMember = useCreateMember();

  const form = useForm<z.infer<typeof memberFormSchema>>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      plan: "Core",
      goal: "",
    },
  });

  function onSubmit(values: z.infer<typeof memberFormSchema>) {
    createMember.mutate({ data: values }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        refetch();
        toast({ title: "Member added", description: `${values.name} has been added.` });
      },
      onError: (err) => {
        toast({ title: "Error", description: "Could not add member.", variant: "destructive" });
      }
    });
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Members</h1>
          <p className="text-muted-foreground mt-1">Manage your gym's community.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
              <DialogDescription>Enter the details to enroll a new member.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Alex Johnson" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="alex@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl><Input placeholder="555-0123" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="plan" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Core">Core</SelectItem>
                          <SelectItem value="Pro">Pro</SelectItem>
                          <SelectItem value="Elite">Elite</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="goal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Goal</FormLabel>
                    <FormControl><Input placeholder="e.g. Strength training, weight loss" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={createMember.isPending}>
                    {createMember.isPending ? "Adding..." : "Add Member"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full bg-card"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <Select value={status} onValueChange={(v: any) => setStatus(v)}>
            <SelectTrigger className="w-full sm:w-[160px] bg-card">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="at_risk">At Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-24 hidden md:block" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : members?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-card/50 border-dashed">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No members found</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {search ? "No members match your search criteria." : "Get started by adding your first gym member."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {members?.map((member) => (
            <Link key={member.id} to={`/members/${member.id}`}>
              <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer group bg-card">
                <CardContent className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
                  <div 
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base sm:text-lg text-foreground truncate group-hover:text-primary transition-colors">
                          {member.name}
                        </h3>
                        {member.status === 'at_risk' && (
                          <Badge variant="destructive" className="text-[10px] h-5 px-1.5 hidden sm:inline-flex">At Risk</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate flex items-center gap-2">
                        <span>{member.email}</span>
                        {member.phone && (
                          <>
                            <span className="hidden sm:inline w-1 h-1 rounded-full bg-border" />
                            <span className="hidden sm:inline">{member.phone}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-8">
                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Plan</span>
                        <span className="font-medium text-sm">{member.plan}</span>
                      </div>
                      
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Visits/Mo</span>
                        <span className="font-mono text-base font-bold">{member.visitsThisMonth}</span>
                      </div>

                      <div className="flex flex-col items-start sm:items-end">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold hidden sm:block">Status</span>
                        <Badge variant={member.status === 'active' ? 'default' : member.status === 'paused' ? 'secondary' : 'destructive'} className="mt-1 sm:mt-0">
                          {member.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="icon" className="hidden sm:flex shrink-0 -mr-2">
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
