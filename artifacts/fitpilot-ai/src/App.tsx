import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import { ThemeProvider } from '@/components/theme-provider';
import { Shell } from '@/components/layout/Shell';

import { Dashboard } from '@/pages/Dashboard';
import { Members } from '@/pages/Members';
import { MemberProfile } from '@/pages/MemberProfile';
import { Programs } from '@/pages/Programs';
import { Schedule } from '@/pages/Schedule';
import { Attendance } from '@/pages/Attendance';
import { Insights } from '@/pages/Insights';
import { Auth } from "@/pages/Auth";
import { SupabaseAuthProvider, useSupabaseAuth } from "@/contexts/supabase-auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <ThemeProvider defaultTheme="dark" storageKey="fitpilot-theme">
      <SupabaseAuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={150}>
            <BrowserRouter basename={basename}>
              <AuthAwareRoutes />
            </BrowserRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </SupabaseAuthProvider>
    </ThemeProvider>
  );
}

function AuthAwareRoutes() {
  const { session, loading } = useSupabaseAuth();

  if (loading) {
    return <div className="min-h-[100dvh] bg-background" aria-label="Loading FitPilot" />;
  }

  if (!session) {
    return <Routes><Route path="*" element={<Auth />} /></Routes>;
  }

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/members/:id" element={<MemberProfile />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
