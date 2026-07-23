import React, { useState } from 'react';
import { useGetRecentActivity, useCreateCheckin, useListMembers, getGetRecentActivityQueryKey, getGetDashboardOverviewQueryKey, getGetAttendanceTrendQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckSquare, Search, UserCheck, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function Attendance() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: activities, isLoading: activityLoading } = useGetRecentActivity();
  const { data: members, isLoading: membersLoading } = useListMembers({ search: searchTerm });
  
  const queryClient = useQueryClient();
  const createCheckin = useCreateCheckin();
  const { toast } = useToast();

  const handleCheckIn = (memberId: number, memberName: string) => {
    createCheckin.mutate({ data: { memberId } }, {
      onSuccess: () => {
        toast({ title: "Checked in successfully", description: `${memberName} is now checked in.` });
        setSearchTerm('');
        queryClient.invalidateQueries({ queryKey: getGetRecentActivityQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardOverviewQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAttendanceTrendQueryKey() });
      },
      onError: () => {
        toast({ title: "Check-in failed", description: "Could not check in member.", variant: "destructive" });
      }
    });
  };

  // Filter activities to only show checkins
  const checkins = activities?.filter(a => a.type === 'checkin') || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground mt-1">Live check-in feed and manual entry.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-sm border-border flex flex-col h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Manual Check-in</CardTitle>
            <CardDescription>Quickly check a member in.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-muted/50 border-border"
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {searchTerm && members?.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: member.avatarColor }}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{member.plan}</div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-8"
                      disabled={createCheckin.isPending}
                      onClick={() => handleCheckIn(member.id, member.name)}
                    >
                      Check In
                    </Button>
                  </div>
                ))}
                {searchTerm && members?.length === 0 && !membersLoading && (
                  <div className="text-center py-4 text-sm text-muted-foreground">No members found.</div>
                )}
                {!searchTerm && (
                  <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                    <UserCheck className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm">Search to check in</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle>Live Check-ins</CardTitle>
            <CardDescription>Today's attendance log.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {activityLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}
                </div>
              ) : checkins.length > 0 ? (
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-card">
                  {checkins.map(checkin => (
                    <div key={checkin.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{checkin.memberName}</p>
                          <p className="text-sm text-muted-foreground">{checkin.detail}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-medium">{format(parseISO(checkin.timestamp), 'h:mm a')}</div>
                        <div className="text-xs text-muted-foreground">Today</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border border-border border-dashed rounded-xl">
                  No check-ins yet today.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
