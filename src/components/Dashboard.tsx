import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen, MessageSquare, Calendar, MapPin, Utensils, Bus, Shield, User, LogOut,
  MessageCircle, BarChart3, Menu, ChevronUp,
} from "lucide-react";
import { DashboardReadAloud } from "./DashboardReadAloud";
import { LearningVelocityDashboard } from "./LearningVelocityDashboard";
import { SyllabusUpload } from "./SyllabusUpload";
import { UpcomingAssignments } from "./UpcomingAssignments";
import { NotificationBell } from "./NotificationBell";
import { useStreakTracker } from "@/hooks/useStreakTracker";
import { CourseHub } from "./CourseHub";
import { TestReminders } from "./TestReminders";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import agentBHeader from "@/assets/AgentBIconHeader.png";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

interface DashboardProps {
  learningStyles: string[];
  onOpenChat: () => void;
  onRetakeQuiz: () => void;
}

const styleIcons: Record<string, string> = {
  visual: "👁️",
  auditory: "👂",
  kinesthetic: "✋",
  reading: "📖",
  writing: "✍️",
};

const styleDescriptions: Record<string, string> = {
  visual: "Learn best with images, diagrams, and visual aids",
  auditory: "Prefer listening to explanations and discussions",
  kinesthetic: "Excel through hands-on practice and doing",
  reading: "Thrive by reading and processing written content",
  writing: "Learn by taking notes and writing summaries",
};

export const Dashboard = ({ learningStyles, onOpenChat, onRetakeQuiz }: DashboardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [syllabusRefreshTrigger, setSyllabusRefreshTrigger] = useState(0);
  const [isReadAloudActive, setIsReadAloudActive] = useState(false);
  const [bottomBarOpen, setBottomBarOpen] = useState(false);

  const mainContentRef = useRef<HTMLElement>(null);

  const { profile, saveProfile } = useProfile();
  useStreakTracker();

  const handleSignOut = async () => {
    await saveProfile();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error", description: "Failed to sign out", variant: "destructive" });
    } else {
      toast({ title: "Signed out", description: "You've been successfully signed out" });
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ── Header ──────────────────────────────────── */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>

            <div className="flex items-center gap-2">
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => setIsReadAloudActive((v) => !v)}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    {isReadAloudActive ? "Stop Listening" : "Listen"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/analytics")}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Read-aloud controller (hidden but active) */}
      {isReadAloudActive && (
        <DashboardReadAloud
          isActive={isReadAloudActive}
          onToggle={() => setIsReadAloudActive((v) => !v)}
          contentRef={mainContentRef}
        />
      )}

      {/* ── Main Content ────────────────────────────── */}
      <main ref={mainContentRef} className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground">
            Welcome back{profile.first_name ? `, ${profile.first_name}` : ""}!
          </h2>
          <p className="text-muted-foreground">Your personalized learning dashboard is ready.</p>
        </div>

        {/* Test Reminders — first widget */}
        <TestReminders />

        {/* Upcoming Assignments — second widget */}
        <UpcomingAssignments />

        {/* Syllabus Upload */}
        <SyllabusUpload onUploadComplete={() => setSyllabusRefreshTrigger((prev) => prev + 1)} />

        {/* Course Hub */}
        <CourseHub refreshTrigger={syllabusRefreshTrigger} />

        {/* Learning Velocity — below Course Hub */}
        <LearningVelocityDashboard />

        {/* Learning Styles — below Course Hub */}
        <Card className="p-6 shadow-[var(--shadow-medium)] border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">Your Learning Style</h3>
            <Button variant="outline" size="sm" onClick={onRetakeQuiz}>
              Retake Quiz
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {learningStyles.map((style) => (
              <div
                key={style}
                className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-border"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{styleIcons[style]}</span>
                  <Badge variant="secondary" className="capitalize">
                    {style}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{styleDescriptions[style]}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Chat with AgentB */}
          <Card className="p-6 shadow-[var(--shadow-soft)] border-border hover:shadow-[var(--shadow-medium)] transition-[var(--transition-smooth)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Chat with AgentB</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered tutoring, explanations, and study guidance tailored to your courses
            </p>
            <Button variant="outline" className="w-full" onClick={onOpenChat}>
              Start Chatting
            </Button>
          </Card>

          {/* Campus Calendar */}
          <Card className="p-6 shadow-[var(--shadow-soft)] border-border hover:shadow-[var(--shadow-medium)] transition-[var(--transition-smooth)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Calendar className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Campus Calendar</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Academic events, deadlines, and important dates
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate("/calendar")}>
              View Calendar
            </Button>
          </Card>

          {/* Campus Map */}
          <Card className="p-6 shadow-[var(--shadow-soft)] border-border hover:shadow-[var(--shadow-medium)] transition-[var(--transition-smooth)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Campus Map</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Navigate campus buildings and facilities
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate("/campus-map")}>
              Open Map
            </Button>
          </Card>

          {/* Shuttle & Transit */}
          <Card className="p-6 shadow-[var(--shadow-soft)] border-border hover:shadow-[var(--shadow-medium)] transition-[var(--transition-smooth)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Transit & Shuttles</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Campus shuttles & public metro schedules with interactive map
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate("/transit")}>
              View Transit Map
            </Button>
          </Card>

          {/* Howard University Dining */}
          <Card className="p-6 shadow-[var(--shadow-soft)] border-border hover:shadow-[var(--shadow-medium)] transition-[var(--transition-smooth)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Utensils className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Howard University Dining</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Meal plans, menus, hours, and dining hall locations
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate("/dining")}>
              See Dining Information
            </Button>
          </Card>

          {/* Safety & Title IX */}
          <Card className="p-6 shadow-[var(--shadow-soft)] border-border hover:shadow-[var(--shadow-medium)] transition-[var(--transition-smooth)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Safety & Resources</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Emergency contacts, Title IX, and support services
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate("/safety-resources")}>
              Access Resources
            </Button>
          </Card>
        </div>
      </main>

      {/* ── Fixed Bottom AgentB Bar ──────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Expanded panel */}
        <div
          className={cn(
            "bg-card/95 backdrop-blur-md border-t border-border overflow-hidden transition-all duration-300",
            bottomBarOpen ? "max-h-28 py-3" : "max-h-0 py-0"
          )}
        >
          <div className="container mx-auto px-4 flex items-center justify-center">
            <Button
              size="lg"
              onClick={() => {
                setBottomBarOpen(false);
                onOpenChat();
              }}
              className="bg-[image:var(--gradient-primary)] hover:opacity-90 gap-2 shadow-lg"
            >
              <MessageSquare className="h-5 w-5" />
              Chat with AgentB
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <button
          onClick={() => setBottomBarOpen((v) => !v)}
          className="w-full bg-card border-t border-border px-4 py-2.5 flex items-center justify-center gap-3 hover:bg-muted/50 transition-colors"
        >
          <img src={agentBHeader} alt="AgentB" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-semibold text-sm text-foreground">AgentB</span>
          <ChevronUp
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-300",
              bottomBarOpen && "rotate-180"
            )}
          />
        </button>
      </div>
    </div>
  );
};
