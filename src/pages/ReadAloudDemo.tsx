import { useState, useCallback, useRef, useEffect } from "react";
import { useReadAloud } from "@/hooks/useReadAloud";
import { ReadAloudPlayer } from "@/components/ReadAloudPlayer";
import { ReadAloudContent } from "@/components/ReadAloudContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Headphones, MousePointerClick, Upload, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const PLACEHOLDER_TEXT = `Paste or type any text here, or upload a document (.txt, .pdf, .docx) to get started.\n\nYou can also highlight text anywhere in the app and click "Listen" to send it here.`;

export default function ReadAloudDemo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Receive text from navigation state or search params
  const initialText = (location.state as any)?.text || "";
  const [editableText, setEditableText] = useState(initialText || "");
  const [committedText, setCommittedText] = useState(initialText || "");
  const [isDragOver, setIsDragOver] = useState(false);

  const readAloud = useReadAloud(committedText || "No content to read.");

  // If user navigates here with new text, update
  useEffect(() => {
    const incoming = (location.state as any)?.text;
    if (incoming) {
      setEditableText(incoming);
      setCommittedText(incoming);
      // Clear state so refresh doesn't re-apply
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handlePlay = useCallback(() => {
    if (editableText.trim()) {
      setCommittedText(editableText.trim());
      // Small delay to let state propagate, then play
      setTimeout(() => readAloud.play(), 50);
    }
  }, [editableText, readAloud]);

  const handleClear = useCallback(() => {
    readAloud.stop();
    setEditableText("");
    setCommittedText("");
  }, [readAloud]);

  // Commit text when user stops editing and clicks play
  useEffect(() => {
    if (!readAloud.isPlaying && editableText.trim() && editableText.trim() !== committedText) {
      setCommittedText(editableText.trim());
    }
  }, [editableText, readAloud.isPlaying]);

  // File handling
  const extractFileText = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "txt" || ext === "md") {
      return await file.text();
    }

    if (ext === "pdf") {
      // Basic PDF text extraction using browser
      toast({ title: "Processing PDF...", description: "Extracting text content" });
      const arrayBuffer = await file.arrayBuffer();
      // Simple extraction: look for text streams in PDF
      const bytes = new Uint8Array(arrayBuffer);
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      // Extract text between BT and ET markers (basic)
      const textParts: string[] = [];
      const matches = text.match(/\(([^)]+)\)/g);
      if (matches) {
        matches.forEach(m => {
          const clean = m.slice(1, -1).replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
          if (clean.length > 1 && !/^[%\/<>\[\]{}]/.test(clean)) {
            textParts.push(clean);
          }
        });
      }
      if (textParts.length > 0) {
        return textParts.join(" ").replace(/\s+/g, " ").trim();
      }
      toast({ title: "PDF Note", description: "For best results with complex PDFs, copy-paste the text directly.", variant: "default" });
      return "";
    }

    if (ext === "docx") {
      toast({ title: "Processing DOCX...", description: "Extracting text content" });
      try {
        const arrayBuffer = await file.arrayBuffer();
        // DOCX files are ZIP archives — use browser Blob + Response to read entries
        const blob = new Blob([arrayBuffer], { type: "application/zip" });
        const response = new Response(blob);
        const text = await response.text();
        // Look for XML text content between <w:t> tags
        const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (matches && matches.length > 0) {
          const extracted = matches
            .map(m => m.replace(/<[^>]+>/g, ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          if (extracted.length > 10) return extracted;
        }
      } catch {
        // Fallback
      }
      toast({ title: "DOCX Note", description: "For best results with complex .docx files, copy-paste the text directly.", variant: "default" });
      return "";
    }

    toast({ title: "Unsupported format", description: "Please use .txt, .pdf, or .docx files", variant: "destructive" });
    return "";
  }, [toast]);

  const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

  const handleFiles = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Please upload a file smaller than 3 MB.", variant: "destructive" });
      return;
    }
    const text = await extractFileText(file);
    if (text) {
      setEditableText(text);
      setCommittedText(text);
      toast({ title: "Document loaded", description: `${file.name} — ${text.length} characters extracted` });
    }
  }, [extractFileText, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Headphones className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Read Aloud</h1>
              <p className="text-xs text-muted-foreground">Auditory Navigation Framework</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Modality guide cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Headphones, title: "Listen", desc: "Press play to hear content read aloud. Adjust speed & voice.", color: "text-primary" },
            { icon: BookOpen, title: "Follow Along", desc: "Words and sentences highlight as they're spoken.", color: "text-secondary" },
            { icon: MousePointerClick, title: "Interact", desc: "Click any sentence to jump there. Drag the progress bar.", color: "text-accent" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <Card key={title} className="border-none shadow-[var(--shadow-soft)]">
              <CardContent className="p-4 flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 ${color} flex-shrink-0`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx,.md"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">Drop a document here or click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">Supports .txt, .pdf, .docx files</p>
        </div>

        {/* Editable text area */}
        <Card className="shadow-[var(--shadow-medium)]">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Content
            </CardTitle>
            <div className="flex gap-2">
              {editableText && (
                <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1.5 text-xs text-muted-foreground">
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              placeholder={PLACEHOLDER_TEXT}
              className="min-h-[200px] resize-y text-sm leading-relaxed font-normal"
              disabled={readAloud.isPlaying}
            />

            {/* Highlighted content view (visible when playing) */}
            {readAloud.isPlaying && committedText && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <ReadAloudContent
                  sentences={readAloud.sentences}
                  currentSentenceIndex={readAloud.currentSentenceIndex}
                  currentWordIndex={readAloud.currentWordIndex}
                  isPlaying={readAloud.isPlaying}
                  onClickSentence={readAloud.seekToSentence}
                />
              </div>
            )}

            {/* Play button when not playing */}
            {!readAloud.isPlaying && editableText.trim() && (
              <Button onClick={handlePlay} className="gap-2">
                <Headphones className="h-4 w-4" />
                Play
              </Button>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Bottom player */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <ReadAloudPlayer
          isPlaying={readAloud.isPlaying}
          isPaused={readAloud.isPaused}
          progress={readAloud.progress}
          rate={readAloud.rate}
          voice={readAloud.voice}
          availableVoices={readAloud.availableVoices}
          currentSentenceIndex={readAloud.currentSentenceIndex}
          totalSentences={readAloud.sentences.length}
          onTogglePlayPause={readAloud.togglePlayPause}
          onStop={readAloud.stop}
          onSkipForward={readAloud.skipForward}
          onSkipBackward={readAloud.skipBackward}
          onSeekProgress={readAloud.seekToProgress}
          onRateChange={readAloud.setRate}
          onVoiceChange={readAloud.setVoice}
        />
      </div>
    </div>
  );
}
