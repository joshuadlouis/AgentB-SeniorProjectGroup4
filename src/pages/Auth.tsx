import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import agentBIcon from "@/assets/AgentBIconHeader.png";
import { checkLeakedPassword } from "@/lib/checkLeakedPassword";

const HOWARD_NAME = "Howard University";

type AuthView = "login" | "signup" | "forgot";

function TermsAndConditionsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="text-primary hover:underline font-medium">
          Terms &amp; Conditions
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms &amp; Conditions</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm text-muted-foreground">
            <h3 className="text-foreground font-semibold">1. Acceptance of Terms</h3>
            <p>By creating an account, you agree to these Terms &amp; Conditions and our Privacy Policy. If you do not agree, you may not use AgentB.</p>

            <h3 className="text-foreground font-semibold">2. Privacy &amp; Compliance</h3>
            <p>We are committed to protecting your privacy. Your personal data — including name, email, university affiliation, learning styles, and academic content — is stored securely and used solely to provide and improve the AgentB learning experience.</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Data is encrypted in transit and at rest.</li>
              <li>We comply with FERPA guidelines regarding student educational records.</li>
              <li>Your data is never sold to third parties.</li>
              <li>You may request deletion of your account and all associated data at any time from your Profile settings.</li>
            </ul>

            <h3 className="text-foreground font-semibold">3. Data Tracking Transparency</h3>
            <p>To personalize your learning experience, AgentB collects and processes the following types of data:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li><strong>Learning activity:</strong> Quiz scores, practice history, study module progress, and time spent on topics.</li>
              <li><strong>Usage analytics:</strong> Page visits, feature usage frequency, and session duration to improve platform performance.</li>
              <li><strong>Content interactions:</strong> Syllabus uploads, assignment submissions, and flashcard engagement.</li>
              <li><strong>AI interactions:</strong> Chat messages with AgentB to provide contextual academic support (not shared externally).</li>
            </ul>
            <p>You can review and manage your data consent preferences at any time in your Privacy Settings within your Profile.</p>

            <h3 className="text-foreground font-semibold">4. Appropriate Use</h3>
            <p>You agree to use AgentB for legitimate educational purposes only. You will not attempt to misuse AI-generated content for academic dishonesty or share your account credentials with others.</p>

            <h3 className="text-foreground font-semibold">5. Content Ownership</h3>
            <p>You retain ownership of all content you upload (syllabi, assignments, notes). AgentB processes this content to provide personalized learning features but does not claim ownership.</p>

            <h3 className="text-foreground font-semibold">6. Changes to Terms</h3>
            <p>We may update these terms periodically. Continued use of AgentB after changes constitutes acceptance of the updated terms. Material changes will be communicated via email or in-app notification.</p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();

    const fetchUniversities = async () => {
      const { data, error } = await supabase
        .from("universities")
        .select("id, name")
        .order("name");
      
      if (error) {
        console.error("Error fetching universities:", error);
      } else if (data) {
        // Sort Howard University to the top
        const sorted = [...data].sort((a, b) => {
          if (a.name === HOWARD_NAME) return -1;
          if (b.name === HOWARD_NAME) return 1;
          return a.name.localeCompare(b.name);
        });
        setUniversities(sorted);
      }
    };
    fetchUniversities();
  }, [navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: "Check your email",
        description: "We've sent a password reset link to your email.",
      });
      setView("login");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (view === "signup") {
        if (!fullName || !universityId) {
          toast({
            title: "Missing information",
            description: "Please fill in all fields",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!acceptedTerms) {
          toast({
            title: "Terms required",
            description: "You must agree to the Terms & Conditions to create an account.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (password.length < 8) {
          toast({
            title: "Weak password",
            description: "Password must be at least 8 characters long",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
          toast({
            title: "Weak password",
            description: "Password must contain at least one uppercase letter and one number",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const isLeaked = await checkLeakedPassword(password);
        if (isLeaked) {
          toast({
            title: "Compromised password",
            description: "This password has appeared in a data breach. Please choose a different one.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        if (data.user) {
          const updateProfile = async (retries = 3) => {
            for (let i = 0; i < retries; i++) {
              const { error: updateError } = await supabase
                .from("profiles")
                .update({ university_id: universityId })
                .eq("id", data.user!.id);
              if (!updateError) return;
              await new Promise(r => setTimeout(r, 500 * (i + 1)));
            }
          };
          await updateProfile();

          toast({
            title: "Account created!",
            description: "Welcome to AgentB!",
          });
          navigate("/");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={agentBIcon} alt="AgentB" className="w-12 h-12 rounded-xl object-cover" />
          <h1 className="text-3xl font-bold text-foreground">AgentB</h1>
        </div>

        <h2 className="text-2xl font-semibold text-center mb-6">
          {view === "signup" ? "Create Account" : view === "forgot" ? "Reset Password" : "Sign In"}
        </h2>

        {view === "forgot" ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[image:var(--gradient-primary)] hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
            <div className="text-center">
              <button onClick={() => setView("login")} className="text-primary hover:underline text-sm">
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <>
            <form onSubmit={handleAuth} className="space-y-4">
              {view === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Select value={universityId} onValueChange={setUniversityId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your university" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((uni) => (
                          <SelectItem
                            key={uni.id}
                            value={uni.id}
                            className={uni.name === HOWARD_NAME ? "font-semibold text-primary" : ""}
                          >
                            {uni.name === HOWARD_NAME ? `⭐ ${uni.name}` : uni.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {view === "login" && (
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {view === "signup" && (
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                    I agree to the <TermsAndConditionsDialog /> including Privacy &amp; Compliance policies and data tracking practices.
                  </label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[image:var(--gradient-primary)] hover:opacity-90"
                disabled={isLoading || (view === "signup" && !acceptedTerms)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : view === "signup" ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setView(view === "signup" ? "login" : "signup"); setAcceptedTerms(false); }}
                className="text-primary hover:underline"
              >
                {view === "signup"
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
