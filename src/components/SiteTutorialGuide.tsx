import { useState, useEffect, useCallback } from "react";
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
import { X, ChevronRight, RotateCcw, BookOpen, ClipboardCheck, CalendarDays, MapPin, Bus, MessageCircle, ArrowLeft } from "lucide-react";
import agentBIcon from "@/assets/AgentBIconPurple.png";

/* ── Step definitions ───────────────────────────────── */

interface TutorialStep {
  message: string;
  targetId?: string;
  openCollapsible?: string;
  actionLabel?: string;
  allowSkip?: boolean;
  navigateTo?: string;
  openChat?: boolean;
}

interface TutorialDef {
  id: string;
  title: string;
  icon: React.ReactNode;
  steps: TutorialStep[];
}

export interface SiteTutorialGuideProps {
  onDismiss: () => void;
  onOpenChat: () => void;
  onNavigate: (path: string) => void;
}

const tutorialDefs: TutorialDef[] = [
  {
    id: "syllabus",
    title: "Upload a Syllabus",
    icon: <BookOpen className="w-4 h-4" />,
    steps: [
      {
        message: "Let's start by uploading a syllabus! This helps me personalize your courses. 🎓 I'll take you to the Class Syllabi section now.",
        targetId: "course-hub",
        openCollapsible: "syllabi-section",
      },
      {
        message: "Here's the Class Syllabi section! You can drag-and-drop or click to upload your syllabus file. Want to upload one now?",
        targetId: "syllabi-section",
        actionLabel: "Upload",
        allowSkip: true,
      },
      {
        message: "After uploading, you can expand each syllabus to see parsed details like Course Description, Learning Objectives, and Weekly Schedule. Try clicking on a syllabus!",
        targetId: "syllabi-section",
        allowSkip: true,
      },
      {
        message: "Now check out the course that was created from your syllabus! Click 'View Course' to explore lessons, quizzes, and study materials.",
        targetId: "course-hub",
        actionLabel: "View Course",
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
        message: "Never miss an exam! 📝 Let me take you to the Test Reminders widget where you can add upcoming tests.",
        targetId: "test-reminders",
      },
      {
        message: "You can add tests manually using the '+' button, or auto-extract test dates from your uploaded syllabi. Want to add a test now?",
        targetId: "test-reminders",
        actionLabel: "Add a Test",
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
        message: "Let's set up your assignments! 📅 You can track due dates through the Upcoming Assignments widget.",
        targetId: "upcoming-assignments",
      },
      {
        message: "To add assignments, head to your Personal Calendar and create events with the 'assignment' type. They'll automatically appear here! Want to open the calendar?",
        targetId: "upcoming-assignments",
        actionLabel: "Open Calendar",
        navigateTo: "/calendar",
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
        message: "Let me show you some handy campus tools! 🗺️ Scroll down to find Campus Map, Safety & Resources, and Dining information.",
        targetId: "campus-resources-grid",
      },
      {
        message: "Try opening the Campus Map to see campus buildings and navigation!",
        targetId: "campus-map-card",
        actionLabel: "Open Map",
        navigateTo: "/campus-map",
        allowSkip: true,
      },
      {
        message: "The Safety & Resources section has emergency contacts, Title IX info, and support services.",
        targetId: "safety-card",
        actionLabel: "Open Safety",
        navigateTo: "/safety-resources",
        allowSkip: true,
      },
      {
        message: "Check out Dining for meal plans, menus, hours, and dining hall locations!",
        targetId: "dining-card",
        actionLabel: "Open Dining",
        navigateTo: "/dining",
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
        message: "Getting around is easy! 🚌 Let me show you the Transit & Shuttles widget.",
        targetId: "transit-card",
      },
      {
        message: "Open Transit to see campus shuttle routes. Once there, you can switch between 'Campus Shuttles' and 'Public Transit' tabs to view metro lines and nearby stations!",
        targetId: "transit-card",
        actionLabel: "Open Transit",
        navigateTo: "/transit",
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
        message: "Last but not least — you can always ask me anything! 💬 Whether it's a study question, campus info, or help with assignments, I'm here 24/7.",
        targetId: "agentb-card",
      },
      {
        message: "Try sending me a message! I can help with explanations, study tips, and more.",
        targetId: "agentb-card",
        actionLabel: "Chat with AgentB",
        openChat: true,
        allowSkip: true,
      },
    ],
  },
];

/* ── Helpers ─────────────────────────────────────────── */

const scrollToAndHighlight = (targetId: string) => {
  const el = document.querySelector(`[data-tutorial-id="${targetId}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("tutorial-highlight");
};

const clearHighlights = () => {
  document.querySelectorAll(".tutorial-highlight").forEach((el) => {
    el.classList.remove("tutorial-highlight");
  });
};

const openCollapsibleSection = (targetId: string) => {
  const trigger = document.querySelector(
    `[data-tutorial-id="${targetId}"] [data-state="closed"]`
  ) as HTMLButtonElement | null;
  if (trigger) trigger.click();
};

/* ── Main component ─────────────────────────────────── */

export const SiteTutorialGuide = ({ onDismiss, onOpenChat, onNavigate }: SiteTutorialGuideProps) => {
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showMaybeLaterConfirm, setShowMaybeLaterConfirm] = useState(false);

  const allCompleted = completedTutorials.size === tutorialDefs.length;
  const activeTutorial = tutorialDefs.find((t) => t.id === selectedTutorial);
  const currentStep = activeTutorial?.steps[stepIndex];
  const isActive = !!activeTutorial;

  // Scroll to & highlight target whenever step changes
  useEffect(() => {
    if (!currentStep?.targetId) return;

    if (currentStep.openCollapsible) {
      openCollapsibleSection(currentStep.openCollapsible);
    }

    const timeout = setTimeout(() => {
      clearHighlights();
      scrollToAndHighlight(currentStep.targetId!);
    }, 300);

    return () => {
      clearTimeout(timeout);
      clearHighlights();
    };
  }, [selectedTutorial, stepIndex, currentStep]);

  const handleNextStep = useCallback(() => {
    if (!activeTutorial) return;
    if (stepIndex < activeTutorial.steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setCompletedTutorials((prev) => {
        const next = new Set(prev);
        next.add(activeTutorial.id);
        return next;
      });
      clearHighlights();
      setSelectedTutorial(null);
      setStepIndex(0);
    }
  }, [activeTutorial, stepIndex]);

  const handleStepAction = useCallback(() => {
    if (!currentStep) return;
    if (currentStep.navigateTo) onNavigate(currentStep.navigateTo);
    if (currentStep.openChat) onOpenChat();
    handleNextStep();
  }, [currentStep, onNavigate, onOpenChat, handleNextStep]);

  const handleMaybeLater = useCallback(() => {
    setShowMaybeLaterConfirm(true);
  }, []);

  const confirmMaybeLater = useCallback(() => {
    clearHighlights();
    if (activeTutorial) {
      setCompletedTutorials((prev) => {
        const next = new Set(prev);
        next.add(activeTutorial.id);
        return next;
      });
    }
    setSelectedTutorial(null);
    setStepIndex(0);
    setShowMaybeLaterConfirm(false);
  }, [activeTutorial]);

  const handleSelectTutorial = (id: string) => {
    setSelectedTutorial(id);
    setStepIndex(0);
  };

  const handleBackToMenu = () => {
    clearHighlights();
    setSelectedTutorial(null);
    setStepIndex(0);
  };

  return (
    <>
      {/* Tutorial highlight styles */}
      <style>{`
        .tutorial-highlight {
          position: relative;
          z-index: 10;
          outline: 2px solid hsl(var(--primary));
          outline-offset: 4px;
          border-radius: 12px;
          animation: tutorial-pulse 2s ease-in-out infinite;
        }
        @keyframes tutorial-pulse {
          0%, 100% { outline-color: hsl(var(--primary)); }
          50% { outline-color: hsl(var(--primary) / 0.4); }
        }
      `}</style>

      {/* ── Inline menu card (shown when no tutorial active) ── */}
      {!isActive && (
        <Card className="relative p-5 border-primary/30 bg-gradient-to-r from-primary/5 via-background to-primary/5">
          <button
            onClick={() => setShowSkipConfirm(true)}
            className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close tutorial"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={agentBIcon} alt="AgentB" className="w-12 h-12 rounded-xl object-cover" />
              <div className="relative bg-card border border-border rounded-2xl rounded-bl-md p-4 shadow-sm flex-1 mr-6">
                <p className="text-sm text-foreground">
                  {allCompleted
                    ? "🎉 You've completed all the tutorials! Feel free to revisit any below, or close this widget."
                    : "👋 Welcome! I'm AgentB, your campus companion. Pick a tutorial below — I'll walk you through it step by step."}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pl-16">
              {tutorialDefs.map((tutorial) => {
                const done = completedTutorials.has(tutorial.id);
                return (
                  <button
                    key={tutorial.id}
                    onClick={() => handleSelectTutorial(tutorial.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors ${
                      done
                        ? "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50 hover:border-primary/30"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <span className="shrink-0">{tutorial.icon}</span>
                    <span className="flex-1 font-medium">{tutorial.title}</span>
                    {done ? (
                      <span className="flex items-center gap-1 text-xs text-primary">✓ <RotateCcw className="w-3 h-3" /></span>
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>

            {allCompleted && (
              <div className="pl-16 pt-2 border-t border-border mt-2">
                <p className="text-sm text-muted-foreground mb-3">
                  All tutorials completed! Would you like to close this widget?
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => {}}>No</Button>
                  <Button size="sm" onClick={() => setShowCloseConfirm(true)}>Yes</Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Fixed bottom tutorial step bar (shown during active tutorial) ── */}
      {isActive && activeTutorial && currentStep && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-primary/30 bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
          <div className="container mx-auto px-4 py-4">
            {/* Top row: back + progress + close */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handleBackToMenu}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to tutorials
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  Step {stepIndex + 1} of {activeTutorial.steps.length}
                </span>
                {/* Progress dots */}
                <div className="flex items-center gap-1">
                  {activeTutorial.steps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i <= stepIndex ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Speech bubble row */}
            <div className="flex items-start gap-3">
              <img src={agentBIcon} alt="AgentB" className="w-10 h-10 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="bg-muted/50 border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <p className="text-xs font-semibold text-primary mb-0.5">{activeTutorial.title}</p>
                  <p className="text-sm text-foreground">{currentStep.message}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMaybeLater}
                >
                  Maybe Later
                </Button>
                <Button size="sm" onClick={handleStepAction}>
                  {currentStep.actionLabel || "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skip all confirmation */}
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

      {/* Close widget confirmation */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close tutorial widget?</AlertDialogTitle>
            <AlertDialogDescription>
              The tutorial guide will be removed from your dashboard. You can always explore features on your own or ask AgentB for help anytime!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep It</AlertDialogCancel>
            <AlertDialogAction onClick={onDismiss}>Close Widget</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Maybe Later confirmation */}
      <AlertDialog open={showMaybeLaterConfirm} onOpenChange={setShowMaybeLaterConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit this tutorial?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to skip the rest of "{activeTutorial?.title}"? You can always come back to it from the tutorial menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Tutorial</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMaybeLater}>Exit Tutorial</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
