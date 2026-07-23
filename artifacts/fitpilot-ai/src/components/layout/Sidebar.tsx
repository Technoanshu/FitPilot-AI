import { NavLink, useLocation } from "react-router-dom";
import { Activity, CalendarDays, ClipboardCheck, LayoutDashboard, Lightbulb, Users, Dumbbell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSupabaseAuth } from "@/contexts/supabase-auth";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Members", href: "/members", icon: Users },
  { name: "Schedule", href: "/schedule", icon: CalendarDays },
  { name: "Programs", href: "/programs", icon: Dumbbell },
  { name: "Attendance", href: "/attendance", icon: ClipboardCheck },
  { name: "Insights", href: "/insights", icon: Lightbulb },
];

export function Sidebar({ className }: { className?: string }) {
  const location = useLocation();
  const { session, signOut } = useSupabaseAuth();
  const displayName = session?.user.user_metadata?.full_name || session?.user.email?.split("@")[0] || "Gym owner";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className={cn("w-64 border-r border-border bg-card flex flex-col", className)}>
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <Activity className="h-6 w-6 text-primary" />
          <span>FitPilot<span className="text-foreground">AI</span></span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Operations
        </div>
        {navigation.map((item) => {
          // Special handling for home route to avoid matching all paths
          const isActive = item.href === "/" 
            ? location.pathname === "/" 
            : location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive: navActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group text-sm font-medium",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.name}
            </NavLink>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none truncate max-w-32">{displayName}</span>
            <span className="text-xs text-muted-foreground truncate max-w-32">{session?.user.email}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start mt-3 text-muted-foreground"
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
