import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, MapPin, Clock, Utensils, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import img1867cafe from "@/assets/dining/1867cafe.avif";
import imgAnnexCafe from "@/assets/dining/annexcafe.avif";
import imgBisonBrew from "@/assets/dining/bisonbrew.avif";
import imgBisonBread from "@/assets/dining/bisonbread.avif";
import imgPunchout from "@/assets/dining/punchout.avif";
import imgWtowers from "@/assets/dining/wtowers.avif";
import img202Market from "@/assets/dining/202market.avif";
import imgAnnexMarket from "@/assets/dining/annexmarket.avif";
import imgEvb from "@/assets/dining/evb.avif";
import imgHalal from "@/assets/dining/halal.avif";
import imgBlackburnCafe from "@/assets/dining/blackburncafe.avif";
import imgChickfila from "@/assets/dining/chickfila.avif";

/* Map url_key (or partial name match) → local image */
const LOCAL_IMAGE_MAP: Record<string, string> = {
  "1867-cafe": img1867cafe,
  "bethune-annex-cafe": imgAnnexCafe,
  "bison-brew": imgBisonBrew,
  "bison-bread-co": imgBisonBread,
  "the-drop-at-punchout": imgPunchout,
  "the-market-at-west-towers": imgWtowers,
  "202-market": img202Market,
  "the-market-at-bethune-annex": imgAnnexMarket,
  "everbowl": imgEvb,
  "the-halal-shack": imgHalal,
  "blackburn-cafe": imgBlackburnCafe,
  "chick-fil-a": imgChickfila,
};

function resolveImage(loc: { urlKey: string; name: string; imageUrl: string }): string {
  if (LOCAL_IMAGE_MAP[loc.urlKey]) return LOCAL_IMAGE_MAP[loc.urlKey];
  // fallback: try matching by normalized name
  const normalized = loc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-");
  if (LOCAL_IMAGE_MAP[normalized]) return LOCAL_IMAGE_MAP[normalized];
  return loc.imageUrl;
}

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

interface DiningLocationsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiningLocations({ open, onOpenChange }: DiningLocationsProps) {
  const [locations, setLocations] = useState<DiningLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function fetchLocations() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke("dining-scrape");
        if (fnError) throw fnError;
        if (!cancelled) {
          setLocations(data?.locations ?? []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load dining locations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLocations();
    return () => { cancelled = true; };
  }, [open]);

  const filtered = filter === "open" ? locations.filter((l) => l.isOpen) : locations;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Utensils className="h-5 w-5 text-primary" />
            Howard University Dining
          </DialogTitle>
        </DialogHeader>

        <Tabs value={filter} onValueChange={setFilter} className="mt-2">
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
      </DialogContent>
    </Dialog>
  );
}
