import { db, activityTable, classesTable, insightsTable, membersTable } from "@workspace/db";

let seedPromise: Promise<void> | null = null;

export function ensureFitpilotSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db.select({ id: membersTable.id }).from(membersTable).limit(1);
      if (existing.length > 0) return;

      const members = await db.insert(membersTable).values([
        { name: "Maya Chen", email: "maya.chen@example.com", phone: "+1 415 555 0128", plan: "Elite", status: "active", joinedAt: "2025-11-18", lastVisit: "Today, 7:42 AM", visitsThisMonth: 18, avatarColor: "#E879F9" },
        { name: "Jordan Ellis", email: "jordan.ellis@example.com", phone: "+1 415 555 0144", plan: "Pro", status: "active", joinedAt: "2026-02-06", lastVisit: "Yesterday, 6:18 PM", visitsThisMonth: 11, avatarColor: "#38BDF8" },
        { name: "Alex Morgan", email: "alex.morgan@example.com", phone: "+1 415 555 0191", plan: "Core", status: "overdue", joinedAt: "2025-08-22", lastVisit: "12 days ago", visitsThisMonth: 2, avatarColor: "#FBBF24" },
        { name: "Sam Rivera", email: "sam.rivera@example.com", phone: "+1 415 555 0162", plan: "Pro", status: "active", joinedAt: "2026-01-15", lastVisit: "Today, 6:55 AM", visitsThisMonth: 14, avatarColor: "#34D399" },
        { name: "Taylor Brooks", email: "taylor.brooks@example.com", phone: "+1 415 555 0177", plan: "Elite", status: "paused", joinedAt: "2025-05-03", lastVisit: "Mar 29, 2026", visitsThisMonth: 0, avatarColor: "#FB7185" },
        { name: "Nico Patel", email: "nico.patel@example.com", phone: "+1 415 555 0133", plan: "Core", status: "active", joinedAt: "2026-03-10", lastVisit: "Today, 8:15 AM", visitsThisMonth: 7, avatarColor: "#A78BFA" },
      ]).returning();

      await db.insert(classesTable).values([
        { name: "Strength Foundations", coach: "Avery Stone", startTime: "08:30", durationMinutes: 50, attendees: 18, capacity: 24, category: "Strength", color: "#8B5CF6" },
        { name: "Mobility Reset", coach: "Priya Shah", startTime: "10:00", durationMinutes: 45, attendees: 12, capacity: 16, category: "Recovery", color: "#14B8A6" },
        { name: "Power Hour", coach: "Marcus Lee", startTime: "12:30", durationMinutes: 60, attendees: 22, capacity: 24, category: "Conditioning", color: "#F97316" },
        { name: "Evening Flow", coach: "Priya Shah", startTime: "18:00", durationMinutes: 50, attendees: 9, capacity: 18, category: "Yoga", color: "#38BDF8" },
        { name: "Barbell Club", coach: "Avery Stone", startTime: "19:15", durationMinutes: 60, attendees: 16, capacity: 20, category: "Strength", color: "#E879F9" },
      ]);

      const names = members.map((member) => member.name);
      await db.insert(activityTable).values([
        { type: "checkin", title: "Maya checked in", detail: "Elite member · Strength Foundations", timestamp: "7 min ago", memberName: names[0] },
        { type: "signup", title: "New member joined", detail: "Nico Patel · Core plan", timestamp: "42 min ago", memberName: names[5] },
        { type: "payment", title: "Payment received", detail: "Monthly membership · $149.00", timestamp: "1 hr ago", memberName: names[1] },
        { type: "class", title: "Class is nearly full", detail: "Power Hour · 22 of 24 spots", timestamp: "2 hrs ago", memberName: null },
        { type: "checkin", title: "Sam checked in", detail: "Pro member · Open gym", timestamp: "2 hrs ago", memberName: names[3] },
      ]);

      await db.insert(insightsTable).values([
        { priority: "high", title: "Win back 8 at-risk members", summary: "Members who visited 3+ times last month have not checked in this week. A personal nudge today could prevent churn.", action: "View members", metric: "−8.4% retention risk" },
        { priority: "medium", title: "Power Hour is your growth engine", summary: "Your 12:30 PM class is averaging 92% capacity and converting 18% more trials than any other session.", action: "View class details", metric: "+18% trial conversion" },
        { priority: "low", title: "Friday evenings have room", summary: "Evening Flow has 9 open spots this Friday. A targeted push to Core members could fill the room.", action: "Create campaign", metric: "9 open spots" },
      ]);
    })();
  }
  return seedPromise;
}