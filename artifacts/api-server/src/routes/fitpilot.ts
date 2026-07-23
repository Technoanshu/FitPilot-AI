import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db, activityTable, checkinsTable, classesTable, insightsTable, membersTable } from "@workspace/db";
import {
  CreateCheckinBody,
  CreateCheckinResponse,
  CreateClassBody,
  CreateClassResponse,
  CreateMemberBody,
  CreateMemberResponse,
  GetAttendanceTrendResponse,
  GetDashboardOverviewResponse,
  GetMemberParams,
  GetMemberResponse,
  GetRecentActivityResponse,
  ListClassesResponse,
  ListInsightsResponse,
  ListMembersQueryParams,
  ListMembersResponse,
  UpdateMemberBody,
  UpdateMemberParams,
  UpdateMemberResponse,
} from "@workspace/api-zod";
import { ensureFitpilotSeeded } from "../lib/fitpilot-seed";

const router: IRouter = Router();
const colors = ["#8B5CF6", "#38BDF8", "#34D399", "#F97316", "#E879F9", "#FBBF24"];

router.get("/dashboard/overview", async (_req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const [{ memberCount }] = await db.select({ memberCount: count() }).from(membersTable);
  const [{ activeMembers }] = await db.select({ activeMembers: count() }).from(membersTable).where(eq(membersTable.status, "active"));
  const [{ checkinsToday }] = await db.select({ checkinsToday: count() }).from(checkinsTable);
  const [{ upcomingClasses }] = await db.select({ upcomingClasses: count() }).from(classesTable);
  res.json(GetDashboardOverviewResponse.parse({
    memberCount: Number(memberCount),
    activeMembers: Number(activeMembers),
    attendanceRate: 78.4,
    attendanceChange: 6.8,
    monthlyRevenue: 38420,
    revenueChange: 12.4,
    checkinsToday: Math.max(Number(checkinsToday), 42),
    upcomingClasses: Number(upcomingClasses),
  }));
});

router.get("/dashboard/attendance", async (_req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  res.json(GetAttendanceTrendResponse.parse([
    { label: "Mon", checkins: 58, capacity: 78 }, { label: "Tue", checkins: 72, capacity: 78 },
    { label: "Wed", checkins: 64, capacity: 78 }, { label: "Thu", checkins: 81, capacity: 78 },
    { label: "Fri", checkins: 75, capacity: 78 }, { label: "Sat", checkins: 92, capacity: 112 },
    { label: "Sun", checkins: 48, capacity: 64 },
  ]));
});

router.get("/activity", async (_req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const rows = await db.select().from(activityTable).orderBy(desc(activityTable.id)).limit(8);
  res.json(GetRecentActivityResponse.parse(rows));
});

router.get("/members", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const parsed = ListMembersQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { search, status } = parsed.data;
  const filters = [];
  if (search) filters.push(or(ilike(membersTable.name, `%${search}%`), ilike(membersTable.email, `%${search}%`)));
  if (status && status !== "all") filters.push(eq(membersTable.status, status));
  const rows = await db.select().from(membersTable).where(filters.length ? and(...filters) : undefined).orderBy(asc(membersTable.name));
  res.json(ListMembersResponse.parse(rows));
});

router.post("/members", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const parsed = CreateMemberBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [member] = await db.insert(membersTable).values({
    ...parsed.data, phone: parsed.data.phone ?? null, status: "active", joinedAt: new Date().toISOString().slice(0, 10),
    lastVisit: null, visitsThisMonth: 0, avatarColor: colors[Math.floor(Math.random() * colors.length)],
  }).returning();
  res.status(201).json(CreateMemberResponse.parse(member));
});

router.get("/members/:id", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const parsed = GetMemberParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, parsed.data.id));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(GetMemberResponse.parse(member));
});

router.patch("/members/:id", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const params = GetMemberParams.safeParse(req.params);
  const body = UpdateMemberBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid member update" }); return; }
  const [member] = await db.update(membersTable).set(body.data).where(eq(membersTable.id, params.data.id)).returning();
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(UpdateMemberResponse.parse(member));
});

router.get("/classes", async (_req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const rows = await db.select().from(classesTable).orderBy(asc(classesTable.startTime));
  res.json(ListClassesResponse.parse(rows));
});

router.post("/classes", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const parsed = CreateClassBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [gymClass] = await db.insert(classesTable).values({ ...parsed.data, attendees: 0, color: colors[parsed.data.name.length % colors.length] }).returning();
  res.status(201).json(CreateClassResponse.parse(gymClass));
});

router.post("/checkins", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const parsed = CreateCheckinBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, parsed.data.memberId));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  const [checkin] = await db.insert(checkinsTable).values({ memberId: member.id, memberName: member.name, checkedInAt: new Date().toISOString() }).returning();
  await db.update(membersTable).set({ lastVisit: "Just now", visitsThisMonth: member.visitsThisMonth + 1 }).where(eq(membersTable.id, member.id));
  await db.insert(activityTable).values({ type: "checkin", title: `${member.name} checked in`, detail: `${member.plan} member · Open gym`, timestamp: "Just now", memberName: member.name });
  res.status(201).json(CreateCheckinResponse.parse(checkin));
});

router.get("/insights", async (_req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const rows = await db.select().from(insightsTable).orderBy(desc(insightsTable.id));
  res.json(ListInsightsResponse.parse(rows));
});

export default router;