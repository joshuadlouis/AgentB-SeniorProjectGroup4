import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Train, Bus, RefreshCw, Clock, MapPin, Search, ChevronRight, Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  LineFilterDrawer,
  type LinePreferences,
  loadLinePreferences,
  saveLinePreferences,
  isAnyFilterActive,
} from "@/components/transit/LineFilterDrawer";

/* ── WMATA colors ─────────────────────────────────── */

export const WMATA_LINE_COLORS: Record<string, string> = {
  RD: "#BF0D3E",
  OR: "#ED8B00",
  SV: "#919D9D",
  BL: "#009CDE",
  YL: "#FFD200",
  GR: "#00B050",
  "RD,BL,OR,SV": "#888",
};

export function lineColor(lineCode: string): string {
  return WMATA_LINE_COLORS[lineCode] || "#888";
}

/* ── Types ────────────────────────────────────────── */

export interface WmataStation {
  Code: string;
  Name: string;
  Lat: number;
  Lon: number;
  LineCode1: string | null;
  LineCode2: string | null;
  LineCode3: string | null;
  LineCode4: string | null;
}

interface RailPrediction {
  LocationCode: string;
  LocationName: string;
  Line: string;
  Destination: string;
  DestinationCode: string;
  Min: string;
  Car: string;
  Group: string;
}

interface BusPrediction {
  StopName: string;
  RouteID: string;
  DirectionText: string;
  Minutes: number;
  VehicleID: string;
  TripID: string;
}

/* ── WMATA API helpers ────────────────────────────── */

async function wmataFetch(endpoint: string, params?: Record<string, string>) {
  const { data, error } = await supabase.functions.invoke("wmata-proxy", {
    body: { endpoint, params },
  });
  if (error) throw error;
  return data;
}

/* ── Helpers ──────────────────────────────────────── */

const getLineCodes = (s: WmataStation) =>
  [s.LineCode1, s.LineCode2, s.LineCode3, s.LineCode4].filter(Boolean) as string[];

function stationPassesFilter(station: WmataStation, prefs: LinePreferences): boolean {
  const codes = getLineCodes(station);
  return codes.some((c) => prefs[c] !== false);
}

/* ── Component ────────────────────────────────────── */

interface PublicTransitProps {
  onStationSelect?: (station: WmataStation | null) => void;
}

export const PublicTransit = ({ onStationSelect }: PublicTransitProps) => {
  const [stations, setStations] = useState<WmataStation[]>([]);
  const [railPredictions, setRailPredictions] = useState<RailPrediction[]>([]);
  const [busPredictions, setBusPredictions] = useState<BusPrediction[]>([]);
  const [selectedStation, setSelectedStation] = useState<WmataStation | null>(null);
  const [busStopId, setBusStopId] = useState("1001195");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [mode, setMode] = useState<"rail" | "bus">("rail");
  const [linePreferences, setLinePreferences] = useState<LinePreferences>(loadLinePreferences);

  const handlePrefsChange = useCallback((prefs: LinePreferences) => {
    setLinePreferences(prefs);
    saveLinePreferences(prefs);
  }, []);

  const filtersActive = isAnyFilterActive(linePreferences);

  // Fetch station list on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await wmataFetch("/Rail.svc/json/jStations");
        setStations(data.Stations || []);
      } catch (e) {
        console.error("Failed to fetch stations:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchRailPredictions = useCallback(async (stationCode?: string) => {
    try {
      setRefreshing(true);
      const endpoint = stationCode
        ? `/StationPrediction.svc/json/GetPrediction/${stationCode}`
        : "/StationPrediction.svc/json/GetPrediction/All";
      const data = await wmataFetch(endpoint);
      setRailPredictions(data.Trains || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Failed to fetch rail predictions:", e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchBusPredictions = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await wmataFetch("/NextBusService.svc/json/jPredictions", {
        StopID: busStopId,
      });
      setBusPredictions(data.Predictions || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Failed to fetch bus predictions:", e);
    } finally {
      setRefreshing(false);
    }
  }, [busStopId]);

  useEffect(() => {
    const refresh = () => {
      if (mode === "rail") fetchRailPredictions(selectedStation?.Code);
      else fetchBusPredictions();
    };
    refresh();
    const id = setInterval(refresh, 20_000);
    return () => clearInterval(id);
  }, [mode, selectedStation, fetchRailPredictions, fetchBusPredictions]);

  const handleStationSelect = (station: WmataStation) => {
    setSelectedStation(station);
    onStationSelect?.(station);
    fetchRailPredictions(station.Code);
  };

  // Filtered stations: search + line prefs
  const filteredStations = useMemo(
    () =>
      stations
        .filter((s) => s.Name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter((s) => stationPassesFilter(s, linePreferences)),
    [stations, searchQuery, linePreferences]
  );

  // Filtered predictions: line prefs
  const filteredPredictions = useMemo(() => {
    const base = selectedStation
      ? railPredictions.filter((p) => p.LocationCode === selectedStation.Code)
      : railPredictions.slice(0, 30);
    return base.filter((p) => !p.Line || linePreferences[p.Line] !== false);
  }, [railPredictions, selectedStation, linePreferences]);

  return (
    <div className="space-y-4">
      {/* Mode toggle + settings + refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={mode === "rail" ? "default" : "outline"}
            size="sm"
            onClick={() => { setMode("rail"); setSelectedStation(null); onStationSelect?.(null); }}
            className="gap-1.5"
          >
            <Train className="w-4 h-4" /> Metrorail
          </Button>
          <Button
            variant={mode === "bus" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("bus")}
            className="gap-1.5"
          >
            <Bus className="w-4 h-4" /> Metrobus
          </Button>

          {mode === "rail" && (
            <>
              <LineFilterDrawer preferences={linePreferences} onChange={handlePrefsChange} />
              {filtersActive && (
                <Badge variant="secondary" className="text-[10px] gap-1 px-2 py-0.5">
                  <Filter className="w-3 h-3" /> Filters Active
                </Badge>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => mode === "rail" ? fetchRailPredictions(selectedStation?.Code) : fetchBusPredictions()}
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {mode === "rail" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Station list */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Loading stations…</p>
              ) : filteredStations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No stations match{filtersActive ? " (check your line filters)" : ""}.
                </p>
              ) : (
                filteredStations.slice(0, 50).map((station) => (
                  <Card
                    key={station.Code}
                    className={cn(
                      "p-3 cursor-pointer transition-all hover:shadow-md",
                      selectedStation?.Code === station.Code && "ring-2 ring-primary shadow-md"
                    )}
                    onClick={() => handleStationSelect(station)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground">{station.Name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getLineCodes(station).map((lc) => (
                          <div
                            key={lc}
                            className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center",
                              linePreferences[lc] === false && "opacity-30"
                            )}
                            style={{ backgroundColor: lineColor(lc) }}
                          >
                            <span className="text-[8px] font-bold text-white">{lc.charAt(0)}</span>
                          </div>
                        ))}
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-1" />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Predictions */}
          <div>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-foreground">
                  {selectedStation ? `${selectedStation.Name} — Next Trains` : "All Stations — Next Trains"}
                </h3>
                <Badge variant="outline" className="text-[10px]">
                  <Clock className="w-3 h-3 mr-1" /> Live
                </Badge>
              </div>

              {filteredPredictions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {selectedStation
                    ? `No upcoming trains${filtersActive ? " (some lines filtered)" : ""}.`
                    : "Select a station to view predictions."}
                </p>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Line</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Dest</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Min</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Cars</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPredictions.map((p, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2">
                            <Badge
                              className="text-[10px] px-1.5 py-0 border-0 text-white font-bold"
                              style={{ backgroundColor: lineColor(p.Line) }}
                            >
                              {p.Line || "—"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-xs text-foreground">{p.Destination || "—"}</td>
                          <td className="px-3 py-2 text-xs text-right font-semibold">
                            {p.Min === "ARR" ? (
                              <span className="text-green-600">ARR</span>
                            ) : p.Min === "BRD" ? (
                              <span className="text-blue-600">BRD</span>
                            ) : p.Min === "" || p.Min === "---" ? (
                              "—"
                            ) : (
                              <span>{p.Min} min</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-right text-muted-foreground">
                            {p.Car || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* ── Metrobus ──────────────────────────────── */
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Bus Stop ID (e.g. 1001195)"
              value={busStopId}
              onChange={(e) => setBusStopId(e.target.value)}
              className="h-9 text-sm max-w-xs"
            />
            <Button size="sm" onClick={fetchBusPredictions} disabled={refreshing}>
              {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Get Arrivals"}
            </Button>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-foreground">
                Bus Stop #{busStopId} — Next Arrivals
              </h3>
              <Badge variant="outline" className="text-[10px]">
                <Clock className="w-3 h-3 mr-1" /> Live
              </Badge>
            </div>

            {busPredictions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No upcoming bus arrivals for this stop.
              </p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Route</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Direction</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Minutes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {busPredictions.map((p, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2">
                          <Badge variant="secondary" className="text-[10px] font-bold">
                            {p.RouteID}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs text-foreground">{p.DirectionText}</td>
                        <td className="px-3 py-2 text-xs text-right font-semibold">
                          {p.Minutes === 0 ? (
                            <span className="text-green-600">NOW</span>
                          ) : (
                            <span>{p.Minutes} min</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
