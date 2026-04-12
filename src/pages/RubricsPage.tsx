import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, Plus, BookOpen, Target, Loader2, Search, Eye, PenTool } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRubrics } from "@/hooks/useRubrics";
import { RubricCard } from "@/components/RubricCard";

export default function RubricsPage() {
  const { className } = useParams<{ className: string }>();
  const navigate = useNavigate();
  const decodedClass = decodeURIComponent(className || "");
  const { rubrics, examples, loading, generating, generateRubric, deleteRubric, updateRubricStatus, saveManualRubric, updateRubric, refetch } = useRubrics(decodedClass);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [bloomLevel, setBloomLevel] = useState<string | undefined>();
  const [showAllObjectives, setShowAllObjectives] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [createMode, setCreateMode] = useState<"ai" | "manual" | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Manual rubric form
  const [manualTitle, setManualTitle] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualCriteria, setManualCriteria] = useState([
    { name: "", description: "", weight: 25, levels: ["", "", "", ""] },
  ]);

  useEffect(() => {
    async function loadObjectives() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !decodedClass) return;

      const { data: syllabi } = await supabase
        .from("syllabi")
        .select("learning_objectives, bloom_classifications")
        .eq("class_name", decodedClass)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (syllabi?.learning_objectives) setObjectives(syllabi.learning_objectives);
      if (syllabi?.bloom_classifications) {
        const bc = syllabi.bloom_classifications as Record<string, any>;
        const topLevel = Object.entries(bc).sort(([, a]: any, [, b]: any) => (b?.count || 0) - (a?.count || 0))[0];
        if (topLevel) setBloomLevel(topLevel[0]);
      }
    }
    loadObjectives();
  }, [decodedClass]);

  const handleGenerate = () => {
    generateRubric(objectives, bloomLevel);
    setCreateDialogOpen(false);
  };

  const handleSaveManual = async () => {
    if (!manualTitle.trim()) return;
    const criteria = manualCriteria
      .filter(c => c.name.trim())
      .map((c, i) => ({
        criterion_name: c.name,
        description: c.description,
        weight: c.weight,
        criterion_order: i,
        performance_levels: [
          { level: "Exemplary", score: 4, description: c.levels[0] || "" },
          { level: "Proficient", score: 3, description: c.levels[1] || "" },
          { level: "Developing", score: 2, description: c.levels[2] || "" },
          { level: "Beginning", score: 1, description: c.levels[3] || "" },
        ],
      }));

    await saveManualRubric(manualTitle, manualDescription, criteria);
    setCreateDialogOpen(false);
    setManualTitle("");
    setManualDescription("");
    setManualCriteria([{ name: "", description: "", weight: 25, levels: ["", "", "", ""] }]);
  };

  const addCriterion = () => {
    setManualCriteria(prev => [...prev, { name: "", description: "", weight: 25, levels: ["", "", "", ""] }]);
  };

  const updateCriterion = (idx: number, field: string, value: any) => {
    setManualCriteria(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const updateCriterionLevel = (idx: number, levelIdx: number, value: string) => {
    setManualCriteria(prev => prev.map((c, i) => {
      if (i !== idx) return c;
      const levels = [...c.levels];
      levels[levelIdx] = value;
      return { ...c, levels };
    }));
  };

  // Filter rubrics
  const filteredRubrics = rubrics.filter(r => {
    const matchesSearch = !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" ||
      (activeTab === "published" && r.status === "published") ||
      (activeTab === "draft" && r.status === "draft") ||
      (activeTab === "ai" && r.source === "ai") ||
      (activeTab === "manual" && r.source === "manual");
    return matchesSearch && matchesTab;
  });

  const displayedObjectives = showAllObjectives ? objectives : objectives.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/course/${encodeURIComponent(decodedClass)}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Rubrics & Examples</h1>
            <p className="text-muted-foreground">{decodedClass}</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Rubric
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Rubric</DialogTitle>
                <DialogDescription>Choose how to create your rubric</DialogDescription>
              </DialogHeader>

              {!createMode ? (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => setCreateMode("ai")}
                    className="p-6 rounded-lg border-2 border-border hover:border-primary/50 transition-all text-center space-y-2"
                  >
                    <Sparkles className="w-8 h-8 mx-auto text-primary" />
                    <p className="font-semibold text-foreground">AI Generate</p>
                    <p className="text-xs text-muted-foreground">Auto-create from your learning objectives</p>
                  </button>
                  <button
                    onClick={() => setCreateMode("manual")}
                    className="p-6 rounded-lg border-2 border-border hover:border-primary/50 transition-all text-center space-y-2"
                  >
                    <PenTool className="w-8 h-8 mx-auto text-secondary" />
                    <p className="font-semibold text-foreground">Create Your Own</p>
                    <p className="text-xs text-muted-foreground">Build a custom rubric from scratch</p>
                  </button>
                </div>
              ) : createMode === "ai" ? (
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Generate a rubric aligned with {objectives.length} learning objectives from your syllabus.
                  </p>
                  {objectives.length > 0 && (
                    <div className="space-y-2">
                      <Label>Learning Objectives</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1 p-2 rounded-md bg-muted/30 border">
                        {objectives.map((obj, i) => (
                          <p key={i} className="text-xs text-muted-foreground">• {obj}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCreateMode(null)}>Back</Button>
                    <Button onClick={handleGenerate} disabled={generating} className="flex-1 gap-2">
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {generating ? "Generating..." : "Generate Rubric"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Rubric Title</Label>
                    <Input placeholder="e.g., Research Paper Rubric" value={manualTitle} onChange={e => setManualTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea placeholder="Brief description..." value={manualDescription} onChange={e => setManualDescription(e.target.value)} rows={2} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Criteria</Label>
                      <Button variant="ghost" size="sm" onClick={addCriterion} className="gap-1 text-xs">
                        <Plus className="w-3 h-3" /> Add
                      </Button>
                    </div>
                    {manualCriteria.map((c, idx) => (
                      <Card key={idx} className="p-3 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <Input placeholder="Criterion name" value={c.name} onChange={e => updateCriterion(idx, "name", e.target.value)} className="text-sm" />
                          </div>
                          <Input type="number" placeholder="Weight %" value={c.weight} onChange={e => updateCriterion(idx, "weight", parseInt(e.target.value) || 0)} className="text-sm" />
                        </div>
                        <Input placeholder="Description (optional)" value={c.description} onChange={e => updateCriterion(idx, "description", e.target.value)} className="text-sm" />
                        <div className="grid grid-cols-2 gap-1">
                          {["Exemplary (4)", "Proficient (3)", "Developing (2)", "Beginning (1)"].map((label, li) => (
                            <Input key={li} placeholder={label} value={c.levels[li]} onChange={e => updateCriterionLevel(idx, li, e.target.value)} className="text-xs" />
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCreateMode(null)}>Back</Button>
                    <Button onClick={handleSaveManual} disabled={!manualTitle.trim()} className="flex-1">
                      Save Rubric
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rubrics.length}</p>
                <p className="text-sm text-muted-foreground">Total Rubrics</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <BookOpen className="h-5 w-5 text-green-700 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rubrics.filter(r => r.status === "published").length}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/50">
                <Sparkles className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{objectives.length}</p>
                <p className="text-sm text-muted-foreground">Learning Objectives</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Objectives */}
        {objectives.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Learning Objectives
                </h3>
                {objectives.length > 5 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAllObjectives(!showAllObjectives)} className="text-xs">
                    {showAllObjectives ? "Show Less" : `See All (${objectives.length})`}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {displayedObjectives.map((obj, i) => (
                  <Badge key={i} variant="outline" className="text-xs font-normal max-w-[300px] truncate whitespace-normal text-left">
                    {obj}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search rubrics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
              <TabsTrigger value="manual">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Rubrics list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : filteredRubrics.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {rubrics.length === 0 ? "No Rubrics Yet" : "No matching rubrics"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {rubrics.length === 0
                  ? "Generate an AI-powered rubric or create your own."
                  : "Try adjusting your search or filter."}
              </p>
              {rubrics.length === 0 && (
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Rubric
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRubrics.map(rubric => (
              <RubricCard
                key={rubric.id}
                rubric={rubric}
                examples={examples[rubric.id] || []}
                onDelete={deleteRubric}
                onToggleStatus={updateRubricStatus}
                onUpdate={updateRubric}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
