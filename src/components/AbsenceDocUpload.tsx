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
  Trash2, Eye, CheckCircle2, Clock, AlertTriangle, Mail, Lightbulb,
  Copy, RefreshCw,
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
  notification_draft: string | null;
  make_up_details: any;
  created_at: string;
  updated_at: string;
}

const REASON_OPTIONS = [
  { value: "medical", label: "Medical" },
  { value: "family_emergency", label: "Family Emergency" },
  { value: "religious", label: "Religious Observance" },
  { value: "university_event", label: "University Event" },
  { value: "other", label: "Other" },
];

const STATUS_STEPS = ["submitted", "under_review", "approved", "make_up_assigned", "completed"];
const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  submitted: { label: "Submitted", variant: "secondary", icon: Clock },
  under_review: { label: "Under Review", variant: "outline", icon: Eye },
  approved: { label: "Approved", variant: "default", icon: CheckCircle2 },
  denied: { label: "Denied", variant: "destructive", icon: AlertTriangle },
  make_up_assigned: { label: "Make-up Assigned", variant: "default", icon: Lightbulb },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
};

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-b-chat`;

export const AbsenceDocUpload = ({ className }: AbsenceDocUploadProps) => {
  const { toast } = useToast();
  const { log } = useAuditLog();

  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState<string | null>(null);
  const [generatingMakeUp, setGeneratingMakeUp] = useState<string | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  // Form state
  const [absenceDate, setAbsenceDate] = useState<Date | undefined>();
  const [reason, setReason] = useState("medical");
  const [explanation, setExplanation] = useState("");
  const [professorEmail, setProfessorEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { fetchRequests(); }, [className]);

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

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PDF or image.", variant: "destructive" });
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast({ title: "File too large", description: "Max 10 MB.", variant: "destructive" });
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
        const { error: uploadErr } = await supabase.storage.from("absence-documents").upload(filePath, file);
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
      await log("absence_doc_submitted", "absence_requests", session.user.id, { class_name: className, reason, has_file: !!file });
      toast({ title: "Request submitted", description: "Your absence documentation has been submitted securely." });
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
      if (req.file_path) await supabase.storage.from("absence-documents").remove([req.file_path]);
      await (supabase.from("absence_requests") as any).delete().eq("id", req.id);
      toast({ title: "Request deleted" });
      fetchRequests();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleDraftEmail = async (req: AbsenceRequest) => {
    setGeneratingDraft(req.id);
    try {
      const token = await getAccessToken();
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestType: "absence-notification",
          className,
          messages: [{ role: "user", content: "Draft a professor notification email for my absence." }],
          absenceData: {
            requestId: req.id,
            absenceDate: req.absence_date,
            reason: REASON_OPTIONS.find(r => r.value === req.reason)?.label || req.reason,
            explanation: req.explanation_text,
            professorEmail: req.professor_email,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to generate draft");
      const { content } = await res.json();
      // Update local state
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, notification_draft: content } : r));
      setExpandedRequest(req.id);
      toast({ title: "Email draft generated", description: "Review and copy the draft below." });
    } catch {
      toast({ title: "Draft generation failed", variant: "destructive" });
    } finally {
      setGeneratingDraft(null);
    }
  };

  const handleSuggestMakeUp = async (req: AbsenceRequest) => {
    setGeneratingMakeUp(req.id);
    try {
      const token = await getAccessToken();
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          requestType: "make-up-options",
          className,
          messages: [{ role: "user", content: "Suggest make-up work options for my absence." }],
          absenceData: {
            requestId: req.id,
            absenceDate: req.absence_date,
            reason: REASON_OPTIONS.find(r => r.value === req.reason)?.label || req.reason,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to generate suggestions");
      const { content } = await res.json();
      const details = { suggestions: content, generated_at: new Date().toISOString() };
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, make_up_details: details } : r));
      setExpandedRequest(req.id);
      toast({ title: "Make-up options generated" });
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setGeneratingMakeUp(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  // Status progress bar
  const getStatusProgress = (status: string) => {
    if (status === "denied") return -1;
    const idx = STATUS_STEPS.indexOf(status);
    return idx >= 0 ? ((idx + 1) / STATUS_STEPS.length) * 100 : 20;
  };

  return (
    <Card className="p-6 shadow-[var(--shadow-medium)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Absence Management</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="w-3 h-3" /> GDPR & FERPA compliant · Encrypted storage
          </p>
        </div>
      </div>

      <Tabs defaultValue="submit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="submit">Submit Request</TabsTrigger>
          <TabsTrigger value="status">
            Status & Actions
            {requests.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{requests.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submit" className="space-y-4 mt-4">
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
                  {REASON_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Explanation</Label>
            <Textarea placeholder="Describe the reason for your absence..." value={explanation} onChange={e => setExplanation(e.target.value)} rows={3} maxLength={2000} />
            <p className="text-xs text-muted-foreground text-right">{explanation.length}/2000</p>
          </div>

          <div className="space-y-2">
            <Label>Supporting Document (optional)</Label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{file ? file.name : "Upload PDF, JPG, PNG (max 10 MB)"}</span>
                </div>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.heic" onChange={handleFileChange} />
              </label>
              {file && <Button variant="ghost" size="icon" onClick={() => setFile(null)}><Trash2 className="w-4 h-4" /></Button>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Professor Email (optional)</Label>
            <Input type="email" placeholder="professor@university.edu" value={professorEmail} onChange={e => setProfessorEmail(e.target.value)} maxLength={255} />
            <p className="text-xs text-muted-foreground">Used to draft a notification email via AgentB</p>
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Submit Documentation
          </Button>
        </TabsContent>

        <TabsContent value="status" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No absence requests yet.</p>
          ) : (
            <div className="space-y-4">
              {requests.map(req => {
                const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.submitted;
                const Icon = cfg.icon;
                const progress = getStatusProgress(req.status);
                const isExpanded = expandedRequest === req.id;

                return (
                  <div key={req.id} className="rounded-lg border border-border overflow-hidden">
                    {/* Header */}
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedRequest(isExpanded ? null : req.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {format(new Date(req.absence_date + "T00:00:00"), "MMM d, yyyy")} — {REASON_OPTIONS.find(r => r.value === req.reason)?.label || req.reason}
                          </p>
                          <p className="text-xs text-muted-foreground">{req.file_name || "Text only"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {progress >= 0 && (
                      <div className="px-3 pb-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          {STATUS_STEPS.map(s => (
                            <span key={s} className={cn(
                              STATUS_STEPS.indexOf(s) <= STATUS_STEPS.indexOf(req.status) && "text-primary font-medium"
                            )}>
                              {STATUS_CONFIG[s]?.label}
                            </span>
                          ))}
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-border p-3 space-y-3">
                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleDraftEmail(req)} disabled={generatingDraft === req.id}>
                            {generatingDraft === req.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Mail className="w-3 h-3 mr-1" />}
                            Draft Professor Email
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleSuggestMakeUp(req)} disabled={generatingMakeUp === req.id}>
                            {generatingMakeUp === req.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Lightbulb className="w-3 h-3 mr-1" />}
                            Suggest Make-up Options
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive"><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this request?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the request and any uploaded documentation.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(req)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        {/* Notification draft */}
                        {req.notification_draft && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium flex items-center gap-1"><Mail className="w-3 h-3" /> Email Draft</Label>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => copyToClipboard(req.notification_draft!)}>
                                  <Copy className="w-3 h-3 mr-1" /> Copy
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleDraftEmail(req)} disabled={generatingDraft === req.id}>
                                  <RefreshCw className="w-3 h-3 mr-1" /> Regen
                                </Button>
                              </div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 border border-border text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                              {req.notification_draft}
                            </div>
                          </div>
                        )}

                        {/* Make-up suggestions */}
                        {req.make_up_details?.suggestions && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Make-up Options</Label>
                              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => handleSuggestMakeUp(req)} disabled={generatingMakeUp === req.id}>
                                <RefreshCw className="w-3 h-3 mr-1" /> Regen
                              </Button>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 border border-border text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                              {req.make_up_details.suggestions}
                            </div>
                          </div>
                        )}

                        {req.explanation_text && (
                          <div>
                            <Label className="text-xs font-medium">Your Explanation</Label>
                            <p className="text-sm text-muted-foreground mt-1">{req.explanation_text}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Privacy notice */}
      <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-border">
        <p className="text-xs text-muted-foreground">
          <Shield className="w-3 h-3 inline mr-1" />
          Documentation is stored in an encrypted, private bucket. All actions are logged in your audit trail.
          Export or delete anytime from Privacy Settings (GDPR Art. 17 / FERPA §99.20).
        </p>
      </div>
    </Card>
  );
};
