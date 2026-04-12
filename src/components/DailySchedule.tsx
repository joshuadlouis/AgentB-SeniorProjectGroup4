import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Trash2, GraduationCap, MapPin } from "lucide-react";

interface ScheduleEntry {
  id: string;
  class_name: string;
  room: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string | null;
  source: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const fmt12 = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
};

export const DailySchedule = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ class_name: "", room: "", day_of_week: "", start_time: "", end_time: "" });
  const [saving, setSaving] = useState(false);

  const today = new Date().getDay();

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data, error } = await (supabase.from("class_schedule" as any) as any)
      .select("*")
      .eq("user_id", session.user.id)
      .order("start_time", { ascending: true });

    if (!error && data) setEntries(data);
    setLoading(false);
  };

  const todayEntries = entries
    .filter((e) => e.day_of_week === today)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const handleAdd = async () => {
    if (!form.class_name.trim() || !form.start_time || form.day_of_week === "") return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setSaving(true);
    const { error } = await (supabase.from("class_schedule" as any) as any).insert({
      user_id: session.user.id,
      class_name: form.class_name.trim(),
      room: form.room.trim() || null,
      day_of_week: parseInt(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time || null,
      source: "manual",
    });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to add class.", variant: "destructive" });
    } else {
      toast({ title: "Class Added", description: `${form.class_name} added to your schedule.` });
      setForm({ class_name: "", room: "", day_of_week: "", start_time: "", end_time: "" });
      setDialogOpen(false);
      fetchSchedule();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from("class_schedule" as any) as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to remove class.", variant: "destructive" });
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const isCurrentClass = (entry: ScheduleEntry) => {
    const now = new Date();
    const [sh, sm] = entry.start_time.split(":").map(Number);
    const start = new Date(now); start.setHours(sh, sm, 0, 0);
    if (entry.end_time) {
      const [eh, em] = entry.end_time.split(":").map(Number);
      const end = new Date(now); end.setHours(eh, em, 0, 0);
      return now >= start && now <= end;
    }
    // If no end time, consider "current" for 75 minutes
    const end = new Date(start.getTime() + 75 * 60000);
    return now >= start && now <= end;
  };

  if (loading) return null;

  return (
    <Card className="p-6 shadow-[var(--shadow-medium)] border-border" role="region" aria-label="Today's class schedule">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10">
            <GraduationCap className="w-6 h-6 text-secondary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Today's Classes</h3>
            <p className="text-xs text-muted-foreground">{DAY_NAMES[today]}</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Class Time</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Course Name *</Label>
                <Input
                  placeholder="e.g. Structures of Programming Languages"
                  value={form.class_name}
                  onChange={(e) => setForm((f) => ({ ...f, class_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Room / Location</Label>
                <Input
                  placeholder="e.g. Academic Support Building B, Room 116"
                  value={form.room}
                  onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                />
              </div>
              <div>
                <Label>Day of the Week *</Label>
                <Select value={form.day_of_week} onValueChange={(v) => setForm((f) => ({ ...f, day_of_week: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((name, i) => (
                      <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Time *</Label>
                  <Input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                  />
                </div>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={saving || !form.class_name.trim() || !form.start_time || form.day_of_week === ""}>
                {saving ? "Adding..." : "Add to Schedule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {todayEntries.length > 0 ? (
        <div className="space-y-2">
          {todayEntries.map((entry) => {
            const current = isCurrentClass(entry);
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  current
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-muted/30"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{entry.class_name}</p>
                    {current && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">Now</Badge>
                    )}
                    {entry.source === "syllabus" && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Syllabus</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {fmt12(entry.start_time)}
                      {entry.end_time && ` – ${fmt12(entry.end_time)}`}
                    </span>
                    {entry.room && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {entry.room}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No classes scheduled for today.</p>
      )}

      {/* Quick peek at rest of the week */}
      {entries.filter((e) => e.day_of_week !== today).length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">This Week</p>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const count = entries.filter((e) => e.day_of_week === day).length;
              if (count === 0) return null;
              return (
                <Badge
                  key={day}
                  variant={day === today ? "default" : "outline"}
                  className="text-[10px] px-2 py-0.5"
                >
                  {DAY_ABBR[day]} · {count}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
