import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const fpMembersTable = pgTable("fp_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  plan: text("plan").notNull(),
  status: text("status").notNull().default("active"),
  joinedAt: text("joined_at").notNull(),
  lastVisit: text("last_visit"),
  visitsThisMonth: integer("visits_this_month").notNull().default(0),
  goal: text("goal").notNull(),
  avatarColor: text("avatar_color").notNull(),
});

export const fpProgramsTable = pgTable("fp_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  level: text("level").notNull(),
  weeks: integer("weeks").notNull(),
  sessionsPerWeek: integer("sessions_per_week").notNull(),
  activeMembers: integer("active_members").notNull().default(0),
  color: text("color").notNull(),
});

export const fpClassesTable = pgTable("fp_classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  coach: text("coach").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  attendees: integer("attendees").notNull().default(0),
  capacity: integer("capacity").notNull(),
  category: text("category").notNull(),
  color: text("color").notNull(),
});

export const fpCheckinsTable = pgTable("fp_checkins", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  memberName: text("member_name").notNull(),
  checkedInAt: text("checked_in_at").notNull(),
  className: text("class_name"),
});

export const fpActivityTable = pgTable("fp_activity", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  timestamp: text("timestamp").notNull(),
  memberName: text("member_name"),
});

export const fpInsightsTable = pgTable("fp_insights", {
  id: serial("id").primaryKey(),
  priority: text("priority").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  action: text("action").notNull(),
  metric: text("metric"),
});

export const insertFpMemberSchema = createInsertSchema(fpMembersTable).omit({ id: true });
export const insertFpProgramSchema = createInsertSchema(fpProgramsTable).omit({ id: true });
export const insertFpClassSchema = createInsertSchema(fpClassesTable).omit({ id: true });
export const insertFpCheckinSchema = createInsertSchema(fpCheckinsTable).omit({ id: true });

export type FpMemberInsert = z.infer<typeof insertFpMemberSchema>;
export type FpProgramInsert = z.infer<typeof insertFpProgramSchema>;