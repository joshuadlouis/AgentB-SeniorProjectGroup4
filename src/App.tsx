import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ConsentBanner } from "@/components/ConsentBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RequireAuth } from "@/components/RequireAuth";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { TutorialStepOverlay } from "@/components/TutorialStepOverlay";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CalendarPage from "./pages/CalendarPage";
import Profile from "./pages/Profile";
import ReadAloudDemo from "./pages/ReadAloudDemo";
import CoursePage from "./pages/CoursePage";
import TransitPage from "./pages/TransitPage";
import RubricsPage from "./pages/RubricsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CampusMapPage from "./pages/CampusMapPage";
import SafetyResourcesPage from "./pages/SafetyResourcesPage";
import DiningPage from "./pages/DiningPage";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <TutorialProvider>
              <ConsentBanner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/read-aloud" element={<RequireAuth><ReadAloudDemo /></RequireAuth>} />
                <Route path="/course/:className" element={<RequireAuth><CoursePage /></RequireAuth>} />
                <Route path="/course/:className/rubrics" element={<RequireAuth><RubricsPage /></RequireAuth>} />
                <Route path="/transit" element={<RequireAuth><TransitPage /></RequireAuth>} />
                <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
                <Route path="/campus-map" element={<RequireAuth><CampusMapPage /></RequireAuth>} />
                <Route path="/dining" element={<RequireAuth><DiningPage /></RequireAuth>} />
                <Route path="/safety-resources" element={<SafetyResourcesPage />} />
                <Route path="/analytics" element={<RequireAuth><AnalyticsPage /></RequireAuth>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <TutorialStepOverlay />
            </TutorialProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
