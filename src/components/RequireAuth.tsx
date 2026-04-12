import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth", { replace: true });
      } else {
        setAuthed(true);
      }
      setChecked(true);
    });
  }, [navigate]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return authed ? <>{children}</> : null;
};
