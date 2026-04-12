import { useEffect, useState, useRef } from "react";
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
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import agentBIcon from "@/assets/AgentBIconPurple.png";
import { useTutorial } from "@/contexts/TutorialContext";
import { tutorialDefs } from "@/data/tutorialDefs";

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

/** Fixed bottom overlay shown during an active tutorial — renders globally via App.tsx */
export const TutorialStepOverlay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    showTutorial, activeTutorialId, stepIndex,
    nextStep, exitTutorial, backToMenu, onOpenChat,
  } = useTutorial();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const hasNavigatedRef = useRef(false);

  const tutorial = tutorialDefs.find((t) => t.id === activeTutorialId);
  const step = tutorial?.steps[stepIndex];
  const isLastStep = tutorial ? stepIndex >= tutorial.steps.length - 1 : false;

  // Handle navigation for steps that have navigateTo — navigate when step changes
  useEffect(() => {
    if (!step?.navigateTo) {
      hasNavigatedRef.current = false;
      return;
    }

    // Check if we're already on the target page
    if (location.pathname === step.navigateTo) {
      hasNavigatedRef.current = true;
      return;
    }

    // Navigate to the target page
    hasNavigatedRef.current = false;
    navigate(step.navigateTo);
  }, [activeTutorialId, stepIndex, step?.navigateTo]);

  // Scroll to & highlight target whenever step changes or page loads
  useEffect(() => {
    if (!step?.targetId) return;

    if (step.openCollapsible) {
      openCollapsibleSection(step.openCollapsible);
    }

    const timeout = setTimeout(() => {
      clearHighlights();
      scrollToAndHighlight(step.targetId!);
    }, 500);

    return () => {
      clearTimeout(timeout);
      clearHighlights();
    };
  }, [activeTutorialId, stepIndex, step, location.pathname]);

  if (!showTutorial || !tutorial || !step) return null;

  const handleNext = () => {
    // For steps with openChat, trigger chat
    if (step.openChat) onOpenChat();

    if (isLastStep) {
      exitTutorial();
    } else {
      nextStep();
    }
  };

  const handleMaybeLater = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    exitTutorial();
  };

  // Determine button label
  let buttonLabel = step.actionLabel || "Next";
  if (step.isFinished) buttonLabel = "Done";
  if (isLastStep && !step.isFinished) buttonLabel = "Finish";

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

      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-primary/30 bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <div className="container mx-auto px-4 py-4">
          {/* Top row: back + progress */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={backToMenu}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to tutorials
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Step {stepIndex + 1} of {tutorial.steps.length}
              </span>
              <div className="flex items-center gap-1">
                {tutorial.steps.map((_, i) => (
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
              <div className={`border rounded-2xl rounded-bl-md px-4 py-3 ${
                step.isFinished
                  ? "bg-primary/10 border-primary/30"
                  : "bg-muted/50 border-border"
              }`}>
                <p className="text-xs font-semibold text-primary mb-0.5 flex items-center gap-1.5">
                  {step.isFinished && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {tutorial.title}
                </p>
                <p className="text-sm text-foreground">{step.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-center">
              {!step.isFinished && (
                <Button variant="outline" size="sm" onClick={handleMaybeLater}>
                  Maybe Later
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {buttonLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Exit confirmation */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit this tutorial?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to skip the rest of "{tutorial.title}"? You can always come back to it from the tutorial menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Tutorial</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>Exit Tutorial</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
