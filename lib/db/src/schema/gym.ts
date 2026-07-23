import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const membersTable = pgTable("fitpilot_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  plan: text("plan").notNull(),
  status: text("status").notNull().default("active"),
  joinedAt: text("joined_at").notNull(),
  lastVisit: text("last_visit"),
  visitsThisMonth: integer("visits_this_month").notNull().default(0),
  avatarColor: text("avatar_color").notNull().default("#8B5CF6"),
});

export const classesTable = pgTable("fitpilot_classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  coach: text("coach").notNull(),
  startTime: text("start_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  attendees: integer("attendees").notNull().default(0),
  capacity: integer("capacity").notNull(),
  category: text("category").notNull(),
  color: text("color").notNull().default("#8B5CF6"),
});

export const checkinsTable = pgTable("fitpilot_checkins", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  memberName: text("member_name").notNull(),
  checkedInAt: text("checked_in_at").notNull(),
});

export const activityTable = pgTable("fitpilot_activity", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  detail: text("detail").notNull(),
  timestamp: text("timestamp").notNull(),
  memberName: text("member_name"),
});

export const insightsTable = pgTable("fitpilot_insights", {
  id: serial("id").primaryKey(),
  priority: text("priority").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  action: text("action").notNull(),
  metric: text("metric"),
});

export const insertMemberSchema = createInsertSchema(membersTable).omit({ id: true });
export const insertClassSchema = createInsertSchema(classesTable).omit({ id: true });
export const insertCheckinSchema = createInsertSchema(checkinsTable).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activityTable).omit({ id: true });
export const insertInsightSchema = createInsertSchema(insightsTable).omit({ id: true });

export type Member = z.infer<typeof insertMemberSchema>;
export type GymClass = z.infer<typeof insertClassSchema>;