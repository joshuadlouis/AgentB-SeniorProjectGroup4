import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface TutorialContextType {
  showTutorial: boolean;
  activeTutorialId: string | null;
  stepIndex: number;
  completedTutorials: Set<string>;
  selectTutorial: (id: string) => void;
  nextStep: () => void;
  exitTutorial: () => void;
  backToMenu: () => void;
  dismissAll: () => void;
  onOpenChat: () => void;
  setOnOpenChat: (fn: () => void) => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const useTutorial = () => {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider");
  return ctx;
};

export const TutorialProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());
  const [openChatFn, setOpenChatFn] = useState<() => void>(() => () => {});

  // Check if tutorial should show
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const dismissed = localStorage.getItem(`tutorial_dismissed_${session.user.id}`);
        if (!dismissed) {
          setShowTutorial(true);
        }
      }
    };
    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const dismissed = localStorage.getItem(`tutorial_dismissed_${session.user.id}`);
        if (!dismissed) {
          setShowTutorial(true);
        }
      } else {
        setShowTutorial(false);
        setActiveTutorialId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const selectTutorial = useCallback((id: string) => {
    setActiveTutorialId(id);
    setStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex((prev) => prev + 1);
  }, []);

  const exitTutorial = useCallback(() => {
    // Clear highlights
    document.querySelectorAll(".tutorial-highlight").forEach((el) => {
      el.classList.remove("tutorial-highlight");
    });
    if (activeTutorialId) {
      setCompletedTutorials((prev) => {
        const next = new Set(prev);
        next.add(activeTutorialId);
        return next;
      });
    }
    setActiveTutorialId(null);
    setStepIndex(0);
    // Navigate back to dashboard
    navigate("/");
  }, [activeTutorialId, navigate]);

  const backToMenu = useCallback(() => {
    document.querySelectorAll(".tutorial-highlight").forEach((el) => {
      el.classList.remove("tutorial-highlight");
    });
    setActiveTutorialId(null);
    setStepIndex(0);
    navigate("/");
  }, [navigate]);

  const dismissAll = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      localStorage.setItem(`tutorial_dismissed_${session.user.id}`, "true");
    }
    document.querySelectorAll(".tutorial-highlight").forEach((el) => {
      el.classList.remove("tutorial-highlight");
    });
    setShowTutorial(false);
    setActiveTutorialId(null);
    setStepIndex(0);
  }, []);

  const setOnOpenChat = useCallback((fn: () => void) => {
    setOpenChatFn(() => fn);
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        showTutorial,
        activeTutorialId,
        stepIndex,
        completedTutorials,
        selectTutorial,
        nextStep,
        exitTutorial,
        backToMenu,
        dismissAll,
        onOpenChat: openChatFn,
        setOnOpenChat,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};
