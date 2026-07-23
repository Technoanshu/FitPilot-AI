import { Activity, ArrowUpRight, TrendingUp, Users, Calendar, CheckCircle2 } from "lucide-react";
import { useGetDashboardOverview, useGetAttendanceTrend, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useGetDashboardOverview();
  const { data: attendance, isLoading: attendanceLoading } = useGetAttendanceTrend();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Today's Pulse</h1>
        <p className="text-muted-foreground text-lg">Your gym's performance at a glance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Members"
          value={overview?.activeMembers}
          total={overview?.memberCount}
          icon={Users}
          loading={overviewLoading}
        />
        <MetricCard
          title="Check-ins Today"
          value={overview?.checkinsToday}
          trend={overview?.attendanceChange}
          icon={CheckCircle2}
          loading={overviewLoading}
        />
        <MetricCard
          title="Monthly Revenue"
          value={overview?.monthlyRevenue ? `$${(overview.monthlyRevenue / 1000).toFixed(1)}k` : undefined}
          trend={overview?.revenueChange}
          icon={TrendingUp}
          loading={overviewLoading}
        />
        <MetricCard
          title="Active Programs"
          value={overview?.programCount}
          subtitle={`${overview?.classCount || 0} classes this week`}
          icon={Activity}
          loading={overviewLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Daily check-ins vs capacity over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {attendanceLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="label" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="checkins" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCheckins)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Live feed of operations</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {activity?.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="mt-0.5 relative flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-primary shrink-0 border border-border">
                      {item.type === 'checkin' && <CheckCircle2 className="h-4 w-4" />}
                      {item.type === 'signup' && <Users className="h-4 w-4" />}
                      {item.type === 'payment' && <TrendingUp className="h-4 w-4" />}
                      {item.type === 'class' && <Calendar className="h-4 w-4" />}
                      {item.type === 'program' && <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground flex gap-2 items-center">
                        <span>{item.detail}</span>
                        {item.memberName && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="font-medium text-foreground">{item.memberName}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                      {item.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  total, 
  trend, 
  subtitle, 
  icon: Icon,
  loading 
}: { 
  title: string;
  value?: string | number;
  total?: number;
  trend?: number;
  subtitle?: string;
  icon: any;
  loading?: boolean;
}) {
  return (
    <Card className="border-border shadow-sm overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          <>
            <div className="text-3xl font-bold font-mono tracking-tight">
              {value !== undefined ? value : "-"}
              {total && <span className="text-lg text-muted-foreground font-normal"> / {total}</span>}
            </div>
            {(trend !== undefined || subtitle) && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                {trend !== undefined && (
                  <span className={trend >= 0 ? "text-success" : "text-destructive"}>
                    {trend >= 0 ? "+" : ""}{trend}%
                  </span>
                )}
                {trend !== undefined ? "from last month" : subtitle}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
