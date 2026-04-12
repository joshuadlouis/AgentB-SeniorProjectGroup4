import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText, Upload, Calendar as CalendarIcon, Shield, Loader2,
  Trash2, Eye, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AbsenceDocUploadProps {
  className: string;
}

interface AbsenceRequest {
  id: string;
  class_name: string;
  absence_date: string;
  reason: string;
  explanation_text: string | null;
  file_name: string | null;
  file_path: string | null;
  status: string;
  professor_email: string | null;
  created_at: string;
}

const REASON_OPTIONS = [
  { value: "medical", label: "Medical" },
  { value: "family_emergency", label: "Family Emergency" },
  { value: "religious", label: "Religious Observance" },
  { value: "university_event", label: "University Event" },
  { value: "other", label: "Other" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  submitted: { label: "Submitted", variant: "secondary", icon: Clock },
  under_review: { label: "Under Review", variant: "outline", icon: Eye },
  approved: { label: "Approved", variant: "default", icon: CheckCircle2 },
  denied: { label: "Denied", variant: "destructive", icon: AlertTriangle },
  make_up_assigned: { label: "Make-up Assigned", variant: "default", icon: CheckCircle2 },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
};

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const AbsenceDocUpload = ({ className }: AbsenceDocUploadProps) => {
  const { toast } = useToast();
  const { log } = useAuditLog();

  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [absenceDate, setAbsenceDate] = useState<Date | undefined>();
  const [reason, setReason] = useState("medical");
  const [explanation, setExplanation] = useState("");
  const [professorEmail, setProfessorEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [className]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await (supabase.from("absence_requests") as any)
      .select("*")
      .eq("user_id", session.user.id)
      .eq("class_name", className)
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PDF or image (JPG, PNG, WebP, HEIC).", variant: "destructive" });
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Maximum file size is 10 MB.", variant: "destructive" });
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async () => {
    if (!absenceDate) {
      toast({ title: "Missing date", description: "Please select the absence date.", variant: "destructive" });
      return;
    }
    if (!explanation.trim() && !file) {
      toast({ title: "Missing documentation", description: "Please provide an explanation or upload a document.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      let filePath: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        filePath = `${session.user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("absence-documents")
          .upload(filePath, file);
        if (uploadErr) throw uploadErr;
        fileName = file.name;
        fileSize = file.size;
      }

      const { error } = await (supabase.from("absence_requests") as any).insert({
        user_id: session.user.id,
        class_name: className,
        absence_date: format(absenceDate, "yyyy-MM-dd"),
        reason,
        explanation_text: explanation.trim() || null,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        professor_email: professorEmail.trim() || null,
      });
      if (error) throw error;

      await log("absence_doc_submitted", "absence_requests", session.user.id, {
        class_name: className,
        reason,
        has_file: !!file,
      });

      toast({ title: "Request submitted", description: "Your absence documentation has been submitted securely." });

      // Reset form
      setAbsenceDate(undefined);
      setReason("medical");
      setExplanation("");
      setProfessorEmail("");
      setFile(null);
      fetchRequests();
    } catch (err) {
      toast({ title: "Submission failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (req: AbsenceRequest) => {
    try {
      if (req.file_path) {
        await supabase.storage.from("absence-documents").remove([req.file_path]);
      }
      await (supabase.from("absence_requests") as any).delete().eq("id", req.id);
      toast({ title: "Request deleted" });
      fetchRequests();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <Card className="p-6 shadow-[var(--shadow-medium)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Absence Documentation</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="w-3 h-3" /> GDPR & FERPA compliant · Encrypted storage
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Absence Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !absenceDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {absenceDate ? format(absenceDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={absenceDate} onSelect={setAbsenceDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Explanation</Label>
          <Textarea
            placeholder="Describe the reason for your absence..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground text-right">{explanation.length}/2000</p>
        </div>

        <div className="space-y-2">
          <Label>Supporting Document (optional)</Label>
          <div className="flex items-center gap-3">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : "Upload PDF, JPG, PNG (max 10 MB)"}
                </span>
              </div>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic" onChange={handleFileChange} />
            </label>
            {file && (
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Professor Email (optional)</Label>
          <Input
            type="email"
            placeholder="professor@university.edu"
            value={professorEmail}
            onChange={(e) => setProfessorEmail(e.target.value)}
            maxLength={255}
          />
          <p className="text-xs text-muted-foreground">Used to draft a notification email via AgentB</p>
        </div>

        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
          Submit Documentation
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Previous Requests</h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No absence requests for this course yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.submitted;
              const Icon = cfg.icon;
              return (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {format(new Date(req.absence_date + "T00:00:00"), "MMM d, yyyy")} — {REASON_OPTIONS.find((r) => r.value === req.reason)?.label || req.reason}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {req.file_name || "Text only"} · {format(new Date(req.created_at), "MMM d")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this request?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the absence request and any uploaded documentation.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(req)} className="bg-destructive text-destructive-foreground">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-border">
        <p className="text-xs text-muted-foreground">
          <Shield className="w-3 h-3 inline mr-1" />
          Your documentation is stored in an encrypted, private bucket accessible only to you.
          All uploads are logged in your audit trail. You can export or delete this data
          anytime from Privacy Settings (GDPR Art. 17 / FERPA §99.20).
        </p>
      </div>
    </Card>
  );
};
