import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type {
  Activity,
  ActivityType,
  AttendancePoint,
  Checkin,
  ClassSession,
  DashboardOverview,
  Insight,
  InsightPriority,
  Member,
  MemberPlan,
  MemberStatus,
  Program,
  ProgramLevel,
} from "@/lib/supabase/types";

// ─── Query key registry ───────────────────────────────────────────────────────

const queryKeys = {
  members: ["supabase", "members"] as const,
  member: (id: string) => ["supabase", "members", id] as const,
  programs: ["supabase", "programs"] as const,
  classes: ["supabase", "classes"] as const,
  checkins: ["supabase", "checkins"] as const,
  activity: ["supabase", "activity"] as const,
  insights: ["supabase", "insights"] as const,
  dashboard: ["supabase", "dashboard"] as const,
  payments: ["supabase", "payments"] as const,
};

const AVATAR_COLORS = ["#F0A15C", "#7F8CF2", "#54B59A", "#D27D9B", "#5E9FBB", "#8B7DBA"];
const ENTITY_COLORS = ["#F0A15C", "#7F8CF2", "#54B59A", "#D27D9B", "#5E9FBB", "#8B7DBA"];

// ─── Row mappers ─────────────────────────────────────────────────────────────

function mapMember(row: Record<string, unknown>): Member {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: (row.phone as string) ?? null,
    plan: row.plan as MemberPlan,
    status: row.status as MemberStatus,
    joinedAt: row.joined_at as string,
    lastVisit: (row.last_visit as string) ?? null,
    visitsThisMonth: row.visits_this_month as number,
    goal: row.goal as string,
    avatarColor: row.avatar_color as string,
  };
}

function mapProgram(row: Record<string, unknown>): Program {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    level: row.level as ProgramLevel,
    weeks: row.weeks as number,
    sessionsPerWeek: row.sessions_per_week as number,
    activeMembers: row.active_members as number,
    color: row.color as string,
  };
}

function mapClass(row: Record<string, unknown>): ClassSession {
  return {
    id: row.id as string,
    name: row.name as string,
    coach: row.coach as string,
    date: row.date as string,
    startTime: row.start_time as string,
    durationMinutes: row.duration_minutes as number,
    attendees: row.attendees as number,
    capacity: row.capacity as number,
    category: row.category as string,
    color: row.color as string,
  };
}

function mapCheckin(row: Record<string, unknown>): Checkin {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    memberName: row.member_name as string,
    checkedInAt: row.checked_in_at as string,
    className: (row.class_name as string) ?? null,
  };
}

function mapActivity(row: Record<string, unknown>): Activity {
  return {
    id: row.id as string,
    type: row.type as ActivityType,
    title: row.title as string,
    detail: row.detail as string,
    timestamp: row.timestamp as string,
    memberName: (row.member_name as string) ?? null,
  };
}

function mapInsight(row: Record<string, unknown>): Insight {
  return {
    id: row.id as string,
    priority: row.priority as InsightPriority,
    title: row.title as string,
    summary: row.summary as string,
    action: row.action as string,
    metric: (row.metric as string) ?? null,
  };
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("You must be signed in to access gym data.");
  return data.user.id;
}

async function assertQuery<T>(
  promise: PromiseLike<{ data: T | null; error: unknown }>
): Promise<T> {
  const { data, error } = await promise;
  if (error) throw error;
  return data as T;
}

/** Write a fire-and-forget activity log entry. Never throws. */
async function logActivity(params: {
  ownerId: string;
  type: ActivityType;
  title: string;
  detail: string;
  memberName?: string;
}): Promise<void> {
  const timeStr = new Date().toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  await supabase.from("activity").insert({
    owner_id: params.ownerId,
    type: params.type,
    title: params.title,
    detail: params.detail,
    timestamp: timeStr,
    member_name: params.memberName ?? null,
  });
}

// ─── Members ──────────────────────────────────────────────────────────────────

export function useListMembers(params?: {
  search?: string;
  status?: MemberStatus | "all";
}) {
  return useQuery({
    queryKey: [...queryKeys.members, params],
    queryFn: async () => {
      await getCurrentUserId();
      let query = supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
      if (params?.status && params.status !== "all")
        query = query.eq("status", params.status);
      if (params?.search) {
        const term = `%${params.search}%`;
        query = query.or(
          `name.ilike.${term},email.ilike.${term},phone.ilike.${term}`
        );
      }
      const rows = await assertQuery(query);
      return (rows ?? []).map(mapMember);
    },
  });
}

export function useGetMember(id: string | number | undefined) {
  return useQuery({
    queryKey: queryKeys.member(String(id ?? "")),
    enabled: Boolean(id),
    queryFn: async () => {
      await getCurrentUserId();
      const row = await assertQuery(
        supabase
          .from("members")
          .select("*")
          .eq("id", String(id))
          .maybeSingle()
      );
      return row ? mapMember(row as Record<string, unknown>) : null;
    },
  });
}

export function useCreateMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      data: {
        name: string;
        email: string;
        phone?: string;
        plan: MemberPlan;
        goal: string;
      };
    }) => {
      const ownerId = await getCurrentUserId();
      const row = await assertQuery(
        supabase
          .from("members")
          .insert({
            owner_id: ownerId,
            name: input.data.name,
            email: input.data.email,
            phone: input.data.phone || null,
            plan: input.data.plan,
            goal: input.data.goal,
            avatar_color:
              AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          })
          .select()
          .single()
      );
      const member = mapMember(row as Record<string, unknown>);
      logActivity({
        ownerId,
        type: "signup",
        title: "New member joined",
        detail: `${input.data.plan} plan`,
        memberName: input.data.name,
      }).catch(() => {});
      return member;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.members });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
      client.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useUpdateMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string | number;
      data: Partial<{
        name: string;
        email: string;
        phone: string;
        plan: MemberPlan;
        status: MemberStatus;
        goal: string;
      }>;
    }) => {
      await getCurrentUserId();
      const row = await assertQuery(
        supabase
          .from("members")
          .update({
            name: input.data.name,
            email: input.data.email,
            phone: input.data.phone || null,
            plan: input.data.plan,
            status: input.data.status,
            goal: input.data.goal,
          })
          .eq("id", String(input.id))
          .select()
          .single()
      );
      return mapMember(row as Record<string, unknown>);
    },
    onSuccess: (member) => {
      client.setQueryData(queryKeys.member(member.id), member);
      client.invalidateQueries({ queryKey: queryKeys.members });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getCurrentUserId();
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      client.removeQueries({ queryKey: queryKeys.member(id) });
      client.invalidateQueries({ queryKey: queryKeys.members });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
      client.invalidateQueries({ queryKey: queryKeys.checkins });
    },
  });
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export function useListPrograms() {
  return useQuery({
    queryKey: queryKeys.programs,
    queryFn: async () => {
      await getCurrentUserId();
      const rows = await assertQuery(
        supabase
          .from("programs")
          .select("*")
          .order("created_at", { ascending: false })
      );
      return (rows ?? []).map(mapProgram);
    },
  });
}

export function useCreateProgram() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      data: {
        name: string;
        description: string;
        level: ProgramLevel;
        weeks: number;
        sessionsPerWeek: number;
      };
    }) => {
      const ownerId = await getCurrentUserId();
      const row = await assertQuery(
        supabase
          .from("programs")
          .insert({
            owner_id: ownerId,
            name: input.data.name,
            description: input.data.description,
            level: input.data.level,
            weeks: input.data.weeks,
            sessions_per_week: input.data.sessionsPerWeek,
            color:
              ENTITY_COLORS[input.data.name.length % ENTITY_COLORS.length],
          })
          .select()
          .single()
      );
      const program = mapProgram(row as Record<string, unknown>);
      logActivity({
        ownerId,
        type: "program",
        title: "New program created",
        detail: `${input.data.level} · ${input.data.weeks} weeks`,
      }).catch(() => {});
      return program;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.programs });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
      client.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useDeleteProgram() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getCurrentUserId();
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.programs });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ─── Classes ──────────────────────────────────────────────────────────────────

export function useListClasses(params?: { date?: string; all?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.classes, params],
    queryFn: async () => {
      await getCurrentUserId();
      let query = supabase
        .from("classes")
        .select("*")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });
      if (params?.date) {
        query = query.eq("date", params.date);
      } else if (!params?.all) {
        query = query.gte("date", new Date().toISOString().slice(0, 10));
      }
      const rows = await assertQuery(query);
      return (rows ?? []).map(mapClass);
    },
  });
}

export function useCreateClass() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      data: {
        name: string;
        coach: string;
        date: string;
        startTime: string;
        durationMinutes: number;
        capacity: number;
        category: string;
      };
    }) => {
      const ownerId = await getCurrentUserId();
      const row = await assertQuery(
        supabase
          .from("classes")
          .insert({
            owner_id: ownerId,
            name: input.data.name,
            coach: input.data.coach,
            date: input.data.date,
            start_time: input.data.startTime,
            duration_minutes: input.data.durationMinutes,
            capacity: input.data.capacity,
            category: input.data.category,
            color:
              ENTITY_COLORS[input.data.name.length % ENTITY_COLORS.length],
          })
          .select()
          .single()
      );
      const cls = mapClass(row as Record<string, unknown>);
      logActivity({
        ownerId,
        type: "class",
        title: "New class scheduled",
        detail: `${input.data.name} · ${input.data.date}`,
      }).catch(() => {});
      return cls;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.classes });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
      client.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useDeleteClass() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getCurrentUserId();
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.classes });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ─── Checkins ─────────────────────────────────────────────────────────────────

export function useListCheckins() {
  return useQuery({
    queryKey: queryKeys.checkins,
    queryFn: async () => {
      await getCurrentUserId();
      const rows = await assertQuery(
        supabase
          .from("checkins")
          .select("*")
          .order("checked_in_at", { ascending: false })
          .limit(200)
      );
      return (rows ?? []).map(mapCheckin);
    },
  });
}

export function useCreateCheckin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      data: { memberId: string; className?: string };
    }) => {
      const ownerId = await getCurrentUserId();

      // Fetch member (need name + current visit count)
      const member = await assertQuery<{
        id: string;
        name: string;
        visits_this_month: number;
      }>(
        supabase
          .from("members")
          .select("id,name,visits_this_month")
          .eq("id", input.data.memberId)
          .single()
      );
      if (!member) throw new Error("Member not found.");

      const effectiveClass =
        input.data.className && input.data.className !== "none"
          ? input.data.className
          : null;

      // Insert checkin (owner_id was missing before — now fixed)
      const row = await assertQuery(
        supabase
          .from("checkins")
          .insert({
            owner_id: ownerId,
            member_id: member.id,
            member_name: member.name,
            class_name: effectiveClass,
          })
          .select()
          .single()
      );

      // Update member visit count and last visit timestamp
      await supabase
        .from("members")
        .update({
          visits_this_month: member.visits_this_month + 1,
          last_visit: new Date().toISOString(),
        })
        .eq("id", member.id);

      logActivity({
        ownerId,
        type: "checkin",
        title: "Member checked in",
        detail: effectiveClass ? `for ${effectiveClass}` : "General entry",
        memberName: member.name,
      }).catch(() => {});

      return mapCheckin(row as Record<string, unknown>);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.checkins });
      client.invalidateQueries({ queryKey: queryKeys.members });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
      client.invalidateQueries({ queryKey: queryKeys.activity });
    },
  });
}

export function useDeleteCheckin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getCurrentUserId();
      const { error } = await supabase.from("checkins").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.checkins });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export function useListInsights() {
  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: async () => {
      await getCurrentUserId();
      const rows = await assertQuery(
        supabase
          .from("insights")
          .select("*")
          .order("created_at", { ascending: false })
      );
      return (rows ?? []).map(mapInsight);
    },
  });
}

export function useCreateInsight() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      data: {
        priority: InsightPriority;
        title: string;
        summary: string;
        action: string;
        metric?: string;
      };
    }) => {
      const ownerId = await getCurrentUserId();
      const row = await assertQuery(
        supabase
          .from("insights")
          .insert({
            owner_id: ownerId,
            priority: input.data.priority,
            title: input.data.title,
            summary: input.data.summary,
            action: input.data.action,
            metric: input.data.metric?.trim() || null,
          })
          .select()
          .single()
      );
      return mapInsight(row as Record<string, unknown>);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.insights }),
  });
}

export function useDeleteInsight() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getCurrentUserId();
      const { error } = await supabase.from("insights").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: queryKeys.insights }),
  });
}

// ─── Activity feed ────────────────────────────────────────────────────────────

export function useGetRecentActivity() {
  return useQuery({
    queryKey: queryKeys.activity,
    queryFn: async () => {
      await getCurrentUserId();
      const rows = await assertQuery(
        supabase
          .from("activity")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)
      );
      return (rows ?? []).map(mapActivity);
    },
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function useGetDashboardOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async (): Promise<DashboardOverview> => {
      await getCurrentUserId();
      const today = new Date().toISOString().slice(0, 10);
      const [members, active, checkins, programs, classes] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("checkins")
          .select("id", { count: "exact", head: true })
          .gte("checked_in_at", today),
        supabase.from("programs").select("id", { count: "exact", head: true }),
        supabase
          .from("classes")
          .select("id", { count: "exact", head: true })
          .gte("date", today),
      ]);
      const err = [members, active, checkins, programs, classes].find(
        (r) => r.error
      )?.error;
      if (err) throw err;
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
      // Build cutoff at midnight 13 days ago (local time)
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 13);
      cutoff.setHours(0, 0, 0, 0);

      const rows = await assertQuery(
        supabase
          .from("checkins")
          .select("checked_in_at")
          .gte("checked_in_at", cutoff.toISOString())
      );

      const byDay = new Map<string, number>();
      (rows ?? []).forEach((row: Record<string, unknown>) => {
        // Use the date portion of the ISO string for bucketing
        const key = (row.checked_in_at as string).slice(0, 10);
        byDay.set(key, (byDay.get(key) ?? 0) + 1);
      });

      return Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const key = d.toISOString().slice(0, 10);
        return {
          label: d.toLocaleDateString(undefined, { weekday: "short" }),
          checkins: byDay.get(key) ?? 0,
          capacity: 0,
        };
      });
    },
  });
}
// ─── Payments ────────────────────────────────────────────────────────────────

export function useListPayments() {
  return useQuery({
    queryKey: queryKeys.payments,
    queryFn: async () => {
      await getCurrentUserId();

      const rows = await assertQuery(
        supabase
          .from("payments")
          .select("*")
          .order("payment_date", { ascending: false })
      );

      return rows ?? [];
    },
  });
}

export function useCreatePayment() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      data: {
        memberId: string;
        amount: number;
        paymentDate: string;
        dueDate?: string;
        method: string;
        status: string;
        notes?: string;
      };
    }) => {
      const ownerId = await getCurrentUserId();

      const row = await assertQuery(
        supabase
          .from("payments")
          .insert({
            owner_id: ownerId,
            member_id: input.data.memberId,
            amount: input.data.amount,
            payment_date: input.data.paymentDate,
            due_date: input.data.dueDate ?? null,
            method: input.data.method,
            status: input.data.status,
            notes: input.data.notes ?? null,
          })
          .select()
          .single()
      );

      return row;
    },

    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.payments });
      client.invalidateQueries({ queryKey: queryKeys.dashboard });
      client.invalidateQueries({ queryKey: queryKeys.members });
    },
  });
}
