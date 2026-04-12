import { useState, useMemo, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bus, Clock, MapPin, ArrowLeft, ChevronRight, Info, Train,
} from "lucide-react";
import { TransitMap } from "@/components/TransitMap";
import { PublicTransit, type WmataStation } from "@/components/PublicTransit";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  type LinePreferences,
  loadLinePreferences,
  saveLinePreferences,
} from "@/components/transit/LineFilterDrawer";
import {
  SHUTTLE_ROUTES,
  getRouteStatus,
  getNextDepartures,
  getStopSchedule,
  minutesUntilNext,
  type ShuttleRoute,
  type RouteStatus,
} from "@/data/shuttleData";

/* ── Status helpers ─────────────────────────────── */

const STATUS_CONFIG: Record<RouteStatus, { label: string; className: string }> = {
  active:             { label: "Active",              className: "bg-emerald-500/90 text-white" },
  inactive:           { label: "Inactive",            className: "bg-muted text-muted-foreground" },
  "weekend-no-service": { label: "No Service Today", className: "bg-amber-500/90 text-white" },
  "after-hours":      { label: "After Hours",         className: "bg-muted text-muted-foreground" },
};

const fmt = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/* ── Route Card ─────────────────────────────────── */

const RouteCard = ({
  route, isSelected, onClick, now,
}: {
  route: ShuttleRoute; isSelected: boolean; onClick: () => void; now: Date;
}) => {
  const status = getRouteStatus(route, now);
  const cfg = STATUS_CONFIG[status];
  const mins = minutesUntilNext(route, now);

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary shadow-md"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: route.color }} />
          <div>
            <h3 className="font-semibold text-sm text-foreground">{route.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                <Bus className="w-3 h-3 mr-1" /> Shuttle
              </Badge>
              <Badge className={cn("text-[10px] px-1.5 py-0 border-0", cfg.className)}>
                {cfg.label}
              </Badge>
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {status === "active" && mins !== null
            ? `Next in ${mins} min`
            : "Not running"}
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {route.stops.length} stops
        </div>
      </div>
    </Card>
  );
};

/* ── Schedule Panel ─────────────────────────────── */

const SchedulePanel = ({ route, now }: { route: ShuttleRoute; now: Date }) => {
  const status = getRouteStatus(route, now);
  const nextDeps = getNextDepartures(route, 5, now);
  const weekday = now.getDay() >= 1 && now.getDay() <= 5;
  const schedule = weekday ? route.weekday : route.weekend;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
            <h3 className="font-semibold text-foreground">{route.name}</h3>
          </div>
          <Badge className={cn("text-[10px] border-0", STATUS_CONFIG[status].className)}>
            {STATUS_CONFIG[status].label}
          </Badge>
        </div>

        {nextDeps.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">NEXT DEPARTURES</p>
            <div className="flex flex-wrap gap-2">
              {nextDeps.map((d, i) => (
                <Badge key={i} variant={i === 0 ? "default" : "outline"} className="text-xs">
                  {fmt(d)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            STOP-BY-STOP SCHEDULE {weekday ? "(Weekday)" : "(Weekend)"}
          </p>
          {schedule ? (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Stop Name</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Departure Times</th>
                  </tr>
                </thead>
                <tbody>
                  {route.stops.map((stop, si) => {
                    const times = getStopSchedule(route, si, now);
                    const upcoming = times.filter((t) => t >= now).slice(0, 6);
                    const display = upcoming.length > 0 ? upcoming : times.slice(-3);
                    return (
                      <tr key={si} className="border-t border-border">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {stop.isMajor ? (
                              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: route.color }} />
                            ) : (
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: route.color }} />
                            )}
                            <span className={cn("text-xs", stop.isMajor ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                              {stop.name}
                              {stop.isMajor && <span className="text-[10px] text-muted-foreground ml-1">★</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {display.map((t, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "text-xs px-1.5 py-0.5 rounded",
                                  t >= now ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                                )}
                              >
                                {fmt(t)}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 text-center">
              <Info className="w-5 h-5 mx-auto mb-1 opacity-50" />
              No service {weekday ? "today" : "on weekends"} for this route
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
          {route.weekday && (
            <p>
              <span className="font-medium">Weekday:</span>{" "}
              {route.weekday.startHour > 12 ? `${route.weekday.startHour - 12}:00 PM` : `${route.weekday.startHour}:00 AM`}
              {" – "}
              {route.weekday.endHour > 12 ? `${route.weekday.endHour - 12}:00 PM` : `${route.weekday.endHour}:00 AM`}
              {" · every "}{route.weekday.frequencyMin} min
            </p>
          )}
          {route.weekend && (
            <p>
              <span className="font-medium">Weekend:</span>{" "}
              {route.weekend.startHour > 12 ? `${route.weekend.startHour - 12}:00 PM` : `${route.weekend.startHour}:00 AM`}
              {" – "}
              {route.weekend.endHour > 12 ? `${route.weekend.endHour - 12}:00 PM` : `${route.weekend.endHour}:00 AM`}
              {" · every "}{route.weekend.frequencyMin} min
            </p>
          )}
          {!route.weekend && (
            <p className="text-amber-600 dark:text-amber-400">
              <span className="font-medium">No weekend service</span>
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

/* ── Main Dashboard ─────────────────────────────── */

export const TransitDashboard = () => {
  const navigate = useNavigate();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [tab, setTab] = useState("shuttles");
  const [metroStation, setMetroStation] = useState<WmataStation | null>(null);
  const [selectedMetroLine, setSelectedMetroLine] = useState<string | null>(null);
  const [linePreferences, setLinePreferences] = useState<LinePreferences>(loadLinePreferences);

  const handlePrefsChange = useCallback((prefs: LinePreferences) => {
    setLinePreferences(prefs);
    saveLinePreferences(prefs);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const selectedRoute = useMemo(
    () => SHUTTLE_ROUTES.find((r) => r.id === selectedRouteId) ?? null,
    [selectedRouteId]
  );

  const sortedRoutes = useMemo(() => {
    const order: Record<RouteStatus, number> = {
      active: 0, "after-hours": 1, inactive: 2, "weekend-no-service": 3,
    };
    return [...SHUTTLE_ROUTES].sort(
      (a, b) => order[getRouteStatus(a, now)] - order[getRouteStatus(b, now)]
    );
  }, [now]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Transit & Shuttles</h1>
            <p className="text-xs text-muted-foreground">
              Howard University Transit ·{" "}
              {now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Map */}
        <TransitMap
          routes={SHUTTLE_ROUTES}
          selectedRouteId={selectedRouteId}
          metroStation={metroStation}
          selectedMetroLine={selectedMetroLine}
          linePreferences={linePreferences}
          activeTab={tab as 'shuttles' | 'public-transit'}
        />

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setSelectedRouteId(null); setMetroStation(null); setSelectedMetroLine(null); }}>
          <TabsList className="w-full max-w-sm">
            <TabsTrigger value="shuttles" className="flex-1 gap-1.5">
              <Bus className="w-4 h-4" /> Campus Shuttles
            </TabsTrigger>
            <TabsTrigger value="public-transit" className="flex-1 gap-1.5">
              <Train className="w-4 h-4" /> Public Transit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shuttles" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Shuttle Routes
                </h2>
                {sortedRoutes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isSelected={selectedRouteId === route.id}
                    onClick={() =>
                      setSelectedRouteId(selectedRouteId === route.id ? null : route.id)
                    }
                    now={now}
                  />
                ))}
              </div>
              <div>
                {selectedRoute ? (
                  <SchedulePanel route={selectedRoute} now={now} />
                ) : (
                  <Card className="p-8 text-center text-muted-foreground text-sm">
                    <MapPin className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    Select a route to view the full schedule
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="public-transit" className="mt-4">
            <PublicTransit
              onStationSelect={setMetroStation}
              onLineSelect={setSelectedMetroLine}
              linePreferences={linePreferences}
              onLinePreferencesChange={handlePrefsChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
