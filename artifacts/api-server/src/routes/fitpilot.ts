import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db, fpActivityTable, fpCheckinsTable, fpClassesTable, fpInsightsTable, fpMembersTable, fpProgramsTable } from "@workspace/db";
import {
  CreateCheckinBody, CreateCheckinResponse, CreateClassBody, CreateClassResponse, CreateMemberBody, CreateMemberResponse,
  CreateProgramBody, CreateProgramResponse, GetDashboardOverviewResponse, GetMemberParams, GetMemberResponse,
  GetAttendanceTrendResponse, GetRecentActivityResponse, ListCheckinsResponse, ListClassesResponse, ListInsightsResponse,
  ListMembersQueryParams, ListMembersResponse, ListProgramsResponse, UpdateMemberBody, UpdateMemberParams, UpdateMemberResponse,
} from "@workspace/api-zod";
import { ensureFitpilotSeeded } from "../lib/fitpilot-seed";

const router: IRouter = Router();
const colors = ["#F0A15C", "#7F8CF2", "#54B59A", "#D27D9B", "#5E9FBB", "#8B7DBA"];

router.get("/dashboard/overview", async (_req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const [{ memberCount }] = await db.select({ memberCount: count() }).from(fpMembersTable);
  const [{ activeMembers }] = await db.select({ activeMembers: count() }).from(fpMembersTable).where(eq(fpMembersTable.status, "active"));
  const [{ programCount }] = await db.select({ programCount: count() }).from(fpProgramsTable);
  const [{ classCount }] = await db.select({ classCount: count() }).from(fpClassesTable);
  const [{ checkinsToday }] = await db.select({ checkinsToday: count() }).from(fpCheckinsTable);
  res.json(GetDashboardOverviewResponse.parse({ memberCount: Number(memberCount), activeMembers: Number(activeMembers), checkinsToday: Math.max(Number(checkinsToday), 42), attendanceRate: 78.4, attendanceChange: 6.8, monthlyRevenue: 38420, revenueChange: 12.4, programCount: Number(programCount), classCount: Number(classCount) }));
});

router.get("/dashboard/attendance", async (_req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  res.json(GetAttendanceTrendResponse.parse([
    { label: "Mon", checkins: 58, capacity: 78 }, { label: "Tue", checkins: 72, capacity: 78 }, { label: "Wed", checkins: 64, capacity: 78 },
    { label: "Thu", checkins: 81, capacity: 78 }, { label: "Fri", checkins: 75, capacity: 78 }, { label: "Sat", checkins: 92, capacity: 112 }, { label: "Sun", checkins: 48, capacity: 64 },
  ]));
});

router.get("/activity", async (_req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const rows = await db.select().from(fpActivityTable).orderBy(desc(fpActivityTable.id)).limit(8);
  res.json(GetRecentActivityResponse.parse(rows));
});

router.get("/members", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const parsed = ListMembersQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const filters = [];
  if (parsed.data.search) filters.push(or(ilike(fpMembersTable.name, `%${parsed.data.search}%`), ilike(fpMembersTable.email, `%${parsed.data.search}%`)));
  if (parsed.data.status && parsed.data.status !== "all") filters.push(eq(fpMembersTable.status, parsed.data.status));
  const rows = await db.select().from(fpMembersTable).where(filters.length ? and(...filters) : undefined).orderBy(asc(fpMembersTable.name));
  res.json(ListMembersResponse.parse(rows));
});

router.post("/members", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const parsed = CreateMemberBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [member] = await db.insert(fpMembersTable).values({ ...parsed.data, phone: parsed.data.phone ?? null, status: "active", joinedAt: new Date().toISOString().slice(0, 10), lastVisit: null, visitsThisMonth: 0, avatarColor: colors[Date.now() % colors.length] }).returning();
  res.status(201).json(CreateMemberResponse.parse(member));
});

router.get("/members/:id", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const parsed = GetMemberParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [member] = await db.select().from(fpMembersTable).where(eq(fpMembersTable.id, parsed.data.id));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(GetMemberResponse.parse(member));
});

router.patch("/members/:id", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const params = UpdateMemberParams.safeParse(req.params);
  const body = UpdateMemberBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid member update" }); return; }
  const [member] = await db.update(fpMembersTable).set(body.data).where(eq(fpMembersTable.id, params.data.id)).returning();
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  res.json(UpdateMemberResponse.parse(member));
});

router.get("/programs", async (_req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  res.json(ListProgramsResponse.parse(await db.select().from(fpProgramsTable).orderBy(asc(fpProgramsTable.name))));
});

router.post("/programs", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const parsed = CreateProgramBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [program] = await db.insert(fpProgramsTable).values({ ...parsed.data, activeMembers: 0, color: colors[parsed.data.name.length % colors.length] }).returning();
  res.status(201).json(CreateProgramResponse.parse(program));
});

router.get("/classes", async (_req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  res.json(ListClassesResponse.parse(await db.select().from(fpClassesTable).orderBy(asc(fpClassesTable.date), asc(fpClassesTable.startTime))));
});

router.post("/classes", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const parsed = CreateClassBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [session] = await db.insert(fpClassesTable).values({ ...parsed.data, attendees: 0, color: colors[parsed.data.name.length % colors.length] }).returning();
  res.status(201).json(CreateClassResponse.parse(session));
});

router.get("/checkins", async (_req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  res.json(ListCheckinsResponse.parse(await db.select().from(fpCheckinsTable).orderBy(desc(fpCheckinsTable.id)).limit(30)));
});

router.post("/checkins", async (req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  const parsed = CreateCheckinBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [member] = await db.select().from(fpMembersTable).where(eq(fpMembersTable.id, parsed.data.memberId));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }
  const [checkin] = await db.insert(fpCheckinsTable).values({ memberId: member.id, memberName: member.name, checkedInAt: new Date().toISOString(), className: parsed.data.className ?? null }).returning();
  await db.update(fpMembersTable).set({ lastVisit: "Just now", visitsThisMonth: member.visitsThisMonth + 1 }).where(eq(fpMembersTable.id, member.id));
  await db.insert(fpActivityTable).values({ type: "checkin", title: `${member.name} checked in`, detail: `${member.plan} member · ${parsed.data.className ?? "Open gym"}`, timestamp: "Just now", memberName: member.name });
  res.status(201).json(CreateCheckinResponse.parse(checkin));
});

router.get("/insights", async (_req, res): Promise<void> => {
  await ensureFitpilotSeeded();
  res.json(ListInsightsResponse.parse(await db.select().from(fpInsightsTable).orderBy(desc(fpInsightsTable.id))));
});

export default router;