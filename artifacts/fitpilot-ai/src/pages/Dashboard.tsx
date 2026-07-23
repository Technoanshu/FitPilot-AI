import React from 'react';
import { useGetDashboardOverview, useGetAttendanceTrend, useGetRecentActivity } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Users, ArrowUpRight, ArrowDownRight, Clock, Target, CreditCard, Sparkles, CheckSquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StatCard({ title, value, change, icon: Icon, valuePrefix = '' }: { title: string, value: string | number, change?: number, icon: any, valuePrefix?: string }) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <h3 className="text-3xl font-bold font-mono tracking-tight">{valuePrefix}{value}</h3>
          {change !== undefined && (
            <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-500' : 'text-destructive'}`}>
              {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useGetDashboardOverview();
  const { data: trend, isLoading: trendLoading } = useGetAttendanceTrend();
  const { data: activities, isLoading: activitiesLoading } = useGetRecentActivity();

  if (overviewLoading || trendLoading || activitiesLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-md mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card rounded-xl border border-border" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-card rounded-xl border border-border" />
          <div className="h-[400px] bg-card rounded-xl border border-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening at your gym today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-card border border-border px-4 py-2 rounded-full shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Live pulse active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Members" 
          value={overview?.memberCount || 0} 
          icon={Users} 
        />
        <StatCard 
          title="Attendance Rate" 
          value={overview?.attendanceRate || 0} 
          change={overview?.attendanceChange} 
          icon={Target} 
          valuePrefix=""
        />
        <StatCard 
          title="Monthly Revenue" 
          value={(overview?.monthlyRevenue || 0).toLocaleString()} 
          change={overview?.revenueChange} 
          icon={CreditCard} 
          valuePrefix="$"
        />
        <StatCard 
          title="Check-ins Today" 
          value={overview?.checkinsToday || 0} 
          icon={Activity} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Attendance Flow</CardTitle>
            <CardDescription>7-day rolling check-in volume against gym capacity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {trend && trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-mono)' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="checkins" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCheckins)" 
                      activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No trend data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Live feed of operations.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-6">
              {activities && activities.length > 0 ? activities.map((activity) => (
                <div key={activity.id} className="flex gap-4 relative">
                  <div className="absolute left-4 top-8 bottom-[-24px] w-px bg-border last:hidden" />
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center relative z-10 ${
                    activity.type === 'checkin' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    activity.type === 'signup' ? 'bg-primary/20 text-primary' :
                    activity.type === 'payment' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}>
                    {activity.type === 'checkin' ? <CheckSquare className="w-4 h-4" /> :
                     activity.type === 'signup' ? <Sparkles className="w-4 h-4" /> :
                     activity.type === 'payment' ? <CreditCard className="w-4 h-4" /> :
                     <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{activity.detail}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground/70 font-mono">
                        {activity.timestamp}
                      </span>
                      {activity.memberName && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className="text-xs font-medium text-foreground">{activity.memberName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">No recent activity.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
