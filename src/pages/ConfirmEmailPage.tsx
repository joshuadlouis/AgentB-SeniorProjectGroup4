import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import agentBIcon from "@/assets/AgentBIconHeader.png";

type Status = "loading" | "success" | "already" | "error";

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No confirmation token found in URL.");
      return;
    }

    const confirm = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("confirm-email", {
          body: { token },
        });

        if (error) {
          setStatus("error");
          setMessage(error.message || "Failed to confirm email.");
          return;
        }

        if (data?.error) {
          setStatus("error");
          setMessage(data.error);
          return;
        }

        if (data?.message === "Email already confirmed") {
          setStatus("already");
          setMessage("Your email has already been confirmed.");
        } else {
          setStatus("success");
          setMessage("Your email has been confirmed! You can now use AgentB.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    confirm();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <img src={agentBIcon} alt="AgentB" className="w-12 h-12 rounded-xl object-cover" />
          <h1 className="text-2xl font-bold text-foreground">AgentB</h1>
        </div>

        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Confirming your email…</p>
          </div>
        )}

        {(status === "success" || status === "already") && (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <p className="text-foreground font-medium">{message}</p>
            <Button
              className="w-full bg-[image:var(--gradient-primary)] hover:opacity-90"
              onClick={() => navigate("/")}
            >
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <p className="text-destructive font-medium">{message}</p>
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Back to Sign In
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
