import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ShuttleRoute } from "@/data/shuttleData";
import { type WmataStation, lineColor, getLineCodes } from "@/components/PublicTransit";
import { WMATA_LINES_GEO } from "@/data/wmataLines";
import type { LinePreferences } from "@/components/transit/LineFilterDrawer";
import { fetchAllRoutes } from "@/lib/osrmRouting";

interface TransitMapProps {
  routes: ShuttleRoute[];
  selectedRouteId: string | null;
  metroStation?: WmataStation | null;
  selectedMetroLine?: string | null;
  linePreferences?: LinePreferences;
  activeTab: "shuttles" | "public-transit";
}

/* ── Custom marker icons ─────────────────────────── */

function createMajorIcon(color: string) {
  return L.divIcon({
    className: "major-stop-marker",
    html: `<div style="
      width:22px;height:22px;border-radius:5px;
      background:${color};border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
    "><svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2'/><path d='M12 8v8'/><path d='M8 12h8'/></svg></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function createMinorIcon(color: string) {
  return L.divIcon({
    className: "minor-stop-marker",
    html: `<div style="
      width:12px;height:12px;border-radius:50%;
      background:${color};border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function createMetroIcon(lineCodes: string[]) {
  const color = lineColor(lineCodes[0] || "");
  return L.divIcon({
    className: "metro-station-marker",
    html: `<div style="
      width:22px;height:22px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
    "><div style="width:8px;height:8px;border-radius:50%;background:white;"></div></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

/* ── Main component ──────────────────────────────── */

export const TransitMap = ({
  routes,
  selectedRouteId,
  metroStation,
  selectedMetroLine,
  linePreferences,
  activeTab,
}: TransitMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.LayerGroup>(L.layerGroup());
  const metroLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const metroLinesLayerRef = useRef<L.LayerGroup>(L.layerGroup());

  // OSRM-resolved street-level paths, keyed by route id
  const [osrmPaths, setOsrmPaths] = useState<Record<string, [number, number][]>>({});
  const fetchedRef = useRef(false);

  /* ── 1. Initialize Leaflet map ───────────────── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [38.9225, -77.021],
      zoom: 14,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layersRef.current.addTo(map);
    metroLayerRef.current.addTo(map);
    metroLinesLayerRef.current.addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ── 2. Fetch OSRM routes once (cached in localStorage) ── */
  useEffect(() => {
    if (fetchedRef.current || routes.length === 0) return;
    fetchedRef.current = true;

    fetchAllRoutes(routes).then((paths) => {
      setOsrmPaths(paths);
    });
  }, [routes]);

  /* ── 3. Draw shuttle routes ──────────────────── */
  const drawRoutes = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.clearLayers();

    if (activeTab !== "shuttles") return;

    const allPoints: [number, number][] = [];

    for (const route of routes) {
      const isSelected = selectedRouteId === route.id;

      // Priority: OSRM path > hardcoded path > stop-to-stop straight lines
      const osrmPath = osrmPaths[route.id];
      const pathCoords: [number, number][] =
        osrmPath && osrmPath.length >= 2
          ? osrmPath
          : route.path.length >= 2
            ? route.path
            : route.stops.map((s) => [s.lat, s.lng]);

      allPoints.push(...pathCoords);

      const polyline = L.polyline(pathCoords, {
        color: route.color,
        weight: isSelected ? 6 : 4,
        opacity: selectedRouteId ? (isSelected ? 0.98 : 0.3) : 0.85,
        lineCap: "round",
        lineJoin: "round",
      });
      layersRef.current.addLayer(polyline);
    }

    // Show markers only for the selected route
    if (selectedRouteId) {
      const selected = routes.find((r) => r.id === selectedRouteId);
      if (selected) {
        selected.stops.forEach((stop) => {
          const icon = stop.isMajor
            ? createMajorIcon(selected.color)
            : createMinorIcon(selected.color);
          const marker = L.marker([stop.lat, stop.lng], { icon });
          marker.bindPopup(
            `<div style="font-size:13px">
              <strong>${stop.name}</strong>
              ${stop.isMajor ? ' <span style="color:#003A70;font-size:10px;">★ Major Stop</span>' : ""}
              <br/><span style="color:#888;font-size:11px">${selected.name}</span>
              <br/><span style="color:#aaa;font-size:10px">${stop.address}</span>
            </div>`
          );
          layersRef.current.addLayer(marker);
        });

        // fitBounds on the actual rendered path for the selected route
        const osrmPath = osrmPaths[selected.id];
        const boundsCoords =
          osrmPath && osrmPath.length >= 2
            ? osrmPath
            : selected.path.length >= 2
              ? selected.path
              : selected.stops.map((s) => [s.lat, s.lng] as [number, number]);
        const bounds = L.latLngBounds(boundsCoords);
        map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
        return;
      }
    }

    // Default: center on Howard campus
    if (allPoints.length > 0) {
      map.flyTo([38.9225, -77.021], 14, { duration: 0.8 });
    }
  }, [routes, selectedRouteId, activeTab, osrmPaths]);

  useEffect(() => {
    drawRoutes();
  }, [drawRoutes]);

  /* ── 4. Metro lines (GeoJSON) ────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    metroLinesLayerRef.current.clearLayers();

    if (activeTab !== "public-transit") return;

    for (const line of WMATA_LINES_GEO) {
      if (linePreferences && linePreferences[line.code] === false) continue;
      const isHighlighted = selectedMetroLine === line.code;
      const polyline = L.polyline(line.path, {
        color: line.color,
        weight: isHighlighted ? 6 : 3,
        opacity: selectedMetroLine ? (isHighlighted ? 1 : 0.2) : 0.6,
      });
      metroLinesLayerRef.current.addLayer(polyline);
    }

    if (selectedMetroLine) {
      const lineGeo = WMATA_LINES_GEO.find(
        (l) => l.code === selectedMetroLine
      );
      if (lineGeo && lineGeo.path.length > 0) {
        const bounds = L.latLngBounds(lineGeo.path);
        map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
      }
    }
  }, [selectedMetroLine, linePreferences, activeTab]);

  /* ── 5. Metro station marker ─────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    metroLayerRef.current.clearLayers();

    if (activeTab !== "public-transit" || !metroStation) return;

    const codes = getLineCodes(metroStation);
    const icon = createMetroIcon(codes);
    const marker = L.marker([metroStation.Lat, metroStation.Lon], { icon });

    const lineLabels = codes
      .map(
        (lc) =>
          `<span style="background:${lineColor(lc)};color:white;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:bold;">${lc}</span>`
      )
      .join(" ");

    marker
      .bindPopup(
        `<div style="font-size:13px">
        <strong>🚇 ${metroStation.Name}</strong>
        <br/><div style="margin-top:4px">${lineLabels}</div>
      </div>`
      )
      .openPopup();

    metroLayerRef.current.addLayer(marker);
    map.flyTo([metroStation.Lat, metroStation.Lon], 15, { duration: 0.8 });
  }, [metroStation, activeTab]);

  /* ── 6. Tab switch centering ─────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activeTab === "shuttles") {
      map.flyTo([38.9225, -77.021], 14, { duration: 0.8 });
    } else {
      map.flyTo([38.917, -77.022], 13, { duration: 0.8 });
    }
  }, [activeTab]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[400px] rounded-xl overflow-hidden border border-border shadow-sm z-0"
    />
  );
};
