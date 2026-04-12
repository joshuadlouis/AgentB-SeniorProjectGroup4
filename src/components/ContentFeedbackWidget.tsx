import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ContentFeedbackWidgetProps {
  contentId: string;
  topic: string;
}

export function ContentFeedbackWidget({ contentId, topic }: ContentFeedbackWidgetProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("content_feedback" as any)
        .select("rating, feedback_text")
        .eq("user_id", session.user.id)
        .eq("content_id", contentId)
        .maybeSingle();

      if (data) {
        setRating((data as any).rating);
        setFeedbackText((data as any).feedback_text || "");
        setSaved(true);
      }
    };
    load();
  }, [contentId]);

  const submitFeedback = useCallback(async (newRating: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setSaving(true);
    setRating(newRating);

    const payload = {
      user_id: session.user.id,
      content_id: contentId,
      rating: newRating,
      feedback_text: feedbackText.trim() || null,
      feedback_type: "explicit",
      updated_at: new Date().toISOString(),
    };

    // Upsert: try update first, then insert
    if (saved) {
      await supabase
        .from("content_feedback" as any)
        .update({ rating: newRating, feedback_text: feedbackText.trim() || null, updated_at: new Date().toISOString() })
        .eq("user_id", session.user.id)
        .eq("content_id", contentId);
    } else {
      await supabase.from("content_feedback" as any).insert(payload);
      setSaved(true);
    }

    setSaving(false);
    toast({
      title: newRating === 1 ? "👍 Thanks for the feedback!" : "👎 We'll work on improving this",
      description: "Your feedback helps us improve content quality.",
    });
  }, [contentId, feedbackText, saved, toast]);

  const saveComment = async () => {
    if (!saved || rating === null) return;
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    await supabase
      .from("content_feedback" as any)
      .update({ feedback_text: feedbackText.trim() || null, updated_at: new Date().toISOString() })
      .eq("user_id", session.user.id)
      .eq("content_id", contentId);

    setSaving(false);
    setShowComment(false);
    toast({ title: "Comment saved" });
  };

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-border mt-3">
      <span className="text-xs text-muted-foreground">Was this helpful?</span>
      <Button
        variant={rating === 1 ? "default" : "outline"}
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => submitFeedback(1)}
        disabled={saving}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant={rating === -1 ? "destructive" : "outline"}
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => submitFeedback(-1)}
        disabled={saving}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </Button>
      {rating !== null && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setShowComment(!showComment)}
        >
          <MessageSquare className="w-3 h-3" />
          {showComment ? "Hide" : "Add comment"}
        </Button>
      )}
      {saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}

      {showComment && (
        <div className="flex items-center gap-2 flex-1">
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="What could be improved?"
            className="text-xs min-h-[32px] h-8 py-1"
          />
          <Button size="sm" className="h-7 text-xs" onClick={saveComment} disabled={saving}>
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
