import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X, ChevronRight, BookOpen, ClipboardCheck, CalendarDays, MapPin, Bus, MessageCircle } from "lucide-react";
import agentBIcon from "@/assets/AgentBIconPurple.png";

interface Tutorial {
  id: string;
  title: string;
  icon: React.ReactNode;
  steps: TutorialStep[];
}

interface TutorialStep {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  allowSkip?: boolean;
}

interface SiteTutorialGuideProps {
  onDismiss: () => void;
  onOpenChat: () => void;
  onNavigate: (path: string) => void;
}

const tutorials: Tutorial[] = [
  {
    id: "syllabus",
    title: "Upload a Syllabus",
    icon: <BookOpen className="w-4 h-4" />,
    steps: [
      {
        message: "Hey there! 🎓 Let's start by uploading a syllabus. This helps me personalize your learning experience and track your courses! Scroll down to the Course Hub and expand 'Class Syllabi' to upload one.",
        allowSkip: true,
      },
    ],
  },
  {
    id: "test-reminders",
    title: "Add a Test Reminder",
    icon: <ClipboardCheck className="w-4 h-4" />,
    steps: [
      {
        message: "Great move! 📝 Now let's set up a test reminder so you never miss an exam. Check out the 'Test Reminders' widget near the top of your dashboard — you can add upcoming tests there!",
        allowSkip: true,
      },
    ],
  },
  {
    id: "assignments",
    title: "Track Assignments",
    icon: <CalendarDays className="w-4 h-4" />,
    steps: [
      {
        message: "Nice! 📅 You can populate your 'Upcoming Assignments' by heading to your Personal Calendar and adding assignment due dates. Everything syncs automatically!",
        allowSkip: true,
      },
    ],
  },
  {
    id: "campus-resources",
    title: "Explore Campus Resources",
    icon: <MapPin className="w-4 h-4" />,
    steps: [
      {
        message: "Let me show you some handy campus tools! 🗺️ You've got quick access to the Campus Map, Safety & Resources (including Title IX info and emergency contacts), and Dining information — all right here on your dashboard. Try opening one!",
        allowSkip: true,
      },
    ],
  },
  {
    id: "transit",
    title: "Navigate Transit & Shuttles",
    icon: <Bus className="w-4 h-4" />,
    steps: [
      {
        message: "Getting around is easy! 🚌 Open 'Transit & Shuttles' to see campus shuttle routes. You can switch between 'Campus Shuttles' and 'Public Transit' tabs to view metro lines and nearby stations too!",
        allowSkip: true,
      },
    ],
  },
  {
    id: "agentb-chat",
    title: "Chat with AgentB",
    icon: <MessageCircle className="w-4 h-4" />,
    steps: [
      {
        message: "And last but not least — you can always ask me anything! 💬 Whether it's a study question, campus info, or help with an assignment, I'm here 24/7. Try sending me a message!",
        allowSkip: true,
      },
    ],
  },
];

export const SiteTutorialGuide = ({ onDismiss, onOpenChat, onNavigate }: SiteTutorialGuideProps) => {
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const allCompleted = completedTutorials.size === tutorials.length;

  const handleCompleteTutorial = (id: string) => {
    setCompletedTutorials((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setSelectedTutorial(null);
  };

  const activeTutorial = tutorials.find((t) => t.id === selectedTutorial);

  if (allCompleted) {
    return (
      <Card className="relative p-5 border-primary/30 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <div className="flex items-center gap-4">
          <img src={agentBIcon} alt="AgentB" className="w-12 h-12 rounded-xl object-cover" />
          <div className="flex-1">
            <div className="relative bg-card border border-border rounded-2xl rounded-bl-md p-4 shadow-sm">
              <p className="text-sm text-foreground">
                🎉 You're all set! You've completed all the tutorials. If you ever need help, just ask me anytime using the chat bar at the bottom. Good luck with your studies!
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Done
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="relative p-5 border-primary/30 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        {/* Close button */}
        <button
          onClick={() => setShowSkipConfirm(true)}
          className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Close tutorial"
        >
          <X className="w-4 h-4" />
        </button>

        {!activeTutorial ? (
          /* Tutorial selection view */
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={agentBIcon} alt="AgentB" className="w-12 h-12 rounded-xl object-cover" />
              <div className="relative bg-card border border-border rounded-2xl rounded-bl-md p-4 shadow-sm flex-1 mr-6">
                <p className="text-sm text-foreground">
                  👋 Welcome! I'm AgentB, your campus companion. Let me show you around! Pick a tutorial below to get started.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pl-16">
              {tutorials.map((tutorial) => {
                const done = completedTutorials.has(tutorial.id);
                return (
                  <button
                    key={tutorial.id}
                    onClick={() => !done && setSelectedTutorial(tutorial.id)}
                    disabled={done}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors ${
                      done
                        ? "bg-muted/50 border-border text-muted-foreground line-through"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <span className="shrink-0">{tutorial.icon}</span>
                    <span className="flex-1 font-medium">{tutorial.title}</span>
                    {done ? (
                      <span className="text-xs text-primary">✓</span>
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Active tutorial speech bubble */
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <img src={agentBIcon} alt="AgentB" className="w-12 h-12 rounded-xl object-cover shrink-0" />
              <div className="flex-1 mr-6">
                <div className="relative bg-card border border-border rounded-2xl rounded-bl-md p-4 shadow-sm">
                  <p className="text-sm font-semibold text-foreground mb-1">{activeTutorial.title}</p>
                  <p className="text-sm text-muted-foreground">{activeTutorial.steps[0].message}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-16">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCompleteTutorial(activeTutorial.id)}
              >
                {activeTutorial.steps[0].allowSkip ? "Maybe Later" : "Got it!"}
              </Button>
              <Button
                size="sm"
                onClick={() => handleCompleteTutorial(activeTutorial.id)}
              >
                Got it!
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Skip confirmation dialog */}
      <AlertDialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip tutorials?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to skip the remaining tutorials? You can always explore features on your own, but the guided tour won't appear again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Learning</AlertDialogCancel>
            <AlertDialogAction onClick={onDismiss}>Skip Tutorials</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
