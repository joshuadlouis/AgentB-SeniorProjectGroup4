import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ShuttleRoute } from "@/data/shuttleData";
import { type WmataStation, lineColor, getLineCodes } from "@/components/PublicTransit";
import { WMATA_LINES_GEO } from "@/data/wmataLines";
import type { LinePreferences } from "@/components/transit/LineFilterDrawer";

interface TransitMapProps {
  routes: ShuttleRoute[];
  selectedRouteId: string | null;
  metroStation?: WmataStation | null;
  selectedMetroLine?: string | null;
  linePreferences?: LinePreferences;
  activeTab: 'shuttles' | 'public-transit';
}

function createMajorIcon(color: string) {
  return L.divIcon({
    className: "major-stop-marker",
    html: `<div style="
      width:20px;height:20px;border-radius:4px;
      background:${color};border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
    "><div style="width:6px;height:6px;border-radius:50%;background:white;"></div></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
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

export const TransitMap = ({ routes, selectedRouteId, metroStation, selectedMetroLine, linePreferences, activeTab }: TransitMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.LayerGroup>(L.layerGroup());
  const metroLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  const metroLinesLayerRef = useRef<L.LayerGroup>(L.layerGroup());
  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [38.9225, -77.0210],
      zoom: 14,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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

  // Draw shuttle routes
  const drawRoutes = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.clearLayers();

    if (activeTab !== 'shuttles') return;

    const visibleRoutes = selectedRouteId
      ? routes.filter((r) => r.id === selectedRouteId)
      : routes;

    const allPoints: [number, number][] = [];

    for (const route of visibleRoutes) {
      const stopCoords: [number, number][] = route.stops.map((s) => [s.lat, s.lng]);
      allPoints.push(...stopCoords);

      const cacheKey = route.id;
      let routePath = routeCache[cacheKey];
      if (!routePath && stopCoords.length >= 2) {
        routePath = await fetchOSRMRoute(stopCoords);
        setRouteCache((prev) => ({ ...prev, [cacheKey]: routePath! }));
      }

      const pathCoords = routePath && routePath.length > 0 ? routePath : stopCoords;
      if (pathCoords.length >= 2) {
        const polyline = L.polyline(pathCoords, {
          color: route.color,
          weight: selectedRouteId === route.id ? 5 : 3,
          opacity: 0.85,
        });
        layersRef.current.addLayer(polyline);
      }

      route.stops.forEach((stop) => {
        const icon = stop.isMajor
          ? createMajorIcon(route.color)
          : createMinorIcon(route.color);
        const marker = L.marker([stop.lat, stop.lng], { icon });
        marker.bindPopup(
          `<div style="font-size:13px">
            <strong>${stop.name}</strong>
            ${stop.isMajor ? ' <span style="color:#003A70;font-size:10px;">★ Major</span>' : ""}
            <br/><span style="color:#888;font-size:11px">${route.name}</span>
            <br/><span style="color:#aaa;font-size:10px">${stop.address}</span>
          </div>`
        );
        layersRef.current.addLayer(marker);
      });
    }

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      if (selectedRouteId) {
        map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
      } else {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [routes, selectedRouteId, routeCache, activeTab]);

  useEffect(() => {
    drawRoutes();
  }, [drawRoutes]);

  // Draw metro lines (GeoJSON polylines) filtered by preferences
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    metroLinesLayerRef.current.clearLayers();

    if (activeTab !== 'public-transit') return;

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
      const lineGeo = WMATA_LINES_GEO.find((l) => l.code === selectedMetroLine);
      if (lineGeo && lineGeo.path.length > 0) {
        const bounds = L.latLngBounds(lineGeo.path);
        map.flyToBounds(bounds, { padding: [50, 50], duration: 0.8 });
      }
    }
  }, [selectedMetroLine, linePreferences, activeTab]);

  // Draw metro station marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    metroLayerRef.current.clearLayers();

    if (activeTab !== 'public-transit' || !metroStation) return;

    const codes = getLineCodes(metroStation);
    const icon = createMetroIcon(codes);
    const marker = L.marker([metroStation.Lat, metroStation.Lon], { icon });

    const lineLabels = codes
      .map((lc) => `<span style="background:${lineColor(lc)};color:white;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:bold;">${lc}</span>`)
      .join(" ");

    marker.bindPopup(
      `<div style="font-size:13px">
        <strong>🚇 ${metroStation.Name}</strong>
        <br/><div style="margin-top:4px">${lineLabels}</div>
      </div>`
    ).openPopup();

    metroLayerRef.current.addLayer(marker);
    map.flyTo([metroStation.Lat, metroStation.Lon], 15, { duration: 0.8 });
  }, [metroStation, activeTab]);

  // Smooth center on tab switch
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activeTab === 'shuttles') {
      map.flyTo([38.9225, -77.0210], 14, { duration: 0.8 });
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
