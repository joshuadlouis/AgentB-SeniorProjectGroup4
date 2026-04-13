import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailCheck } from "lucide-react";

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth", { replace: true });
        setChecked(true);
        return;
      }

      setAuthed(true);

      // Check email confirmation status
      const { data: profile } = await supabase
        .from("profiles")
        .select("email_confirmed")
        .eq("id", session.user.id)
        .single();

      setEmailConfirmed(profile?.email_confirmed ?? false);
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

  if (authed && emailConfirmed === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-6">
          <MailCheck className="mx-auto h-12 w-12 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Check Your Email</h2>
          <p className="text-muted-foreground text-sm">
            We sent a confirmation link to your email address. Please click the link to verify your account before continuing.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                  const { data: profile } = await supabase
                    .from("profiles")
                    .select("email_confirmed")
                    .eq("id", session.user.id)
                    .single();
                  if (profile?.email_confirmed) {
                    setEmailConfirmed(true);
                  }
                }
              }}
            >
              I've confirmed — check again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/auth", { replace: true });
              }}
            >
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return authed ? <>{children}</> : null;
};
