import {
  db,
  fpActivityTable,
  fpClassesTable,
  fpInsightsTable,
  fpMembersTable,
  fpProgramsTable,
} from "@workspace/db";

let seedPromise: Promise<void> | null = null;

export function ensureFitpilotSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db.select({ id: fpMembersTable.id }).from(fpMembersTable).limit(1);
      if (existing.length > 0) return;

      const members = await db.insert(fpMembersTable).values([
        { name: "Maya Chen", email: "maya.chen@example.com", phone: "+1 415 555 0128", plan: "Elite", status: "active", joinedAt: "2025-11-18", lastVisit: "Today, 7:42 AM", visitsThisMonth: 18, goal: "Build strength", avatarColor: "#F0A15C" },
        { name: "Jordan Ellis", email: "jordan.ellis@example.com", phone: "+1 415 555 0144", plan: "Pro", status: "active", joinedAt: "2026-02-06", lastVisit: "Yesterday, 6:18 PM", visitsThisMonth: 11, goal: "Improve endurance", avatarColor: "#7F8CF2" },
        { name: "Alex Morgan", email: "alex.morgan@example.com", phone: "+1 415 555 0191", plan: "Core", status: "at_risk", joinedAt: "2025-08-22", lastVisit: "12 days ago", visitsThisMonth: 2, goal: "Lose 10 kg", avatarColor: "#54B59A" },
        { name: "Sam Rivera", email: "sam.rivera@example.com", phone: "+1 415 555 0162", plan: "Pro", status: "active", joinedAt: "2026-01-15", lastVisit: "Today, 6:55 AM", visitsThisMonth: 14, goal: "Run a half marathon", avatarColor: "#D27D9B" },
        { name: "Taylor Brooks", email: "taylor.brooks@example.com", phone: "+1 415 555 0177", plan: "Elite", status: "paused", joinedAt: "2025-05-03", lastVisit: "Mar 29, 2026", visitsThisMonth: 0, goal: "Recover and return", avatarColor: "#8B7DBA" },
        { name: "Nico Patel", email: "nico.patel@example.com", phone: "+1 415 555 0133", plan: "Core", status: "active", joinedAt: "2026-03-10", lastVisit: "Today, 8:15 AM", visitsThisMonth: 7, goal: "Build a routine", avatarColor: "#5E9FBB" },
      ]).returning();

      await db.insert(fpProgramsTable).values([
        { name: "Foundations of Strength", description: "A progressive eight-week path for building confidence with the fundamentals.", level: "beginner", weeks: 8, sessionsPerWeek: 3, activeMembers: 28, color: "#F0A15C" },
        { name: "Engine Builder", description: "Structured conditioning for members ready to build sustainable endurance.", level: "intermediate", weeks: 6, sessionsPerWeek: 4, activeMembers: 16, color: "#7F8CF2" },
        { name: "Performance Lab", description: "High-touch programming for advanced members chasing measurable performance.", level: "advanced", weeks: 10, sessionsPerWeek: 5, activeMembers: 9, color: "#54B59A" },
      ]);

      await db.insert(fpClassesTable).values([
        { name: "Strength Foundations", coach: "Avery Stone", date: "Today", startTime: "08:30", durationMinutes: 50, attendees: 18, capacity: 24, category: "Strength", color: "#F0A15C" },
        { name: "Mobility Reset", coach: "Priya Shah", date: "Today", startTime: "10:00", durationMinutes: 45, attendees: 12, capacity: 16, category: "Recovery", color: "#54B59A" },
        { name: "Power Hour", coach: "Marcus Lee", date: "Today", startTime: "12:30", durationMinutes: 60, attendees: 22, capacity: 24, category: "Conditioning", color: "#7F8CF2" },
        { name: "Evening Flow", coach: "Priya Shah", date: "Tomorrow", startTime: "18:00", durationMinutes: 50, attendees: 9, capacity: 18, category: "Yoga", color: "#5E9FBB" },
        { name: "Barbell Club", coach: "Avery Stone", date: "Tomorrow", startTime: "19:15", durationMinutes: 60, attendees: 16, capacity: 20, category: "Strength", color: "#D27D9B" },
      ]);

      const names = members.map((member) => member.name);
      await db.insert(fpActivityTable).values([
        { type: "checkin", title: "Maya checked in", detail: "Elite member · Strength Foundations", timestamp: "7 min ago", memberName: names[0] },
        { type: "signup", title: "New member joined", detail: "Nico Patel · Core plan", timestamp: "42 min ago", memberName: names[5] },
        { type: "payment", title: "Payment received", detail: "Monthly membership · $149.00", timestamp: "1 hr ago", memberName: names[1] },
        { type: "class", title: "Class is nearly full", detail: "Power Hour · 22 of 24 spots", timestamp: "2 hrs ago", memberName: null },
        { type: "program", title: "Program milestone reached", detail: "Engine Builder · 16 active members", timestamp: "Yesterday", memberName: null },
      ]);

      await db.insert(fpInsightsTable).values([
        { priority: "high", title: "Reconnect with 8 at-risk members", summary: "Members with consistent habits last month have gone quiet this week. A personal nudge today could prevent churn.", action: "View members", metric: "−8.4% retention risk" },
        { priority: "medium", title: "Power Hour is your growth engine", summary: "The 12:30 PM session is averaging 92% capacity and converting more trials than any other class.", action: "View schedule", metric: "+18% trial conversion" },
        { priority: "low", title: "Friday evenings have room", summary: "Evening Flow has 9 open spots. A targeted invitation to Core members could fill the room.", action: "View class", metric: "9 open spots" },
      ]);
    })();
  }
  return seedPromise;
}