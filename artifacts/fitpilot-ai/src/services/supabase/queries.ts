import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type {
  Activity,
  AttendancePoint,
  Checkin,
  ClassSession,
  DashboardOverview,
  Insight,
  Member,
  MemberPlan,
  MemberStatus,
  Program,
  ProgramLevel,
} from "@/lib/supabase/types";

const queryKeys = {
  members: ["supabase", "members"] as const,
  member: (id: string) => ["supabase", "members", id] as const,
  programs: ["supabase", "programs"] as const,
  classes: ["supabase", "classes"] as const,
  checkins: ["supabase", "checkins"] as const,
  activity: ["supabase", "activity"] as const,
  insights: ["supabase", "insights"] as const,
  dashboard: ["supabase", "dashboard"] as const,
};

const colors = ["#F0A15C", "#7F8CF2", "#54B59A", "#D27D9B", "#5E9FBB", "#8B7DBA"];

function mapMember(row: any): Member {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    plan: row.plan,
    status: row.status,
    joinedAt: row.joined_at,
    lastVisit: row.last_visit,
    visitsThisMonth: row.visits_this_month,
    goal: row.goal,
    avatarColor: row.avatar_color,
  };
}

function mapProgram(row: any): Program {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    level: row.level,
    weeks: row.weeks,
    sessionsPerWeek: row.sessions_per_week,
    activeMembers: row.active_members,
    color: row.color,
  };
}

function mapClass(row: any): ClassSession {
  return {
    id: row.id,
    name: row.name,
    coach: row.coach,
    date: row.date,
    startTime: row.start_time,
    durationMinutes: row.duration_minutes,
    attendees: row.attendees,
    capacity: row.capacity,
    category: row.category,
    color: row.color,
  };
}

function mapCheckin(row: any): Checkin {
  return {
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name,
    checkedInAt: row.checked_in_at,
    className: row.class_name,
  };
}

function mapActivity(row: any): Activity {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    detail: row.detail,
    timestamp: row.timestamp,
    memberName: row.member_name,
  };
}

function mapInsight(row: any): Insight {
  return {
    id: row.id,
    priority: row.priority,
    title: row.title,
    summary: row.summary,
    action: row.action,
    metric: row.metric,
  };
}

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("You must be signed in to access gym data.");
  return data.user.id;
}

async function assertQuery<T>(promise: PromiseLike<{ data: T | null; error: any }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw error;
  return data as T;
}

export function useListMembers(params?: { search?: string; status?: MemberStatus | "all" }) {
  return useQuery({
    queryKey: [...queryKeys.members, params],
    queryFn: async () => {
      await getCurrentUserId();
      let query = supabase.from("members").select("*").order("created_at", { ascending: false });
      if (params?.status && params.status !== "all") query = query.eq("status", params.status);
      if (params?.search) {
        const term = `%${params.search}%`;
        query = query.or(`name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
      }
      const rows = await assertQuery(query);
      return (rows ?? []).map(mapMember);
    },
  });
}

export function useGetMember(id: string | number | undefined) {
  return useQuery({
    queryKey: queryKeys.member(String(id)),
    enabled: Boolean(id),
    queryFn: async () => {
      await getCurrentUserId();
      const row = await assertQuery(supabase.from("members").select("*").eq("id", String(id)).maybeSingle());
      return row ? mapMember(row) : null;
    },
  });
}

export function useCreateMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { data: { name: string; email: string; phone?: string; plan: MemberPlan; goal: string } }) => {
      const ownerId = await getCurrentUserId();
      const row = await assertQuery(
        supabase.from("members").insert({
          owner_id: ownerId,
          name: input.data.name,
          email: input.data.email,
          phone: input.data.phone || null,
          plan: input.data.plan,
          goal: input.data.goal,
          avatar_color: colors[Math.floor(Math.random() * colors.length)],
        }).select().single()
      );
      return mapMember(row);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.members });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string | number; data: Partial<{ name: string; email: string; phone: string; plan: MemberPlan; status: MemberStatus; goal: string }> }) => {
      await getCurrentUserId();
      const row = await assertQuery(
        supabase.from("members").update({
          name: input.data.name,
          email: input.data.email,
          phone: input.data.phone || null,
          plan: input.data.plan,
          status: input.data.status,
          goal: input.data.goal,
        }).eq("id", String(input.id)).select().single()
      );
      return mapMember(row);
    },
    onSuccess: (member) => {
      client.setQueryData(queryKeys.member(member.id), member);
      client.invalidateQueries({ queryKey: queryKeys.members });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useListPrograms() {
  return useQuery({
    queryKey: queryKeys.programs,
    queryFn: async () => {
      await getCurrentUserId();
      const rows = await assertQuery(supabase.from("programs").select("*").order("created_at", { ascending: false }));
      return (rows ?? []).map(mapProgram);
    },
  });
}

export function useCreateProgram() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { data: { name: string; description: string; level: ProgramLevel; weeks: number; sessionsPerWeek: number } }) => {
      const ownerId = await getCurrentUserId();
      const row = await assertQuery(
        supabase.from("programs").insert({
          owner_id: ownerId,
          name: input.data.name,
          description: input.data.description,
          level: input.data.level,
          weeks: input.data.weeks,
          sessions_per_week: input.data.sessionsPerWeek,
          color: colors[input.data.name.length % colors.length],
        }).select().single()
      );
      return mapProgram(row);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.programs }),
  });
}

export function useListClasses() {
  return useQuery({
    queryKey: queryKeys.classes,
    queryFn: async () => {
      await getCurrentUserId();
      const rows = await assertQuery(supabase.from("classes").select("*").order("date", { ascending: true }).order("start_time", { ascending: true }));
      return (rows ?? []).map(mapClass);
    },
  });
}

export function useCreateClass() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { data: { name: string; coach: string; date: string; startTime: string; durationMinutes: number; capacity: number; category: string } }) => {
      const ownerId = await getCurrentUserId();
      const row = await assertQuery(
        supabase.from("classes").insert({
          owner_id: ownerId,
          name: input.data.name,
          coach: input.data.coach,
          date: input.data.date,
          start_time: input.data.startTime,
          duration_minutes: input.data.durationMinutes,
          capacity: input.data.capacity,
          category: input.data.category,
          color: colors[input.data.name.length % colors.length],
        }).select().single()
      );
      return mapClass(row);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.classes });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useListCheckins() {
  return useQuery({
    queryKey: queryKeys.checkins,
    queryFn: async () => {
      await getCurrentUserId();
      const rows = await assertQuery(supabase.from("checkins").select("*").order("checked_in_at", { ascending: false }).limit(100));
      return (rows ?? []).map(mapCheckin);
    },
  });
}

export function useCreateCheckin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { data: { memberId: string | number; className?: string } }) => {
      await getCurrentUserId();
      const member = await assertQuery<{ id: string; name: string }>(
        supabase.from("members").select("id,name").eq("id", String(input.data.memberId)).single()
      );
      if (!member) throw new Error("The selected member could not be found.");
      const row = await assertQuery(
        supabase.from("checkins").insert({
          member_id: member.id,
          member_name: member.name,
          class_name: input.data.className && input.data.className !== "none" ? input.data.className : null,
        }).select().single()
      );
      return mapCheckin(row);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.checkins });
      client.invalidateQueries({ queryKey: queryKeys.members });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
      client.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useListInsights() {
  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: async () => {
      await getCurrentUserId();
      const rows = await assertQuery(supabase.from("insights").select("*").order("created_at", { ascending: false }));
      return (rows ?? []).map(mapInsight);
    },
  });
}

export function useGetDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async (): Promise<DashboardOverview> => {
      await getCurrentUserId();
      const [members, active, checkins, programs, classes] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("checkins").select("id", { count: "exact", head: true }).gte("checked_in_at", new Date().toISOString().slice(0, 10)),
        supabase.from("programs").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }).gte("date", new Date().toISOString().slice(0, 10)),
      ]);
      const error = [members, active, checkins, programs, classes].find((result) => result.error)?.error;
      if (error) throw error;
      return {
        memberCount: members.count ?? 0,
        activeMembers: active.count ?? 0,
        checkinsToday: checkins.count ?? 0,
        attendanceRate: 0,
        attendanceChange: 0,
        monthlyRevenue: 0,
        revenueChange: 0,
        programCount: programs.count ?? 0,
        classCount: classes.count ?? 0,
      };
    },
  });
}

export function useGetAttendanceTrend() {
  return useQuery({
    queryKey: [...queryKeys.dashboard, "attendance"],
    queryFn: async (): Promise<AttendancePoint[]> => {
      await getCurrentUserId();
      const rows = await assertQuery(supabase.from("checkins").select("checked_in_at").gte("checked_in_at", new Date(Date.now() - 13 * 86400000).toISOString()));
      const byDay = new Map<string, number>();
      (rows ?? []).forEach((row: any) => {
        const date = new Date(row.checked_in_at);
        const key = date.toISOString().slice(0, 10);
        byDay.set(key, (byDay.get(key) ?? 0) + 1);
      });
      return Array.from({ length: 14 }, (_, index) => {
        const date = new Date(Date.now() - (13 - index) * 86400000);
        const key = date.toISOString().slice(0, 10);
        return { label: date.toLocaleDateString(undefined, { weekday: "short" }), checkins: byDay.get(key) ?? 0, capacity: 0 };
      });
    },
  });
}

export function useGetRecentActivity() {
  return useQuery({
    queryKey: queryKeys.activity,
    queryFn: async () => {
      await getCurrentUserId();
      const rows = await assertQuery(supabase.from("activity").select("*").order("created_at", { ascending: false }).limit(20));
      return (rows ?? []).map(mapActivity);
    },
  });
}