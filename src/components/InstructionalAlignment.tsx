import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Target, CheckCircle2, AlertTriangle, XCircle, Loader2,
  RefreshCw, BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InstructionalAlignmentProps {
  className: string;
}

interface AlignmentResult {
  objectivesCovered: string[];
  objectivesMissing: string[];
  totalObjectives: number;
  coveragePercent: number;
  bloomCoverage: Record<string, number>;
  contentQuality: {
    chaptersWithContent: number;
    totalChapters: number;
    chaptersWithQuiz: number;
    chaptersWithExercises: number;
  };
  feedbackSummary: {
    totalRatings: number;
    avgRating: number;
    lowRatedTopics: string[];
  };
}

export function InstructionalAlignment({ className }: InstructionalAlignmentProps) {
  const [result, setResult] = useState<AlignmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runAlignment = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch syllabus objectives
      const { data: syllabus } = await supabase
        .from("syllabi")
        .select("learning_objectives, bloom_classifications")
        .eq("user_id", session.user.id)
        .eq("class_name", className)
        .maybeSingle();

      const objectives: string[] = syllabus?.learning_objectives || [];

      // Fetch course content
      const { data: chapters } = await supabase
        .from("course_content")
        .select("id, topic, lesson_content, quiz_questions, exercises, bloom_level, generation_status")
        .eq("user_id", session.user.id)
        .eq("class_name", className)
        .order("topic_order") as any;

      const allChapters = chapters || [];
      const completedChapters = allChapters.filter((c: any) => c.generation_status === "complete");

      // Check which objectives are covered by matching against chapter topics/content
      const covered: string[] = [];
      const missing: string[] = [];

      for (const obj of objectives) {
        const objLower = obj.toLowerCase();
        const isCovered = completedChapters.some((ch: any) => {
          const topicMatch = ch.topic.toLowerCase().includes(objLower.substring(0, 20)) ||
            objLower.includes(ch.topic.toLowerCase());
          const contentMatch = ch.lesson_content?.toLowerCase().includes(objLower.substring(0, 30));
          return topicMatch || contentMatch;
        });
        if (isCovered) {
          covered.push(obj);
        } else {
          missing.push(obj);
        }
      }

      // Bloom coverage
      const bloomCoverage: Record<string, number> = {};
      completedChapters.forEach((ch: any) => {
        if (ch.bloom_level) {
          bloomCoverage[ch.bloom_level] = (bloomCoverage[ch.bloom_level] || 0) + 1;
        }
      });

      // Content quality metrics
      const contentQuality = {
        chaptersWithContent: completedChapters.filter((c: any) => c.lesson_content).length,
        totalChapters: allChapters.length,
        chaptersWithQuiz: completedChapters.filter((c: any) => c.quiz_questions?.length > 0).length,
        chaptersWithExercises: completedChapters.filter((c: any) => c.exercises?.length > 0).length,
      };

      // Feedback summary
      const contentIds = completedChapters.map((c: any) => c.id);
      let feedbackSummary = { totalRatings: 0, avgRating: 0, lowRatedTopics: [] as string[] };

      if (contentIds.length > 0) {
        const { data: feedbacks } = await supabase
          .from("content_feedback" as any)
          .select("content_id, rating")
          .in("content_id", contentIds);

        if (feedbacks && feedbacks.length > 0) {
          const ratings = feedbacks as any[];
          const totalRatings = ratings.length;
          const avgRating = ratings.reduce((sum: number, f: any) => sum + f.rating, 0) / totalRatings;

          // Find low-rated content
          const ratingsByContent: Record<string, number[]> = {};
          ratings.forEach((f: any) => {
            if (!ratingsByContent[f.content_id]) ratingsByContent[f.content_id] = [];
            ratingsByContent[f.content_id].push(f.rating);
          });

          const lowRatedTopics: string[] = [];
          Object.entries(ratingsByContent).forEach(([cid, rs]) => {
            const avg = rs.reduce((a, b) => a + b, 0) / rs.length;
            if (avg < 0) {
              const ch = completedChapters.find((c: any) => c.id === cid);
              if (ch) lowRatedTopics.push(ch.topic);
            }
          });

          feedbackSummary = { totalRatings, avgRating, lowRatedTopics };
        }
      }

      const coveragePercent = objectives.length > 0
        ? Math.round((covered.length / objectives.length) * 100)
        : 0;

      setResult({
        objectivesCovered: covered,
        objectivesMissing: missing,
        totalObjectives: objectives.length,
        coveragePercent,
        bloomCoverage,
        contentQuality,
        feedbackSummary,
      });
    } catch (error) {
      console.error("Alignment check error:", error);
      toast({ title: "Error", description: "Failed to run alignment check", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [className, toast]);

  const coverageColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-600";
    if (pct >= 50) return "text-amber-500";
    return "text-destructive";
  };

  return (
    <Card className="p-6 border-border shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Instructional Alignment</h3>
            <p className="text-xs text-muted-foreground">
              Verify content coverage against syllabus objectives and quality standards
            </p>
          </div>
        </div>
        <Button size="sm" onClick={runAlignment} disabled={loading} className="gap-1.5">
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...</>
          ) : (
            <><RefreshCw className="w-3.5 h-3.5" /> Run Check</>
          )}
        </Button>
      </div>

      {!result ? (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Click "Run Check" to analyze content alignment</p>
          <p className="text-xs mt-1">Compares generated content against syllabus learning objectives</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Overall Coverage */}
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold ${coverageColor(result.coveragePercent)}`}>
              {result.coveragePercent}%
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">Objective Coverage</div>
              <Progress value={result.coveragePercent} className="h-2 mt-1" />
              <div className="text-xs text-muted-foreground mt-1">
                {result.objectivesCovered.length}/{result.totalObjectives} objectives covered
              </div>
            </div>
          </div>

          {/* Content Quality Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <div className="text-lg font-bold text-foreground">
                {result.contentQuality.chaptersWithContent}/{result.contentQuality.totalChapters}
              </div>
              <div className="text-[10px] text-muted-foreground">Chapters Generated</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <div className="text-lg font-bold text-foreground">{result.contentQuality.chaptersWithQuiz}</div>
              <div className="text-[10px] text-muted-foreground">With Quizzes</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <div className="text-lg font-bold text-foreground">{result.contentQuality.chaptersWithExercises}</div>
              <div className="text-[10px] text-muted-foreground">With Exercises</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/30">
              <div className="text-lg font-bold text-foreground">{result.feedbackSummary.totalRatings}</div>
              <div className="text-[10px] text-muted-foreground">Student Ratings</div>
            </div>
          </div>

          {/* Bloom Coverage */}
          {Object.keys(result.bloomCoverage).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2">Bloom's Taxonomy Coverage</h4>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(result.bloomCoverage).map(([level, count]) => (
                  <Badge key={level} variant="secondary" className="text-[10px]">
                    {level}: {count} chapters
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Missing Objectives */}
          {result.objectivesMissing.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Uncovered Objectives ({result.objectivesMissing.length})
              </h4>
              <div className="space-y-1">
                {result.objectivesMissing.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <XCircle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                    {obj}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Covered Objectives */}
          {result.objectivesCovered.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Covered Objectives ({result.objectivesCovered.length})
              </h4>
              <div className="space-y-1">
                {result.objectivesCovered.slice(0, 5).map((obj, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                    {obj}
                  </div>
                ))}
                {result.objectivesCovered.length > 5 && (
                  <p className="text-[10px] text-muted-foreground ml-5">
                    + {result.objectivesCovered.length - 5} more covered
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Low-Rated Content Flag */}
          {result.feedbackSummary.lowRatedTopics.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  Content Flagged for Refinement
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  These chapters received negative feedback and may benefit from AI refinement:
                </p>
                <div className="space-y-1">
                  {result.feedbackSummary.lowRatedTopics.map((topic, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-destructive/30 text-destructive mr-1">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Overall Assessment */}
          <div className={`p-3 rounded-lg border ${
            result.coveragePercent >= 80 && result.feedbackSummary.lowRatedTopics.length === 0
              ? "bg-emerald-500/10 border-emerald-500/20"
              : result.coveragePercent >= 50
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-destructive/10 border-destructive/20"
          }`}>
            <p className="text-xs font-medium text-foreground">
              {result.coveragePercent >= 80 && result.feedbackSummary.lowRatedTopics.length === 0
                ? "✅ Content is well-aligned with syllabus objectives and maintains high quality."
                : result.coveragePercent >= 50
                ? "⚠️ Partial coverage. Consider generating content for uncovered objectives and refining flagged chapters."
                : "❌ Significant gaps in objective coverage. Upload a syllabus and generate additional chapters to improve alignment."}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
