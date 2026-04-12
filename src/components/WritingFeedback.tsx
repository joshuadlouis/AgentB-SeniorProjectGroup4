import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  PenLine, Upload, Loader2, CheckCircle2, AlertTriangle,
  ArrowRight, Star, Lightbulb, FileText, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WritingFeedbackProps {
  className: string;
}

interface Improvement {
  area: string;
  issue: string;
  suggestion: string;
  example?: string;
}

interface RubricScore {
  criterion: string;
  score: number;
  comment: string;
}

interface Feedback {
  overallScore: number;
  strengths: string[];
  improvements: Improvement[];
  rubricScores?: RubricScore[];
  nextSteps: string[];
  detailedNarrative: string;
}

export function WritingFeedback({ className }: WritingFeedbackProps) {
  const [text, setText] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept text-based files
    const allowedTypes = ["text/plain", "text/markdown", "text/csv", "application/json"];
    const allowedExts = [".txt", ".md", ".csv", ".json"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a .txt, .md, or plain text file. For PDFs/DOCX, paste the text directly.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 500_000) {
      toast({ title: "File too large", description: "Max 500KB for text files.", variant: "destructive" });
      return;
    }

    const content = await file.text();
    setText(content);
    setFileName(file.name);
    toast({ title: "File loaded", description: `${file.name} — ${content.length} characters` });
  }, [toast]);

  const submitForFeedback = async () => {
    if (text.trim().length < 20) {
      toast({ title: "Too short", description: "Please provide at least 20 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const { data, error } = await supabase.functions.invoke("writing-feedback", {
        body: {
          text: text.trim(),
          className,
          assignmentTitle: assignmentTitle.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setFeedback(data.feedback);
      toast({ title: "Feedback ready!", description: `Score: ${data.feedback.overallScore}/10` });
    } catch (error) {
      console.error("Feedback error:", error);
      toast({
        title: "Feedback failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score: number, max: number = 10) => {
    const pct = score / max;
    if (pct >= 0.8) return "text-emerald-600";
    if (pct >= 0.6) return "text-amber-500";
    return "text-destructive";
  };

  return (
    <Card className="p-6 border-border shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <PenLine className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Writing Feedback</h3>
          <p className="text-xs text-muted-foreground">Get instant, teaching-style feedback on your writing assignments</p>
        </div>
      </div>

      {!feedback ? (
        <div className="space-y-4">
          {/* Assignment title (optional) */}
          <div>
            <label className="text-xs font-medium text-foreground">Assignment Title (optional)</label>
            <input
              type="text"
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              placeholder="e.g., Lab Report #3"
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Text input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-foreground">Your Writing</label>
              <div className="flex items-center gap-2">
                {fileName && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <FileText className="w-3 h-3" />
                    {fileName}
                    <button onClick={() => { setFileName(null); setText(""); }} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept=".txt,.md,.csv,.json" onChange={handleFileUpload} />
                  <span className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Upload className="w-3 h-3" /> Upload file
                  </span>
                </label>
              </div>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type your writing here... (min 20 characters)"
              className="min-h-[200px] text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{text.length} characters</p>
          </div>

          <Button
            onClick={submitForFeedback}
            disabled={loading || text.trim().length < 20}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing your writing...
              </>
            ) : (
              <>
                <Lightbulb className="w-4 h-4" />
                Get AI Feedback
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Score header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold ${scoreColor(feedback.overallScore)}`}>
                {feedback.overallScore}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">/ 10</div>
                <div className="text-xs text-muted-foreground">Overall Score</div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setFeedback(null)} className="text-xs gap-1">
              <PenLine className="w-3 h-3" /> New Submission
            </Button>
          </div>

          <Progress value={feedback.overallScore * 10} className="h-2" />

          {/* Detailed narrative */}
          <div className="bg-muted/30 rounded-lg p-4 text-sm text-foreground leading-relaxed">
            {feedback.detailedNarrative}
          </div>

          <Separator />

          {/* Strengths */}
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Strengths
            </h4>
            <ul className="space-y-1.5">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <Star className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Areas for Improvement
            </h4>
            <div className="space-y-3">
              {feedback.improvements.map((imp, i) => (
                <div key={i} className="border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{imp.area}</Badge>
                  </div>
                  <p className="text-xs text-foreground mb-1"><strong>Issue:</strong> {imp.issue}</p>
                  <p className="text-xs text-primary"><strong>Suggestion:</strong> {imp.suggestion}</p>
                  {imp.example && (
                    <div className="mt-2 bg-muted/50 rounded p-2 text-xs text-muted-foreground italic">
                      Example: "{imp.example}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rubric Scores */}
          {feedback.rubricScores && feedback.rubricScores.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Rubric Scores</h4>
                <div className="space-y-2">
                  {feedback.rubricScores.map((rs, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`text-lg font-bold w-8 text-center ${scoreColor(rs.score, 5)}`}>
                        {rs.score}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-foreground">{rs.criterion}</div>
                        <div className="text-xs text-muted-foreground">{rs.comment}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Next Steps */}
          <div>
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
              <ArrowRight className="w-4 h-4 text-primary" /> Next Steps
            </h4>
            <ol className="space-y-1.5">
              {feedback.nextSteps.map((step, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="font-mono text-primary shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Card>
  );
}
