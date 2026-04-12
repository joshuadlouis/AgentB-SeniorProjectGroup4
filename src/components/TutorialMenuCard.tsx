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
import { X, ChevronRight, RotateCcw } from "lucide-react";
import { useState } from "react";
import agentBIcon from "@/assets/AgentBIconPurple.png";
import { useTutorial } from "@/contexts/TutorialContext";
import { tutorialDefs } from "@/data/tutorialDefs";

/** Inline card shown in Dashboard for selecting tutorials */
export const TutorialMenuCard = () => {
  const { completedTutorials, selectTutorial, dismissAll, activeTutorialId } = useTutorial();
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const allCompleted = completedTutorials.size === tutorialDefs.length;

  // Don't show menu when a tutorial is active (overlay is showing instead)
  if (activeTutorialId) return null;

  return (
    <>
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
                  onClick={() => selectTutorial(tutorial.id)}
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

      <AlertDialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip tutorials?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to skip the remaining tutorials? The guided tour won't appear again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Learning</AlertDialogCancel>
            <AlertDialogAction onClick={dismissAll}>Skip Tutorials</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close tutorial widget?</AlertDialogTitle>
            <AlertDialogDescription>
              The tutorial guide will be removed from your dashboard. Ask AgentB for help anytime!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep It</AlertDialogCancel>
            <AlertDialogAction onClick={dismissAll}>Close Widget</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
