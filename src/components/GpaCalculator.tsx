import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Plus, Trash2, Calculator, TrendingUp, GraduationCap, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  name: string;
  credits: number;
  grade: number;
}

interface Semester {
  id: string;
  name: string;
  term: "Fall" | "Spring" | "Summer";
  year: number;
  courses: Course[];
  isOpen: boolean;
}

const GRADE_OPTIONS = [
  { label: "A  (4.0)", value: 4.0 },
  { label: "A- (3.7)", value: 3.7 },
  { label: "B+ (3.3)", value: 3.3 },
  { label: "B  (3.0)", value: 3.0 },
  { label: "B- (2.7)", value: 2.7 },
  { label: "C+ (2.3)", value: 2.3 },
  { label: "C  (2.0)", value: 2.0 },
  { label: "C- (1.7)", value: 1.7 },
  { label: "D+ (1.3)", value: 1.3 },
  { label: "D  (1.0)", value: 1.0 },
  { label: "F  (0.0)", value: 0.0 },
];

const uid = () => crypto.randomUUID();

export const GpaCalculator = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [cumulativeGpa, setCumulativeGpa] = useState<number | null>(null);
  const [targetGpa, setTargetGpa] = useState("");
  const [projCredits, setProjCredits] = useState("15");
  const [projection, setProjection] = useState<string | null>(null);
  const { toast } = useToast();

  /* ---- semester CRUD ---- */
  const addSemester = () => {
    setSemesters((prev) => [
      ...prev,
      {
        id: uid(),
        name: "",
        term: "Fall",
        year: new Date().getFullYear(),
        courses: [],
        isOpen: true,
      },
    ]);
  };

  const removeSemester = (id: string) =>
    setSemesters((prev) => prev.filter((s) => s.id !== id));

  const updateSemester = (id: string, patch: Partial<Semester>) =>
    setSemesters((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );

  const toggleSemester = (id: string) =>
    updateSemester(id, {
      isOpen: !semesters.find((s) => s.id === id)?.isOpen,
    });

  /* ---- course CRUD ---- */
  const addCourse = (semId: string) =>
    setSemesters((prev) =>
      prev.map((s) =>
        s.id === semId
          ? { ...s, courses: [...s.courses, { id: uid(), name: "", credits: 3, grade: 4.0 }] }
          : s
      )
    );

  const removeCourse = (semId: string, courseId: string) =>
    setSemesters((prev) =>
      prev.map((s) =>
        s.id === semId
          ? { ...s, courses: s.courses.filter((c) => c.id !== courseId) }
          : s
      )
    );

  const updateCourse = (semId: string, courseId: string, patch: Partial<Course>) =>
    setSemesters((prev) =>
      prev.map((s) =>
        s.id === semId
          ? {
              ...s,
              courses: s.courses.map((c) =>
                c.id === courseId ? { ...c, ...patch } : c
              ),
            }
          : s
      )
    );

  /* ---- calculations ---- */
  const allCourses = useMemo(
    () => semesters.flatMap((s) => s.courses),
    [semesters]
  );

  const calculateGpa = () => {
    if (allCourses.length === 0) {
      toast({ title: "No courses", description: "Add at least one course to calculate GPA.", variant: "destructive" });
      return;
    }
    const totalCredits = allCourses.reduce((sum, c) => sum + c.credits, 0);
    const totalPoints = allCourses.reduce((sum, c) => sum + c.grade * c.credits, 0);
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    setCumulativeGpa(parseFloat(gpa.toFixed(3)));
  };

  const semesterGpa = (courses: Course[]) => {
    const cr = courses.reduce((s, c) => s + c.credits, 0);
    const pts = courses.reduce((s, c) => s + c.grade * c.credits, 0);
    return cr > 0 ? (pts / cr).toFixed(2) : "—";
  };

  const calculateProjection = () => {
    if (cumulativeGpa === null) {
      toast({ title: "Calculate GPA first", description: "Press Calculate GPA before projecting.", variant: "destructive" });
      return;
    }
    const target = parseFloat(targetGpa);
    const futureCr = parseFloat(projCredits);
    if (isNaN(target) || isNaN(futureCr) || futureCr <= 0) {
      toast({ title: "Invalid input", description: "Enter a valid target GPA and projected credit hours.", variant: "destructive" });
      return;
    }
    if (target > 4.0 || target < 0) {
      toast({ title: "Invalid target", description: "GPA must be between 0.0 and 4.0.", variant: "destructive" });
      return;
    }

    const currentCredits = allCourses.reduce((s, c) => s + c.credits, 0);
    const currentPoints = cumulativeGpa * currentCredits;
    const neededPoints = target * (currentCredits + futureCr) - currentPoints;
    const neededGpa = neededPoints / futureCr;

    if (neededGpa > 4.0) {
      setProjection(
        `To reach a ${target.toFixed(2)} GPA, you would need a ${neededGpa.toFixed(2)} GPA over ${futureCr} credits — which exceeds the 4.0 maximum. Consider adding more projected credit hours or adjusting your target.`
      );
    } else if (neededGpa < 0) {
      setProjection(
        `Your current GPA already exceeds ${target.toFixed(2)}! Even with all F's over ${futureCr} credits, you'd stay above your target.`
      );
    } else {
      setProjection(
        `To reach a ${target.toFixed(2)} cumulative GPA, you need an average GPA of ${neededGpa.toFixed(2)} over your next ${futureCr} credit hours.`
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Semesters */}
      {semesters.map((sem) => (
        <Card key={sem.id} className="border border-border overflow-hidden">
          {/* Semester header */}
          <div
            className="flex items-center justify-between p-3 bg-muted/40 cursor-pointer"
            onClick={() => toggleSemester(sem.id)}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={sem.term}
                onValueChange={(v) => updateSemester(sem.id, { term: v as Semester["term"] })}
              >
                <SelectTrigger
                  className="w-28 h-8 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fall">Fall</SelectItem>
                  <SelectItem value="Spring">Spring</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                className="w-20 h-8 text-xs"
                value={sem.year}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateSemester(sem.id, { year: parseInt(e.target.value) || new Date().getFullYear() })}
              />

              {sem.courses.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Sem GPA: {semesterGpa(sem.courses)}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={(e) => { e.stopPropagation(); removeSemester(sem.id); }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              {sem.isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>

          {/* Courses */}
          {sem.isOpen && (
            <div className="p-3 space-y-2">
              {sem.courses.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No courses yet — add one below.
                </p>
              )}

              {sem.courses.map((course) => (
                <div key={course.id} className="flex items-center gap-2 flex-wrap">
                  <Input
                    placeholder="Course name"
                    className="flex-1 min-w-[120px] h-8 text-xs"
                    value={course.name}
                    onChange={(e) => updateCourse(sem.id, course.id, { name: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    className="w-20 h-8 text-xs"
                    placeholder="Credits"
                    value={course.credits}
                    onChange={(e) => updateCourse(sem.id, course.id, { credits: parseInt(e.target.value) || 3 })}
                  />
                  <Select
                    value={String(course.grade)}
                    onValueChange={(v) => updateCourse(sem.id, course.id, { grade: parseFloat(v) })}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={String(g.value)}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeCourse(sem.id, course.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => addCourse(sem.id)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Course
              </Button>
            </div>
          )}
        </Card>
      ))}

      {/* Add semester + Calculate */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={addSemester}>
          <Plus className="w-4 h-4 mr-1" /> Add Semester
        </Button>
        <Button size="sm" onClick={calculateGpa} disabled={allCourses.length === 0}>
          <Calculator className="w-4 h-4 mr-1" /> Calculate GPA
        </Button>
      </div>

      {/* Result */}
      {cumulativeGpa !== null && (
        <Card className="p-4 border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cumulative GPA</p>
              <p className="text-2xl font-bold text-primary">{cumulativeGpa.toFixed(2)}</p>
            </div>
            <Badge variant="secondary" className="ml-auto text-xs">
              {allCourses.reduce((s, c) => s + c.credits, 0)} total credits
            </Badge>
          </div>
        </Card>
      )}

      {/* Projection */}
      {cumulativeGpa !== null && (
        <Card className="p-4 border border-border space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">GPA Projection</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-[100px]">
              <label className="text-xs text-muted-foreground">Target GPA</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="4"
                className="h-8 text-xs mt-1"
                placeholder="e.g. 3.5"
                value={targetGpa}
                onChange={(e) => setTargetGpa(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[100px]">
              <label className="text-xs text-muted-foreground">Projected Credits</label>
              <Input
                type="number"
                min="1"
                className="h-8 text-xs mt-1"
                placeholder="e.g. 15"
                value={projCredits}
                onChange={(e) => setProjCredits(e.target.value)}
              />
            </div>
            <Button size="sm" className="mt-4" onClick={calculateProjection}>
              Project
            </Button>
          </div>
          {projection && (
            <p className="text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg">
              {projection}
            </p>
          )}
        </Card>
      )}
    </div>
  );
};
