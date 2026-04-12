import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Clock, Utensils, ExternalLink, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface MealPeriod {
  name: string;
  hours: string;
}

interface DiningLocation {
  name: string;
  urlKey: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  imageUrl: string;
  todayHours: string;
  isOpen: boolean;
  mealPeriods: MealPeriod[];
}

export default function DiningPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<DiningLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    async function fetchLocations() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke("dining-scrape");
        if (fnError) throw fnError;
        if (!cancelled) setLocations(data?.locations ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load dining locations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLocations();
    return () => { cancelled = true; };
  }, []);

  const filtered = filter === "open" ? locations.filter((l) => l.isOpen) : locations;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Dining Café Times
            </h1>
            <p className="text-xs text-muted-foreground">
              Howard University dining hours &amp; menus
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All ({locations.length})</TabsTrigger>
            <TabsTrigger value="open">
              Open Now ({locations.filter((l) => l.isOpen).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4 space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading dining locations…</span>
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-destructive">
                <p className="font-medium">Unable to load dining info</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                {filter === "open"
                  ? "No dining locations are currently open."
                  : "No dining locations found."}
              </p>
            )}

            {!loading &&
              !error &&
              filtered.map((loc) => (
                <Card key={loc.name} className="overflow-hidden border-border">
                  <div className="flex flex-col sm:flex-row">
                    {loc.imageUrl && (
                      <div className="sm:w-40 sm:min-h-[140px] flex-shrink-0">
                        <img
                          src={loc.imageUrl}
                          alt={loc.name}
                          className="w-full h-36 sm:h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-4 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground leading-tight">
                          {loc.name}
                        </h3>
                        <Badge
                          variant={loc.isOpen ? "default" : "secondary"}
                          className={
                            loc.isOpen
                              ? "bg-green-600 hover:bg-green-700 text-white shrink-0"
                              : "shrink-0"
                          }
                        >
                          {loc.isOpen ? "OPEN" : "CLOSED"}
                        </Badge>
                      </div>

                      {loc.address && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {loc.address}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        Today: {loc.todayHours}
                      </p>

                      {loc.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {loc.description}
                        </p>
                      )}

                      {["bethune-annex-cafe", "blackburn-cafe"].includes(loc.urlKey) && (
                        <a
                          href={`https://howard.mydininghub.com/en/locations/${loc.urlKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          View Today's Menu <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
