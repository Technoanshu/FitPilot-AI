export type MemberStatus = "active" | "paused" | "at_risk";
export type MemberPlan = "Core" | "Pro" | "Elite";
export type ProgramLevel = "beginner" | "intermediate" | "advanced";
export type ActivityType = "checkin" | "signup" | "payment" | "class" | "program";
export type InsightPriority = "high" | "medium" | "low";

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  plan: MemberPlan;
  status: MemberStatus;
  joinedAt: string;
  lastVisit: string | null;
  visitsThisMonth: number;
  goal: string;
  avatarColor: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  level: ProgramLevel;
  weeks: number;
  sessionsPerWeek: number;
  activeMembers: number;
  color: string;
}

export interface ClassSession {
  id: string;
  name: string;
  coach: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  attendees: number;
  capacity: number;
  category: string;
  color: string;
}

export interface Checkin {
  id: string;
  memberId: string;
  memberName: string;
  checkedInAt: string;
  className: string | null;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  timestamp: string;
  memberName: string | null;
}

export interface Insight {
  id: string;
  priority: InsightPriority;
  title: string;
  summary: string;
  action: string;
  metric: string | null;
}

export interface DashboardOverview {
  memberCount: number;
  activeMembers: number;
  checkinsToday: number;
  attendanceRate: number;
  attendanceChange: number;
  monthlyRevenue: number;
  revenueChange: number;
  programCount: number;
  classCount: number;
}

export interface AttendancePoint {
  label: string;
  checkins: number;
  capacity: number;
}